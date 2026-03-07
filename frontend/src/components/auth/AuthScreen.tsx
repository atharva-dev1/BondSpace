"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { Heart, Lock, Mail, User } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const { data } = await axios.post(`${API_URL}${endpoint}`, formData);
            login(data.token, data.user);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <motion.div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mb-4 glow-rose"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Heart size={32} />
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
                        BondSpace
                    </h1>
                    <p className="text-gray-400 mt-2">A private digital universe for two</p>
                </div>

                <div className="glass rounded-2xl p-8 shadow-2xl shadow-rose-900/20">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="text-sm font-medium text-gray-300 ml-1">Name</label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-gray-600"
                                        placeholder="Your name"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-gray-600"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-gray-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-semibold rounded-xl py-3 mt-6 transition-all hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {loading ? 'Processing...' : isLogin ? 'Welcome Back' : 'Create Space'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-gray-400 hover:text-rose-400 transition-colors text-sm"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
