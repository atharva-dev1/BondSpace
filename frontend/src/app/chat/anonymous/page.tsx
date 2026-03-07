"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Sparkles, Shield, ArrowLeft, Loader2, Heart } from 'lucide-react';
import AnonymousChat from '@/components/chat/AnonymousChat';
import Link from 'next/link';

export default function AnonymousLobbyPage() {
    const { user, token, socket, isAuthenticated, checkAuth } = useStore();
    const [status, setStatus] = useState<'idle' | 'searching' | 'chatting'>('idle');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) checkAuth();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('anonymous_match_found', (data: { chat_id: string }) => {
            setActiveChatId(data.chat_id);
            setStatus('chatting');
        });

        return () => {
            socket.off('anonymous_match_found');
        };
    }, [socket]);

    const startMatching = async () => {
        setError('');
        setStatus('searching');
        try {
            const { data } = await axios.post(`${API_URL}/chat/anonymous/match`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.match_found) {
                setActiveChatId(data.chat_id);
                setStatus('chatting');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to join queue');
            setStatus('idle');
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] p-4">
            <header className="mb-6 flex items-center gap-4">
                <Link href="/" className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        Soul Connect <Sparkles size={20} className="text-yellow-400" />
                    </h2>
                    <p className="text-gray-500 text-xs">Meet someone new, share a secret, stay hidden.</p>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
                    >
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
                                <Users size={64} />
                            </div>
                            <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-black">
                                LIVE
                            </div>
                        </div>

                        <div className="max-w-xs space-y-3">
                            <h3 className="text-xl font-bold text-white">Find your anonymous mirror.</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Join the global queue to be paired for a private 1-on-1 session.
                                No profile, no names, just pure connection.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                            <div className="glass p-4 rounded-3xl border-white/5 text-left">
                                <Shield className="text-emerald-400 mb-2" size={18} />
                                <h4 className="text-white text-xs font-bold mb-1">Safe Space</h4>
                                <p className="text-[10px] text-gray-500">Fully encrypted and private conversations.</p>
                            </div>
                            <div className="glass p-4 rounded-3xl border-white/5 text-left">
                                <Heart className="text-rose-400 mb-2" size={18} />
                                <h4 className="text-white text-xs font-bold mb-1">Real People</h4>
                                <p className="text-[10px] text-gray-500">Verified community members only.</p>
                            </div>
                        </div>

                        {error && <p className="text-rose-400 text-sm">{error}</p>}

                        <button
                            onClick={startMatching}
                            className="w-full max-w-sm bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
                        >
                            Enter the Mirror <Sparkles size={20} />
                        </button>
                    </motion.div>
                )}

                {status === 'searching' && (
                    <motion.div
                        key="searching"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center space-y-8"
                    >
                        <div className="relative flex items-center justify-center">
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute w-64 h-64 bg-rose-500 rounded-full blur-3xl"
                            />
                            <div className="w-32 h-32 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                            <Users className="absolute text-rose-500" size={40} />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-white">Searching...</h3>
                            <p className="text-gray-400 animate-pulse text-sm">Whispering to the stars to find your soul match.</p>
                        </div>

                        <button
                            onClick={() => setStatus('idle')}
                            className="px-8 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-full text-sm font-bold hover:text-white transition-colors"
                        >
                            Cancel Search
                        </button>
                    </motion.div>
                )}

                {status === 'chatting' && activeChatId && (
                    <motion.div
                        key="chatting"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1"
                    >
                        <AnonymousChat
                            chat_id={activeChatId}
                            onEnd={() => {
                                setStatus('idle');
                                setActiveChatId(null);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
