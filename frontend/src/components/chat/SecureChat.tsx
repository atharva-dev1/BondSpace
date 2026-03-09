"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Pin, Clock, Mic, MicOff, Square, Play, Pause, Paperclip, Heart, Smile, Sparkles, AlertCircle, Info, X, Sticker } from 'lucide-react';
import { encryptMessage, decryptMessage } from '@/lib/encryption';
import MoodSelector from './MoodSelector';

const moodIcons: Record<string, string> = {
    romantic: '❤️',
    excited: '⚡',
    calm: '🌙',
    sad: '☁️',
    spicy: '🔥',
    tired: '💤',
};

interface Message {
    id: string;
    sender_id: string;
    message: string;
    message_type: string;
    media_url?: string;
    timestamp: string;
    is_pinned?: boolean;
    reactions?: string[];
    is_disappearing?: boolean;
}

export default function SecureChat() {
    const { user, token, bond, socket, encryptionKey, isLocked, lockChat, partnerMood } = useStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isDisappearing, setIsDisappearing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showMoodSelector, setShowMoodSelector] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Stickers state
    const [showStickers, setShowStickers] = useState(false);
    const [myStickers, setMyStickers] = useState<{ id: string, name: string, media_url: string }[]>([]);

    // Voice note state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
    // Local blob URLs for sender’s own voice notes (avoids waiting for socket roundtrip)
    const localBlobUrls = useRef<Map<string, string>>(new Map());
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const [auraUpdate, setAuraUpdate] = useState<any>(null);
    const [guruIntervention, setGuruIntervention] = useState<any>(null);

    // --- Reliable Web Audio API Playback ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const currentPlayingUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (bond?.id && token) {
            axios.get(`${API_URL}/messages/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(async (res) => {
                const fetched = res.data.messages;
                const decrypted = await Promise.all(
                    fetched.map(async (msg: Message) => {
                        if (msg.message_type === 'voice' || msg.message_type === 'sticker') return msg;
                        try {
                            const plaintext = encryptionKey
                                ? await decryptMessage(msg.message, encryptionKey)
                                : msg.message;
                            return { ...msg, message: plaintext };
                        } catch {
                            return { ...msg, message: '[Decryption Failed]' };
                        }
                    })
                );
                setMessages(decrypted);
            }).catch(console.error).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }

        // Fetch unlocked stickers
        if (token) {
            axios.get(`${API_URL}/store`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    const { items, inventory } = res.data;
                    const unlockedItems = items.filter((item: any) => (item.type === 'sticker' || item.type === 'sticker_pack') && inventory.includes(item.id));
                    const flattenedStickers: { id: string, name: string, media_url: string }[] = [];
                    unlockedItems.forEach((item: any) => {
                        if (item.type === 'sticker_pack') {
                            try {
                                const emojis = JSON.parse(item.media_url);
                                if (Array.isArray(emojis)) {
                                    emojis.forEach((emoji, i) => {
                                        flattenedStickers.push({ id: `${item.id}-${i}`, name: `${item.name} ${i}`, media_url: emoji });
                                    });
                                }
                            } catch (e) { console.error('Failed to parse sticker pack', e); }
                        } else {
                            flattenedStickers.push(item);
                        }
                    });
                    setMyStickers(flattenedStickers);
                }).catch(console.error);
        }
    }, [bond?.id, token, encryptionKey]);

    useEffect(() => {
        if (!socket) return;
        const handleMsg = async (msg: Message) => {
            if (msg.message_type === 'voice' || msg.message_type === 'sticker') {
                setMessages(prev => [...prev, msg]);
                return;
            }
            try {
                const plaintext = encryptionKey
                    ? await decryptMessage(msg.message, encryptionKey)
                    : msg.message;
                setMessages(prev => [...prev, { ...msg, message: plaintext }]);
            } catch {
                setMessages(prev => [...prev, { ...msg, message: '[Decryption Failed]' }]);
            }
        };
        const handleReaction = ({ message_id, emoji }: { message_id: string; emoji: string }) => {
            setMessages(prev => prev.map(m => m.id === message_id ? { ...m, reactions: [...(m.reactions || []), emoji] } : m));
        };
        socket.on('receive_message', handleMsg);
        socket.on('message_reacted', handleReaction);

        socket.on('guru:aura_update', (data) => {
            setAuraUpdate(data);
            setTimeout(() => setAuraUpdate(null), 5000);
        });

        socket.on('guru:intervention', (data) => {
            setGuruIntervention(data);
        });

        return () => {
            socket.off('receive_message', handleMsg);
            socket.off('message_reacted', handleReaction);
            socket.off('guru:aura_update');
            socket.off('guru:intervention');
        };
    }, [socket, encryptionKey]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !socket) return;
        const plaintext = input;
        setInput('');
        try {
            const ciphertext = encryptionKey ? await encryptMessage(plaintext, encryptionKey) : plaintext;
            socket.emit('send_message', {
                message: ciphertext,
                message_type: 'text',
                ...(isDisappearing && { is_disappearing: true, expires_in_seconds: 3600 })
            });
        } catch (err) {
            console.error('Encryption failed:', err);
        }
    };

    const handleSendSticker = (mediaUrl: string) => {
        if (!socket) return;
        setShowStickers(false);
        socket.emit('send_message', {
            message: mediaUrl,
            message_type: 'sticker'
        });
    };

    const startRecording = async () => {
        try {
            // On Android (Capacitor), we must request microphone permission at the native layer first
            let permissionGranted = true;
            if (typeof (window as any).Capacitor !== 'undefined') {
                try {
                    // Use native permission request
                    const perms = await (navigator as any).permissions?.query({ name: 'microphone' }).catch(() => null);
                    if (perms?.state === 'denied') {
                        permissionGranted = false;
                        alert('Microphone permission denied. Please enable it in your device Settings → Apps → BondSpace → Permissions.');
                        return;
                    }
                } catch (e) {
                    // Ignore — proceed with getUserMedia which will trigger the native dialog
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
            });
            let mimeType = '';
            if (MediaRecorder.isTypeSupported('audio/mp4')) { mimeType = 'audio/mp4'; }
            else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) { mimeType = 'audio/webm;codecs=opus'; }
            else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) { mimeType = 'audio/ogg;codecs=opus'; }

            const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            chunksRef.current = [];
            mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mr.start();
            mediaRecorderRef.current = mr;
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } catch (err: any) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert('Microphone access denied.\n\nPlease go to:\nSettings → Apps → BondSpace → Permissions → Microphone → Allow');
            } else {
                alert('Could not access microphone. ' + (err.message || ''));
            }
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const cancelRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        setAudioBlob(null);
        chunksRef.current = [];
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const sendVoiceNote = () => {
        if (!audioBlob || !socket) return;
        if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null; }
        setPreviewPlaying(false);
        const reader = new FileReader();
        reader.onload = () => {
            socket.emit('send_message', {
                message: '🎤 Voice note',
                message_type: 'voice',
                media_url: reader.result as string
            });
            setAudioBlob(null);
        };
        reader.readAsDataURL(audioBlob);
    };

    const playWebAudio = async (url: string, id: string, isPreview: boolean) => {
        try {
            if (!audioContextRef.current) audioContextRef.current = new AudioContext();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            if (currentSourceRef.current) {
                currentSourceRef.current.stop();
                currentSourceRef.current.disconnect();
                currentSourceRef.current = null;
            }

            if (currentPlayingUrlRef.current === url) {
                currentPlayingUrlRef.current = null;
                setPlayingId(null);
                setPreviewPlaying(false);
                return;
            }

            if (isPreview) { setPreviewPlaying(true); setPlayingId(null); }
            else { setPlayingId(id); setPreviewPlaying(false); }

            currentPlayingUrlRef.current = url;
            const res = await fetch(url);
            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => {
                if (currentPlayingUrlRef.current === url) {
                    currentPlayingUrlRef.current = null;
                    if (isPreview) setPreviewPlaying(false);
                    else setPlayingId(null);
                }
            };
            source.start(0);
            currentSourceRef.current = source;
        } catch (err) {
            console.error('Playback failed:', err);
            if (isPreview) setPreviewPlaying(false);
            else setPlayingId(null);
            currentPlayingUrlRef.current = null;
        }
    };

    const togglePreviewPlay = () => {
        if (!audioBlob) return;
        const url = URL.createObjectURL(audioBlob);
        playWebAudio(url, 'preview', true);
    };

    const togglePlayVoice = (msgId: string, url: string) => {
        const localUrl = localBlobUrls.current.get(msgId) || url;
        const playUrl = (localUrl && localUrl.startsWith('blob:')) ? localUrl : url;
        playWebAudio(playUrl, msgId, false);
    };

    const handleLoveReact = (msgId: string) => {
        if (!socket) return;
        socket.emit('react_message', { message_id: msgId, emoji: '❤️' });
    };

    const handlePinMessage = async (msgId: string) => {
        try {
            await axios.post(`${API_URL}/messages/${msgId}/pin`, { label: '⭐' }, { headers: { Authorization: `Bearer ${token}` } });
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: true } : m));
        } catch { }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    if (loading) return (
        <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
    );

    const partnerName = bond?.user1_id === user?.id ? bond?.user2_name : bond?.user1_name;
    const partnerAvatar = bond?.user1_id === user?.id ? bond?.user2_avatar : bond?.user1_avatar;

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
            <div className="absolute inset-0 chat-wallpaper z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

            {/* Premium Header Card */}
            <header className="px-4 pt-4 pb-2 z-20 flex-shrink-0">
                <div className="glass bg-black/40 backdrop-blur-2xl rounded-[32px] p-3 border border-white/5 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg ring-2 ring-white/10">
                                {partnerAvatar || '❤️'}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black shadow-glow" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-[15px] leading-none uppercase tracking-tight flex items-center gap-2">
                                {partnerName || 'Partner'}
                                {partnerMood && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-sm filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                    >
                                        {moodIcons[partnerMood.toLowerCase()] || ''}
                                    </motion.span>
                                )}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{partnerMood ? partnerMood : 'Active Now'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMoodSelector(true)}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 border border-white/10 ${user?.current_mood ? 'ring-2 ring-emerald-500/20' : ''}`}
                        >
                            {user?.current_mood ? (
                                <span className="text-xl">{moodIcons[user.current_mood] || '😊'}</span>
                            ) : (
                                <Smile size={20} className="text-gray-400" />
                            )}
                        </button>
                        <button
                            onClick={() => !isLocked && lockChat()}
                            className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 flex items-center justify-center transition-all active:scale-90 border border-white/5"
                        >
                            <Heart size={20} className={!isLocked ? 'fill-none' : 'fill-rose-500 text-rose-500'} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-7 no-scrollbar pb-40 z-10 relative">
                <AnimatePresence initial={false}>
                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
                            <div className="w-20 h-20 rounded-full bg-accent-soft flex items-center justify-center animate-pulse shadow-2xl" style={{ boxShadow: '0 0 50px var(--accent-glow)' }}>
                                <p className="text-4xl">💞</p>
                            </div>
                            <p className="text-gray-400 text-sm font-medium tracking-wide">Your private universe awaits.<br /><span className="opacity-60">Send the first message!</span></p>
                        </motion.div>
                    )}
                    {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user?.id;
                        const showAvatar = !isMe && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);
                        const isFirstInGroup = i === 0 || messages[i - 1].sender_id !== msg.sender_id;
                        return (
                            <motion.div key={msg.id} initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}>
                                {!isMe && (
                                    <div className="flex-shrink-0 w-8 self-end mb-1">
                                        {showAvatar && <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg transition-transform hover:scale-110" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' }}>{partnerAvatar || '💖'}</div>}
                                    </div>
                                )}
                                <div onDoubleClick={() => handleLoveReact(msg.id)}
                                    className={`relative group max-w-[85%] rounded-[22px] transition-all duration-300 ${msg.message_type === 'sticker' ? 'bg-transparent text-white' : isMe ? `text-white rounded-tr-sm border border-white/10 bubble-shadow-me ${isFirstInGroup ? 'bubble-nip-me' : ''}` : `text-white rounded-tl-sm border border-white/10 backdrop-blur-md bubble-shadow-partner bg-zinc-900/60 ${isFirstInGroup ? 'bubble-nip-partner' : ''}`}`}
                                    style={msg.message_type === 'sticker' ? {} : (isMe ? { background: 'linear-gradient(135deg, #f43f5e, #9333ea)' } : {})}>
                                    {msg.message_type === 'voice' && msg.media_url ? (
                                        <div className="flex items-center gap-3 px-4 py-3 min-w-[200px]">
                                            <button onClick={() => togglePlayVoice(msg.id, msg.media_url!)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-rose-500/20 hover:bg-rose-500/30'}`}>
                                                {playingId === msg.id ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                                            </button>
                                            <div className="flex gap-1 items-center flex-1">
                                                {Array.from({ length: 24 }).map((_, j) => {
                                                    const seed = (msg.id.charCodeAt(j % msg.id.length) + j * 17) % 16;
                                                    return <div key={j} className={`w-0.5 rounded-full transition-all duration-300 ${playingId === msg.id ? 'bg-white animate-pulse' : isMe ? 'bg-white/60' : 'bg-rose-500'}`} style={{ height: `${4 + seed}px` }} />;
                                                })}
                                            </div>
                                            <Mic size={14} className="opacity-40" />
                                        </div>
                                    ) : (
                                        msg.message_type === 'sticker' ? (
                                            <div className="pl-4 pr-1 pt-1 pb-1">
                                                <span className="text-8xl inline-block transition-transform hover:scale-110 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]">
                                                    {msg.message}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="px-5 py-3.5 text-[15px] leading-[1.6] font-medium break-words whitespace-pre-wrap">{msg.message}</p>
                                        )
                                    )}
                                    <div className={`flex items-center gap-2 px-5 pb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {msg.is_pinned && <Pin size={10} className="text-yellow-300 -rotate-45" />}
                                        <span className={`text-[9px] font-black tracking-widest uppercase ${msg.message_type === 'sticker' ? 'text-white/90 drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm' : `opacity-40 ${isMe ? 'text-white' : 'text-gray-400'}`}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {msg.reactions && msg.reactions.length > 0 && <div className={`absolute -bottom-3 ${isMe ? 'right-4' : 'left-4'} bg-zinc-900 border border-white/10 rounded-full px-2 py-0.5 text-[10px] shadow-2xl flex gap-1 z-10 scale-110`}>{Array.from(new Set(msg.reactions)).map((e, idx) => <span key={idx}>{e}</span>)}</div>}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Input Bar */}
            <div className="absolute bottom-24 left-0 right-0 px-4 z-50">
                {/* Sticker Picker Popup */}
                <AnimatePresence>
                    {showStickers && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="absolute bottom-full left-4 mb-4 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] w-[280px]"
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-white text-xs font-black uppercase tracking-widest text-white/50">Your Stickers</h4>
                                <button onClick={() => setShowStickers(false)} className="text-white/40 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>

                            {myStickers.length === 0 ? (
                                <div className="text-center py-6 px-4 bg-white/5 rounded-2xl border-dashed border border-white/10">
                                    <p className="text-white/40 text-xs font-medium mb-2">No stickers unlocked yet.</p>
                                    <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Visit the Love Arena!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
                                    {myStickers.map(sticker => (
                                        <button
                                            key={sticker.id}
                                            onClick={() => handleSendSticker(sticker.media_url)}
                                            className="aspect-square bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-3xl transition-transform hover:scale-110 border border-white/5"
                                        >
                                            {sticker.media_url}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {audioBlob && !isRecording ? (
                        <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="rounded-[32px] p-3 flex items-center justify-between gap-3 bg-zinc-900/90 backdrop-blur-2xl border border-accent/30 shadow-2xl animate-breathing-glow">
                            <button onClick={togglePreviewPlay} className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center text-accent hover:bg-accent/20 transition-all shrink-0">{previewPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}</button>
                            <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                <span className="text-white text-[11px] font-black uppercase tracking-widest opacity-90 truncate">Recording Ready</span>
                                <span className="text-gray-400 text-[9px] leading-tight font-medium line-clamp-2 pr-2">Tap send to share your whisper</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={cancelRecording} className="text-gray-400 text-[11px] font-bold hover:text-white px-2 h-10 transition-colors uppercase tracking-wider">Discard</button>
                                <button onClick={sendVoiceNote} className="px-5 h-10 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg" style={{ background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))', boxShadow: '0 4px 15px var(--accent-glow)' }}>Send</button>
                            </div>
                        </motion.div>
                    ) : isRecording ? (
                        <motion.div key="recording" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="rounded-[32px] p-3 flex items-center gap-4 bg-zinc-900/90 backdrop-blur-2xl border border-accent/50 shadow-2xl animate-breathing-glow ring-2 ring-accent/10">
                            <div className="relative w-10 h-10 flex items-center justify-center"><motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-accent rounded-full" /><div className="z-10 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]" /></div>
                            <div className="flex-1"><span className="text-accent font-black font-mono text-lg tracking-widest">{formatTime(recordingTime)}</span><p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Speaking Now...</p></div>
                            <button onClick={cancelRecording} className="text-white/40 p-3 hover:text-white transition-colors"><MicOff size={20} /></button>
                            <button onClick={stopRecording} className="bg-accent text-white p-3 rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-90" style={{ boxShadow: '0 0 20px var(--accent-glow)' }}><Square size={16} fill="white" /></button>
                        </motion.div>
                    ) : (
                        <motion.form key="input" onSubmit={handleSend} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] p-1.5 flex items-center bg-zinc-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl relative group focus-within:border-accent/30 transition-all mx-1 gap-1 input-focus-glow">
                            <button type="button" onClick={() => setIsDisappearing(!isDisappearing)} className={`p-3 transition-all rounded-2xl ${isDisappearing ? 'text-accent bg-accent-soft' : 'text-white/30 hover:text-white hover:bg-white/5'}`}><Clock size={20} className={isDisappearing ? 'animate-pulse' : ''} /></button>
                            <button type="button" onClick={() => setShowStickers(!showStickers)} className={`p-3 transition-all rounded-2xl ${showStickers ? 'text-rose-400 bg-rose-500/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}><Sticker size={20} /></button>
                            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={isDisappearing ? 'TIMED MESSAGE...' : 'Whisper something...'} className="flex-1 bg-transparent border-none focus:outline-none text-white px-2 placeholder:text-white/20 text-[16px] font-medium min-w-0" />
                            <div className="flex items-center pr-1">{input.trim() ? (
                                <motion.button initial={{ scale: 0.8, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} type="submit" className="w-11 h-11 flex items-center justify-center text-white rounded-2xl active:scale-94 shadow-xl transition-all" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', boxShadow: '0 4px 15px var(--accent-glow)' }}><Send size={18} className="translate-x-0.5" /></motion.button>
                            ) : (
                                <button type="button" onPointerDown={(e) => { e.preventDefault(); startRecording(); }} onPointerUp={(e) => { e.preventDefault(); stopRecording(); }} onPointerLeave={(e) => { if (isRecording) stopRecording(); }} className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 ${isRecording ? 'bg-accent text-white' : 'text-accent bg-accent-soft hover:bg-accent/20'}`} style={{ boxShadow: isRecording ? '0 0 20px var(--accent-glow)' : '0 4px 15px var(--accent-glow)' }}><Mic size={20} /></button>
                            )}</div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showMoodSelector && (
                    <MoodSelector onClose={() => setShowMoodSelector(false)} />
                )}
            </AnimatePresence>

            {/* AI Guru Aura Update Toast */}
            <AnimatePresence>
                {auraUpdate && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-24 left-4 right-4 z-40"
                    >
                        <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-4 shadow-2xl">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                                <Sparkles size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Aura Boost</p>
                                <p className="text-white text-xs font-medium">{auraUpdate.message}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Guru Intervention Modal */}
            <AnimatePresence>
                {guruIntervention && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-zinc-900 border border-rose-500/30 rounded-[40px] p-8 flex flex-col shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Aura Conflict Detected</h3>
                            <p className="text-zinc-400 text-sm mb-8">{guruIntervention.message}</p>

                            <div className="bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10 mb-8 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={14} className="text-rose-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Try saying this:</span>
                                </div>
                                <p className="text-white text-sm italic font-serif leading-relaxed">"{guruIntervention.nvc_prompt}"</p>
                            </div>

                            <button
                                onClick={() => setGuruIntervention(null)}
                                className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                            >
                                Noted, Thanks Guru
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
