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
            setInviteUrl(data.invite_url);
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
                <div className="absolute top-[-20%] left-[5%] w-[500px] h-[500px] bg-rose-600/12 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-15%] right-[10%] w-[400px] h-[400px] bg-purple-700/12 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-[0_0_60px_rgba(225,29,72,0.4)]">
                            <Heart size={40} className="text-white fill-white" />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500 to-purple-600 opacity-30 blur-xl"
                        />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-3">Find Your Partner</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Generate a private invite link and send it to your partner. Once they join, you'll be permanently bonded. 💞
                    </p>
                </div>

                {/* Your profile chip */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-white/10">
                        {user?.avatar || '💖'}
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.gender} · @{user?.id?.slice(0, 8)}</p>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>

                {/* Invite link section */}
                <AnimatePresence mode="wait">
                    {!inviteUrl ? (
                        <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button
                                onClick={generateLink}
                                disabled={generating}
                                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(225,29,72,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-lg"
                            >
                                {generating
                                    ? <Loader2 size={22} className="animate-spin" />
                                    : <><Link2 size={22} /> Generate Invite Link</>
                                }
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="link" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Link display */}
                            <div className="bg-white/5 border border-rose-500/30 rounded-2xl p-4">
                                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-2">Your Invite Link</p>
                                <p className="text-gray-300 text-sm font-mono break-all leading-relaxed">{inviteUrl}</p>
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
                                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                                >
                                    <Users size={16} /> Share
                                </button>
                            </div>

                            {/* Waiting indicator */}
                            <div className="flex items-center justify-center gap-3 py-4">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-rose-400 rounded-full"
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                                <span className="text-gray-500 text-sm">Waiting for partner to join...</span>
                            </div>

                            <button
                                onClick={generateLink}
                                disabled={generating}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-gray-600 text-sm hover:text-gray-400 transition-colors"
                            >
                                <RefreshCw size={14} /> Generate new link
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
