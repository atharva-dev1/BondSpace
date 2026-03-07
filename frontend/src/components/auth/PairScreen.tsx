"use client";

import { useState } from 'react';
import axios from 'axios';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HeartHandshake, Link as LinkIcon, AlertCircle } from 'lucide-react';

export default function PairScreen({ onPairSuccess }: { onPairSuccess: () => void }) {
    const { user, token, setBond } = useStore();
    const [partnerEmail, setPartnerEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // First find partner by email
            // Not a real route in our backend, so we assume they have the ID. 
            // For MVP, let's create a quick workaround: since our backend only accepts `to_user_id`,
            // we need an endpoint to lookup user by email, or we just put the User ID here for now.
            // Let's assume the user enters their partner's User ID (which we can show on screen).
            const { data } = await axios.post(`${API_URL}/bond/request`, {
                to_user_id: partnerEmail.trim() // using email input as ID for simplicity in MVP
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Bond request sent successfully! Waiting for them to accept 💕');
            setPartnerEmail('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center z-10 relative">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black/50 border-2 border-rose-500/30 text-rose-400 mb-6 glow-rose">
                        <HeartHandshake size={40} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Connect Your Space</h2>
                    <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                        BondSpace is designed for two. Enter your partner's ID to link your worlds together.
                    </p>

                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-8">
                        <p className="text-sm text-gray-400 mb-1">Your BondSpace ID:</p>
                        <p className="font-mono text-rose-300 text-sm select-all bg-black/50 p-2 rounded-lg border border-rose-500/20">{user?.id}</p>
                        <p className="text-xs text-gray-500 mt-2">Share this with your partner so they can connect with you.</p>
                    </div>

                    <form onSubmit={handleSendRequest} className="space-y-4">
                        <div>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    value={partnerEmail}
                                    onChange={e => setPartnerEmail(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-gray-600"
                                    placeholder="Enter partner's ID"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center space-x-2 text-rose-500 text-sm bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {message && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 text-sm bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                                {message}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !partnerEmail}
                            className="w-full bg-white text-black font-semibold rounded-2xl py-4 mt-4 transition-all hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white active:scale-[0.98]"
                        >
                            {loading ? 'Sending Request...' : 'Send Bond Request'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
