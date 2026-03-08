"use client";

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, Clock, Loader2, Check } from 'lucide-react';
import { useState } from 'react';

export default function PendingBond() {
    const { bond, user, token, checkAuth } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isSender = bond?.user1_id === user?.id;

    // Auto-poll every 4s if sender waiting for acceptance
    useEffect(() => {
        if (!isSender) return;
        const interval = setInterval(() => checkAuth(), 4000);
        return () => clearInterval(interval);
    }, [isSender, checkAuth]);

    const handleAccept = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.post(
                `${API_URL}/bond/accept`,
                { couple_id: bond?.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            checkAuth();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to accept bond');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[5%] w-[400px] h-[400px] bg-rose-600/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[5%] w-[350px] h-[350px] bg-purple-700/15 rounded-full blur-[110px]" />
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10 text-center">
                {isSender ? (
                    <>
                        {/* Waiting state */}
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Clock size={36} className="text-gray-400" />
                            </div>
                            <motion.div
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-3xl border border-white/20"
                            />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">Request Sent!</h2>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            Waiting for your partner to accept.<br />
                            We'll update automatically when they join. 💫
                        </p>
                        <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                                <Loader2 size={14} />
                            </motion.div>
                            <span>Checking for response...</span>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Received request */}
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <img src="/logo.svg" alt="Bond Request" className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(244,63,94,0.4)]" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 rounded-3xl bg-rose-500 opacity-10 blur-2xl z-[-1]"
                            />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-3">You've been invited!</h2>
                        <p className="text-gray-500 text-sm mb-10 leading-relaxed">
                            Someone wants to bond with you.<br />Accept to enter your private universe together 💞
                        </p>

                        {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-5 rounded-2xl shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                        >
                            {loading
                                ? <Loader2 size={22} className="animate-spin" />
                                : <><Check size={20} /> Accept Bond 💕</>
                            }
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
