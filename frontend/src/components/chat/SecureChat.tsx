"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Pin, Clock, Mic, MicOff, Square, Play, Pause, Paperclip } from 'lucide-react';
import { encryptMessage, decryptMessage } from '@/lib/encryption';

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
    const { user, token, bond, socket, encryptionKey } = useStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isDisappearing, setIsDisappearing] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (bond?.id && token) {
            axios.get(`${API_URL}/messages/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(async (res) => {
                const fetched = res.data.messages;
                const decrypted = await Promise.all(
                    fetched.map(async (msg: Message) => {
                        if (msg.message_type === 'voice') return msg; // media_url, no decryption needed
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
    }, [bond?.id, token, encryptionKey]);

    useEffect(() => {
        if (!socket) return;
        const handleMsg = async (msg: Message) => {
            if (msg.message_type === 'voice') {
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
        return () => {
            socket.off('receive_message', handleMsg);
            socket.off('message_reacted', handleReaction);
        };
    }, [socket, encryptionKey]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Text send ─────────────────────────────────────────────────────────────
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

    // ── Voice recording ───────────────────────────────────────────────────────
    const startRecording = async () => {
        try {
            // Force RAW audio capture. Windows Audio Enhancements + Chrome defaults 
            // often cause "volume 0 / muted" bugs. Setting these to false bypasses the broken OS filters.
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            console.log('Got audio stream:', stream.active, stream.getAudioTracks().length, 'tracks');

            // Prioritize mp4 (AAC) if supported, because WebM Opus on some Windows Chrome 
            // records complete silence due to MediaFoundation driver layer glitches.
            let mimeType = '';
            if (MediaRecorder.isTypeSupported('audio/mp4')) { mimeType = 'audio/mp4'; }
            else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) { mimeType = 'audio/webm;codecs=opus'; }
            else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) { mimeType = 'audio/ogg;codecs=opus'; }

            const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

            chunksRef.current = [];
            mr.ondataavailable = e => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };
            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mr.start(); // Do NOT use timeslices — Chromium often breaks audio-only WebM clustering when timesliced
            mediaRecorderRef.current = mr;
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } catch (err) {
            alert('Microphone access denied. Please allow mic permission.');
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
        // Revoke any previous preview audio
        if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null; }
        setPreviewPlaying(false);
        // Read as data URL to send via socket
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

    // --- Reliable Web Audio API Playback ---
    // The standard <audio> tag in Chrome often fails silently for MediaRecorder WebM blobs.
    // AudioContext decodes the raw bytes perfectly every time.
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const currentPlayingUrlRef = useRef<string | null>(null);

    const playWebAudio = async (url: string, id: string, isPreview: boolean) => {
        try {
            if (!audioContextRef.current) audioContextRef.current = new AudioContext();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            // Stop any currently playing audio
            if (currentSourceRef.current) {
                currentSourceRef.current.stop();
                currentSourceRef.current.disconnect();
                currentSourceRef.current = null;
            }

            // If clicking the same button that's playing, just stop it
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
            console.error('Web Audio playback failed:', err);
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

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] relative">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 no-scrollbar">
                <AnimatePresence>
                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                            <p className="text-4xl">💞</p>
                            <p className="text-gray-500 text-sm">Your private universe awaits.<br />Send the first message!</p>
                        </motion.div>
                    )}
                    {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user?.id;
                        const showAvatar = i === 0 || messages[i - 1].sender_id !== msg.sender_id;
                        const partnerAvatar = bond?.user1_id === user?.id ? bond?.user2_avatar : bond?.user1_avatar;

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Partner avatar */}
                                {!isMe && (
                                    <div className="flex-shrink-0 w-8 self-end">
                                        {showAvatar && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                                {partnerAvatar || '💖'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div
                                    onDoubleClick={() => handleLoveReact(msg.id)}
                                    className={`relative group max-w-[75%] rounded-2xl shadow-lg
                                        ${isMe
                                            ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-tr-sm'
                                            : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                                        }`}
                                >
                                    {/* Voice note */}
                                    {msg.message_type === 'voice' && msg.media_url ? (
                                        <div className="flex items-center gap-3 px-4 py-3 min-w-[160px]">
                                            <button
                                                onClick={() => togglePlayVoice(msg.id, msg.media_url!)}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-rose-500/20 hover:bg-rose-500/30'}`}
                                            >
                                                {playingId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                            <div className="flex gap-0.5 items-center flex-1">
                                                {Array.from({ length: 20 }).map((_, j) => {
                                                    // Stable height seeded from message id so it doesn't re-randomize on re-render
                                                    const seed = (msg.id.charCodeAt(j % msg.id.length) + j * 13) % 14;
                                                    return <div key={j} className={`w-0.5 rounded-full ${playingId === msg.id ? 'bg-white animate-pulse' : isMe ? 'bg-white/60' : 'bg-white/40'}`}
                                                        style={{ height: `${4 + seed}px` }} />;
                                                })}
                                            </div>
                                            <Mic size={12} className="opacity-60" />
                                        </div>
                                    ) : (
                                        <p className="px-4 py-2.5 text-[15px] leading-relaxed">{msg.message}</p>
                                    )}

                                    {/* Timestamp row */}
                                    <div className={`flex items-center gap-1 px-4 pb-2 -mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {msg.is_pinned && <Pin size={9} className="text-yellow-300 rotate-45" />}
                                        {msg.is_disappearing && <Clock size={9} className="opacity-60" />}
                                        <span className={`text-[10px] ${isMe ? 'text-rose-200/70' : 'text-gray-400/70'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Reactions bubble */}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                        <div className={`absolute -bottom-4 ${isMe ? 'right-2' : 'left-2'} bg-black/60 backdrop-blur-md rounded-full px-1.5 py-0.5 text-xs border border-white/10 z-10 flex gap-0.5`}>
                                            {msg.reactions.map((e, idx) => <span key={idx}>{e}</span>)}
                                        </div>
                                    )}

                                    {/* Pin hover button */}
                                    {!msg.is_pinned && (
                                        <button
                                            onClick={() => handlePinMessage(msg.id)}
                                            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1.5 rounded-full backdrop-blur-xl border border-white/10 ${isMe ? '-left-10' : '-right-10'}`}
                                        >
                                            <Pin size={12} className="text-gray-300" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="absolute bottom-4 left-0 w-full px-4 z-20">
                <AnimatePresence mode="wait">
                    {/* Voice recorded — preview */}
                    {audioBlob && !isRecording ? (
                        <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="glass rounded-full px-4 py-3 flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-rose-500/20">
                            {/* Preview play button — uses local blob URL directly */}
                            <button onClick={togglePreviewPlay}
                                className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/40 transition-colors shrink-0">
                                {previewPlaying ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <span className="text-gray-400 text-sm flex-1">Voice note recorded</span>
                            <button onClick={cancelRecording} className="text-gray-500 text-xs hover:text-gray-300 px-2">Cancel</button>
                            <button onClick={sendVoiceNote} className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-rose-400 transition-colors">Send</button>
                        </motion.div>
                    ) : isRecording ? (
                        /* Recording in progress */
                        <motion.div key="recording" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="glass rounded-full px-4 py-3 flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-rose-500/40">
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                                className="w-3 h-3 bg-rose-500 rounded-full" />
                            <span className="text-rose-400 font-mono text-sm flex-1">{formatTime(recordingTime)}</span>
                            <button onClick={cancelRecording} className="text-gray-500 p-2 hover:text-gray-300"><MicOff size={18} /></button>
                            <button onClick={stopRecording} className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-400 transition-colors">
                                <Square size={14} fill="white" />
                            </button>
                        </motion.div>
                    ) : (
                        /* Normal input */
                        <motion.form key="input" onSubmit={handleSend} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="glass rounded-full p-1.5 flex items-center pr-2 shadow-2xl border-white/10 bg-black/50 backdrop-blur-xl">
                            <button
                                type="button"
                                onClick={() => setIsDisappearing(!isDisappearing)}
                                className={`p-2 transition-colors ${isDisappearing ? 'text-purple-400' : 'text-gray-500 hover:text-purple-400'}`}
                                title={isDisappearing ? 'Disappearing: ON' : 'Disappearing: OFF'}
                            >
                                <Clock size={19} />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder={isDisappearing ? '🕐 Disappearing message...' : 'Whisper something...'}
                                className="flex-1 bg-transparent border-none focus:outline-none text-white px-2 placeholder:text-gray-600 text-[15px]"
                            />
                            {input.trim() ? (
                                <motion.button initial={{ scale: 0.8 }} animate={{ scale: 1 }} type="submit"
                                    className="bg-rose-500 hover:bg-rose-400 text-white p-2.5 rounded-full active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                                    <Send size={17} className="translate-x-0.5" />
                                </motion.button>
                            ) : (
                                <button type="button" onMouseDown={startRecording}
                                    className="p-2.5 text-rose-400 hover:text-rose-300 transition-colors bg-white/5 rounded-full active:bg-rose-500/20">
                                    <Mic size={18} />
                                </button>
                            )}
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
