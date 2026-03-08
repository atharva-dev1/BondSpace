"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Copy, Check, Loader2, Heart, RefreshCw, QrCode, Users } from 'lucide-react';

export default function ConnectPartner() {
    const { token, user, checkAuth } = useStore();
    const [inviteUrl, setInviteUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [polling, setPolling] = useState(false);

    const generateLink = async () => {
        setGenerating(true);
        try {
            const { data } = await axios.post(`${API_URL}/bond/invite`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Use current window origin + join path + code for robustness
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bond-space.vercel.app';
            setInviteUrl(`${baseUrl}/join/${data.code}`);
            setPolling(true);
        } catch (err: any) {
            const errData = err.response?.data;
            if (errData?.error === 'already_bonded') {
                // User is already bonded — refresh auth to load the bond
                checkAuth();
            }
            // Otherwise silently ignore (stale pending was cleaned server-side, retry will work)
        } finally {
            setGenerating(false);
        }
    };

    // Poll for bond acceptance every 3s
    useEffect(() => {
        if (!polling) return;
        const interval = setInterval(async () => {
            try {
                const { data } = await axios.get(`${API_URL}/bond/my-bond`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.bond && data.bond.status === 'bonded') {
                    clearInterval(interval);
                    checkAuth(); // triggers re-render with bond
                }
            } catch { }
        }, 3000);
        return () => clearInterval(interval);
    }, [polling, token, checkAuth]);

    const copyLink = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const shareLink = async () => {
        if (navigator.share) {
            await navigator.share({ title: 'BondSpace Invite', text: `${user?.name} wants to connect with you on BondSpace 💞`, url: inviteUrl });
        } else {
            copyLink();
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* bg blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[5%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-15%] right-[10%] w-[400px] h-[400px] bg-accent-secondary/15 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <img src="/logo.svg" alt="BondSpace" className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(244,63,94,0.4)]" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-3xl opacity-20 blur-2xl z-[-1]"
                            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' }}
                        />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-3">Find Your Partner</h2>
                    <p className="text-white/40 text-sm leading-relaxed max-w-[280px] mx-auto">
                        Generate a private invite link and send it to your partner. Once they join, you'll be permanently bonded. 💞
                    </p>
                </div>

                {/* Your profile chip */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/10"
                        style={{ background: 'linear-gradient(135deg, var(--accent-soft), transparent)' }}>
                        {user?.avatar || '💖'}
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">{user?.name}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user?.gender} · @{user?.id?.slice(0, 8)}</p>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
                </div>

                {/* Invite link section */}
                <AnimatePresence mode="wait">
                    {!inviteUrl ? (
                        <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button
                                onClick={generateLink}
                                disabled={generating}
                                className="w-full text-white font-black uppercase tracking-widest py-5 rounded-3xl flex items-center justify-center gap-3 shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))',
                                    boxShadow: '0 10px 25px -5px var(--accent-glow)'
                                }}
                            >
                                {generating
                                    ? <Loader2 size={22} className="animate-spin" />
                                    : <><Link2 size={22} /> Generate link</>
                                }
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="link" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                            {/* Link display */}
                            <div className="bg-accent-soft border border-accent/20 rounded-3xl p-5 shadow-2xl">
                                <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mb-3">Secret Link</p>
                                <p className="text-white text-sm font-mono break-all leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{inviteUrl}</p>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={copyLink}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl border font-bold text-sm transition-all ${copied
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                        }`}
                                >
                                    {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                                </button>
                                <button
                                    onClick={shareLink}
                                    className="flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                                    style={{
                                        background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))',
                                        boxShadow: '0 4px 12px var(--accent-glow)'
                                    }}
                                >
                                    <Users size={16} /> Share
                                </button>
                            </div>

                            {/* Waiting indicator */}
                            <div className="flex items-center justify-center gap-3 py-6 glass rounded-2xl border border-white/5 bg-white/5">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-accent rounded-full"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                            style={{ boxShadow: '0 0 10px var(--accent-glow)' }}
                                        />
                                    ))}
                                </div>
                                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Awaiting Partner...</span>
                            </div>

                            <button
                                onClick={generateLink}
                                disabled={generating}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white/60 transition-colors"
                            >
                                <RefreshCw size={12} /> Regenerate
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
