"use client";

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

export default function AuthPage() {
    const { login } = useStore();
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
            const payload = tab === 'login'
                ? { email: form.email, password: form.password }
                : { name: form.name, email: form.email, password: form.password };

            const { data } = await axios.post(`${API_URL}${endpoint}`, payload);
            await login(data.token, data.user);

        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-4">
            {/* Ambient gradient blobs */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-rose-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[5%] w-[400px] h-[400px] bg-purple-700/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Logo mark */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 flex flex-col items-center"
            >
                <div className="w-20 h-20 mb-4 relative">
                    <img src="/logo.svg" alt="BondSpace Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">BondSpace</h1>
                <p className="text-white/40 text-sm mt-1 font-medium tracking-wide">A private universe for two.</p>
            </motion.div>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-sm"
            >
                {/* Tab switcher */}
                <div className="flex bg-white/5 rounded-2xl p-1 mb-8 border border-white/10">
                    {(['login', 'register'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(''); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${tab === t
                                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {t === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                        {tab === 'register' && (
                            <motion.div
                                key="name"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        required={tab === 'register'}
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-rose-500/50 transition-all"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-rose-500/50 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type={showPw ? 'text' : 'password'}
                            placeholder="Password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            required
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-2xl pl-10 pr-12 py-4 focus:outline-none focus:border-rose-500/50 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(v => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-rose-400 text-sm text-center bg-rose-500/10 border border-rose-500/20 rounded-xl py-2.5 px-4"
                        >
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_30px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Sparkles size={18} />
                                {tab === 'login' ? 'Enter Your Space' : 'Begin Your Journey'}
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-600 text-xs mt-8">
                    By continuing you agree to our{' '}
                    <span className="text-rose-400 hover:underline cursor-pointer">Privacy Policy</span>
                </p>
            </motion.div>
        </div>
    );
}
