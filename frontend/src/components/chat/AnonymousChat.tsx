"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Shield, Sparkles, User, MessageCircle } from 'lucide-react';

interface Message {
    id: string;
    chat_id?: string;
    sender_id: string;
    message: string;
    timestamp: string;
}

export default function AnonymousChat({ chat_id, onEnd }: { chat_id: string, onEnd: () => void }) {
    const { user, token, socket } = useStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Pseudonyms
    const myName = "You";
    const partnerName = "Stranger";

    useEffect(() => {
        if (chat_id && token) {
            axios.get(`${API_URL}/chat/anonymous/${chat_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then((res) => {
                setMessages(res.data.messages);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [chat_id, token]);

    useEffect(() => {
        if (!socket) return;
        const handleMsg = (msg: Message) => {
            if (msg.chat_id === chat_id) {
                setMessages(prev => [...prev, msg]);
            }
        };
        const handleEnd = (data: { chat_id: string }) => {
            if (data.chat_id === chat_id) {
                alert("The stranger has left the chat.");
                onEnd();
            }
        };

        socket.on('anonymous_message_received', handleMsg);
        socket.on('anonymous_chat_ended', handleEnd);
        return () => {
            socket.off('anonymous_message_received', handleMsg);
            socket.off('anonymous_chat_ended', handleEnd);
        };
    }, [socket, chat_id, onEnd]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const text = input;
        setInput('');

        try {
            await axios.post(`${API_URL}/chat/anonymous/message`,
                { chat_id, message: text },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Local update
            setMessages(prev => [...prev, {
                id: Math.random().toString(),
                sender_id: user?.id || '',
                message: text,
                timestamp: new Date().toISOString()
            }]);
        } catch (err) {
            console.error('Failed to send anonymous message:', err);
        }
    };

    const endChat = async () => {
        if (!confirm("Are you sure you want to end this anonymous chat?")) return;
        try {
            await axios.post(`${API_URL}/chat/anonymous/end`, { chat_id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onEnd();
        } catch (err) {
            console.error('Failed to end chat:', err);
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative">
            {/* Premium Wallpaper Backdrop */}
            <div className="absolute inset-0 chat-wallpaper z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

            {/* Premium Header Card */}
            <header className="px-4 pt-4 pb-2 z-20 flex-shrink-0">
                <div className="glass bg-black/40 backdrop-blur-2xl rounded-[32px] p-3 border border-white/5 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-white/10 shadow-lg">
                                <User size={22} className="text-gray-400" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black" />
                        </div>
                        <div>
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5 leading-none mb-1">
                                <Shield size={10} /> Safe & Private
                            </p>
                            <h3 className="font-bold text-white text-[15px] leading-none uppercase tracking-tight">Stranger</h3>
                        </div>
                    </div>
                    <button
                        onClick={endChat}
                        className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 flex items-center justify-center transition-all active:scale-90 border border-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-7 no-scrollbar pb-40 z-10 relative">
                <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-2 backdrop-blur-md">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-[11px] text-gray-400 font-medium">You've been matched! Say hello.</span>
                    </div>
                </div>

                <AnimatePresence>
                    {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user?.id;
                        const isFirstInGroup = i === 0 || messages[i - 1].sender_id !== msg.sender_id;

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}
                            >
                                <div className={`max-w-[85%] px-4 py-3.5 rounded-[22px] shadow-lg transition-all duration-300 relative ${isMe
                                    ? `text-white rounded-tr-sm border border-white/10 bubble-shadow-me ${isFirstInGroup ? 'bubble-nip-me' : ''}`
                                    : `text-white rounded-tl-sm border border-white/10 backdrop-blur-md bubble-shadow-partner bg-zinc-900/60 ${isFirstInGroup ? 'bubble-nip-partner' : ''}`
                                    }`}
                                    style={isMe ? {
                                        background: 'linear-gradient(135deg, #f43f5e, #9333ea)',
                                    } : {}}
                                >
                                    <p className="text-[15px] leading-[1.6] font-medium break-words whitespace-pre-wrap">{msg.message}</p>
                                    <p className={`text-[9px] mt-2 font-black tracking-widest uppercase opacity-40 ${isMe ? 'text-right text-white' : 'text-left text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="absolute bottom-24 left-4 right-4 z-20">
                <form onSubmit={handleSend} className="glass rounded-[32px] p-1.5 flex items-center gap-1 shadow-2xl border-rose-500/20 bg-black/60 backdrop-blur-xl input-focus-glow">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type anonymously..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-white px-4 placeholder:text-white/20 text-[16px] font-medium min-w-0"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-11 h-11 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg hover:bg-rose-500 disabled:opacity-50 transition-all shrink-0 mr-0.5 active:scale-94"
                    >
                        <Send size={18} className="translate-x-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
