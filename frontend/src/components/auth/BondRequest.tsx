"use client";

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HeartHandshake, Search, Loader2, Copy, Check } from 'lucide-react';

export default function BondRequest() {
    const { token, user, checkAuth } = useStore();
    const [partnerId, setPartnerId] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerId.trim()) return;

        setLoading(true);
        setMessage(null);

        try {
            await axios.post(
                `${API_URL}/bond/request`,
                { to_user_id: partnerId.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ text: '💕 Bond request sent! Waiting for them to accept.', type: 'success' });
            checkAuth();
        } catch (err: any) {
            setMessage({
                text: err.response?.data?.error || 'Failed to send bond request',
                type: 'error'
            });
        } finally {
            setLoading(false);
            setPartnerId('');
        }
    };

    const copyId = () => {
        navigator.clipboard.writeText(user?.id || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-[-15%] left-[5%] w-[450px] h-[450px] bg-rose-600/15 rounded-full blur-[130px]" />
                <div className="absolute bottom-[-15%] right-[5%] w-[400px] h-[400px] bg-purple-700/15 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(225,29,72,0.4)]">
                        <HeartHandshake size={36} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">Find Your Partner</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Share your User ID with your partner, and enter theirs to create your private universe.
                    </p>
                </div>

                {/* Your ID card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                    <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Your User ID</p>
                    <div className="flex items-center justify-between gap-3">
                        <code className="text-rose-300 text-sm font-mono flex-1 truncate">{user?.id}</code>
                        <button
                            onClick={copyId}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copied
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                                }`}
                        >
                            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                        </button>
                    </div>
                </div>

                {/* Send request form */}
                <form onSubmit={handleSendRequest} className="space-y-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={partnerId}
                            onChange={(e) => setPartnerId(e.target.value)}
                            placeholder="Paste your partner's User ID..."
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-rose-500/50 transition-all font-mono text-sm"
                        />
                    </div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3.5 rounded-xl text-sm font-medium ${message.type === 'error'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                        >
                            {message.text}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={!partnerId.trim() || loading}
                        className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2"
                    >
                        {loading
                            ? <Loader2 size={20} className="animate-spin" />
                            : <><HeartHandshake size={18} /> Send Bond Request</>
                        }
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
