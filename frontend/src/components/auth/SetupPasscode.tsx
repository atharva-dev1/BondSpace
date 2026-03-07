"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LockKeyhole, LockKeyholeOpen, Loader2, Check } from 'lucide-react';

export default function SetupPasscode() {
    const { bond, token, checkAuth } = useStore();
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ message: string; locked: boolean } | null>(null);
    const [error, setError] = useState('');

    // Poll for passcode confirmation if we're in "waiting for partner" state
    useEffect(() => {
        if (!status || status.locked) return;
        // User 1 set the passcode, now poll until partner confirms
        const interval = setInterval(() => checkAuth(), 3000);
        return () => clearInterval(interval);
    }, [status, checkAuth]);

    const handleSet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode || !bond?.id) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(
                `${API_URL}/bond/set-passcode`,
                { couple_id: bond.id, my_code: passcode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStatus(res.data);
            if (res.data.locked) {
                // Partner confirmed — refresh immediately to go to lock screen
                setTimeout(() => checkAuth(), 500);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to set passcode');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[-15%] left-[-5%] w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[130px]" />
                <div className="absolute bottom-[-15%] right-[5%] w-[400px] h-[400px] bg-purple-700/15 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Icon */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(99,102,241,0.4)]">
                        <LockKeyhole size={36} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">Private Lock</h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                        Pick a shared secret code with your partner. Both of you will use the <strong className="text-white">same code</strong> to unlock your private space. 🔐
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {status ? (
                        <motion.div key="status" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6">
                            <div className={`rounded-3xl p-6 border ${status.locked
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                                }`}>
                                <div className="text-3xl mb-3">{status.locked ? '🔒' : '⏳'}</div>
                                <p className="font-semibold text-sm leading-relaxed">{status.message}</p>
                            </div>

                            {status.locked ? (
                                <div className="flex items-center justify-center gap-2 text-emerald-400">
                                    <Check size={16} />
                                    <span className="text-sm font-bold">Entering your space...</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => checkAuth()}
                                    className="w-full bg-white/5 border border-white/10 text-gray-300 font-medium py-4 rounded-2xl hover:bg-white/10 transition-all text-sm"
                                >
                                    Check if partner confirmed ↻
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.form key="form" onSubmit={handleSet} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div className="relative">
                                <LockKeyholeOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="password"
                                    value={passcode}
                                    onChange={e => setPasscode(e.target.value)}
                                    placeholder="Shared secret code..."
                                    minLength={3}
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl pl-10 pr-4 py-4 text-center tracking-[0.15em] text-lg focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                            </div>

                            {error && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-sm text-center">
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={passcode.length < 3 || loading}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <><LockKeyhole size={18} /> Lock Our Space</>}
                            </button>

                            <p className="text-center text-xs text-gray-600 pt-1">
                                Tell your partner the same code so they can confirm it 💬
                            </p>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
