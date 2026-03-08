"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, Loader2, Check, X, UserCircle } from 'lucide-react';

interface Inviter {
    id: string;
    name: string;
    avatar: string;
    bio: string;
}

export default function JoinClient() {
    const params = useParams();
    const router = useRouter();
    const code = params?.code as string;
    const { token, isAuthenticated, isLoading, checkAuth } = useStore();

    const [inviter, setInviter] = useState<Inviter | null>(null);
    const [checking, setChecking] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => { checkAuth(); }, []);

    useEffect(() => {
        if (isLoading) return;
        if (!code) return;
        fetchInvite();
    }, [isLoading, code]);

    const fetchInvite = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/bond/invite/check/${code}`);
            setInviter(data.inviter);
        } catch (err: any) {
            setError(err.response?.data?.error || 'This invite link is invalid or has expired.');
        } finally {
            setChecking(false);
        }
    };

    const handleJoin = async () => {
        if (!token) {
            sessionStorage.setItem('pending_invite', code);
            router.push('/');
            return;
        }

        setJoining(true);
        try {
            await axios.post(`${API_URL}/bond/join/${code}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(true);
            setTimeout(() => {
                checkAuth();
                router.push('/');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to join. Try again.');
        } finally {
            setJoining(false);
        }
    };

    if (checking || isLoading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <Loader2 className="text-rose-400 animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-[-15%] right-[10%] w-[400px] h-[400px] bg-rose-600/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] left-[10%] w-[350px] h-[350px] bg-purple-700/15 rounded-full blur-[110px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10 text-center"
            >
                {error ? (
                    <>
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                            <X size={36} className="text-rose-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">Link Expired</h2>
                        <p className="text-gray-500 text-sm mb-8">{error}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all"
                        >
                            Go to BondSpace
                        </button>
                    </>
                ) : success ? (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(225,29,72,0.5)]"
                        >
                            <Check size={36} className="text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-black text-white mb-3">You're bonded! 💞</h2>
                        <p className="text-gray-500 text-sm">Taking you to your private universe...</p>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-5xl mx-auto mb-6">
                            {inviter?.avatar || '💖'}
                        </div>
                        <p className="text-gray-500 text-sm mb-1">You've been invited by</p>
                        <h2 className="text-3xl font-black text-white mb-2">{inviter?.name}</h2>
                        {inviter?.bio && <p className="text-gray-500 text-sm italic mb-8">"{inviter.bio}"</p>}
                        {!inviter?.bio && <div className="mb-8" />}

                        <div className="flex items-center justify-center gap-4 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-2xl">
                                {inviter?.avatar || '💖'}
                            </div>
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                <Heart size={24} className="text-rose-400 fill-rose-400" />
                            </motion.div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center">
                                <UserCircle size={28} className="text-gray-500" />
                            </div>
                        </div>

                        {!isAuthenticated ? (
                            <>
                                <p className="text-gray-500 text-sm mb-6">
                                    Create your account first, then come back to accept this invite.
                                </p>
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem('pending_invite', code);
                                        router.push('/');
                                    }}
                                    className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
                                >
                                    Sign Up to Accept 💞
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-5 rounded-2xl shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-lg"
                            >
                                {joining
                                    ? <Loader2 size={22} className="animate-spin mx-auto" />
                                    : <>💞 Accept &amp; Connect</>
                                }
                            </button>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
}
