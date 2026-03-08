"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, Shield, ArrowLeft, Loader2, Heart } from 'lucide-react';
import AnonymousChat from '@/components/chat/AnonymousChat';
import Link from 'next/link';

export default function AnonymousLobbyPage() {
    const { user, token, socket, isAuthenticated, checkAuth } = useStore();
    const [status, setStatus] = useState<'idle' | 'searching' | 'chatting'>('idle');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!user) checkAuth();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleMatch = (data: { chat_id: string }) => {
            setActiveChatId(data.chat_id);
            setStatus('chatting');
        };
        socket.on('anonymous_match_found', handleMatch);
        return () => { socket.off('anonymous_match_found', handleMatch); };
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

    // STABLE STRUCTURE: Always return the same outer wrapper to prevent Hydration Mismatch
    return (
        <div className="flex-1 flex flex-col h-full bg-[#080808] overflow-hidden relative">
            {/* CACHE BUST VERIFICATION TAG (HIDDEN) */}
            <span className="sr-only">v2.1-hydration-fix</span>

            {!mounted ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-rose-500" size={32} />
                </div>
            ) : !isAuthenticated ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm">
                    Authenticating...
                </div>
            ) : (
                <>
                    {/* Minimalist Header */}
                    <header className="mb-6 flex justify-between items-center bg-black/40 glass p-4 rounded-3xl border border-white/5 mx-4 mt-4">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/10">
                                <ArrowLeft size={18} />
                            </Link>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="flex-1 flex flex-col items-center justify-start text-center space-y-8 overflow-y-auto no-scrollbar pb-64 px-4 pt-10"
                            >
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse border-4 border-rose-500/20">
                                        <Users size={64} />
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-black">
                                        LIVE
                                    </div>
                                </div>

                                <div className="max-w-xs space-y-3">
                                    <h3 className="text-2xl font-black text-white tracking-tight">Find your anonymous mirror.</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed px-4">
                                        Join the global queue to be paired for a private 1-on-1 session.
                                        No profile, no names, just pure connection.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                                    <div className="glass p-5 rounded-[32px] border-white/5 text-left bg-white/[0.02]">
                                        <Shield className="text-emerald-400 mb-2" size={20} />
                                        <h4 className="text-white text-xs font-bold mb-1">Safe Space</h4>
                                        <p className="text-[10px] text-gray-500 leading-tight">Fully encrypted and private conversations.</p>
                                    </div>
                                    <div className="glass p-5 rounded-[32px] border-white/5 text-left bg-white/[0.02]">
                                        <Heart className="text-rose-400 mb-2" size={20} />
                                        <h4 className="text-white text-xs font-bold mb-1">Real People</h4>
                                        <p className="text-[10px] text-gray-500 leading-tight">Verified community members only.</p>
                                    </div>
                                </div>

                                {error && <p className="text-rose-400 text-sm font-medium">{error}</p>}

                                <div className="w-full max-w-sm px-4">
                                    <button
                                        onClick={startMatching}
                                        className="w-full text-white font-black py-5 rounded-[32px] flex items-center justify-center gap-3 transition-all text-xl active:scale-95 shadow-2xl relative overflow-hidden group"
                                        style={{ background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))', boxShadow: '0 8px 30px var(--accent-glow)' }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        Enter the Mirror <Sparkles size={24} className="animate-pulse" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {status === 'searching' && (
                            <motion.div
                                key="searching"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center space-y-8 bg-black/20"
                            >
                                <div className="relative flex items-center justify-center scale-110">
                                    <motion.div
                                        animate={{ scale: [1, 1.8, 1], opacity: [0.1, 0.4, 0.1] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute w-64 h-64 bg-rose-500 rounded-full blur-[100px]"
                                    />
                                    <div className="w-40 h-40 rounded-full border-4 border-rose-500/10 border-t-rose-500 animate-[spin_3s_linear_infinite]" />
                                    <Users className="absolute text-rose-500" size={48} />
                                </div>

                                <div className="text-center space-y-3">
                                    <h3 className="text-3xl font-black text-white tracking-widest">Searching...</h3>
                                    <p className="text-rose-400/60 animate-pulse text-sm font-medium">Whispering to the stars to find your soul match.</p>
                                </div>

                                <button
                                    onClick={() => setStatus('idle')}
                                    className="px-8 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-full text-sm font-bold hover:text-white transition-all hover:bg-white/10"
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
                                className="flex-1 flex flex-col h-full"
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
                </>
            )}
        </div>
    );
}
