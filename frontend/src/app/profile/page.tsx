"use client";

import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { HeartPulse, LogOut, Settings, Award, CalendarHeart, ShieldCheck, HeartCrack, AlertTriangle, Wand2, ShoppingBag, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, bond, token, logout, isAuthenticated, checkAuth, isLoading } = useStore();
    const router = useRouter();
    const [healthScore, setHealthScore] = useState<any>(null);
    const [loadingHealth, setLoadingHealth] = useState(true);
    const [disconnectMsg, setDisconnectMsg] = useState('');

    useEffect(() => {
        if (!isAuthenticated && token) {
            checkAuth();
        }
    }, [isAuthenticated, token, checkAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !token) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, token, router]);

    useEffect(() => {
        if (bond?.id && token) {
            axios.get(`${API_URL}/health/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setHealthScore(res.data.healthScore);
                setLoadingHealth(false);
            }).catch(console.error);
        }
    }, [bond?.id, token]);

    const calculateHealth = async () => {
        if (!bond?.id) return;
        setLoadingHealth(true);
        try {
            const { data } = await axios.post(`${API_URL}/health/calculate/${bond.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHealthScore(data.healthScore);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingHealth(false);
        }
    };

    const handleDisconnect = async (emergency: boolean) => {
        if (!bond?.id) return;
        if (!confirm(emergency ? "Emergency Break: This will instantly shatter your bond. Are you sure?" : "Break Bond: This requires mutual consent. Send request?")) return;

        try {
            const { data } = await axios.post(`${API_URL}/bond/disconnect`,
                { couple_id: bond.id, emergency },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDisconnectMsg(data.message);
            if (emergency || data.message.includes('mutual consent')) {
                setTimeout(() => checkAuth(), 2000);
            }
        } catch (err: any) {
            setDisconnectMsg(err.response?.data?.error || 'Failed to disconnect');
        }
    };

    if (isLoading || (!isAuthenticated && token) || !user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#080808] p-4 overflow-y-auto no-scrollbar pb-60">

            {/* Header Profile Card */}
            <div className="shrink-0 p-6 mx-4 mt-4 glass rounded-3xl border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.1)] relative overflow-hidden bg-gradient-to-br from-black/80 to-purple-900/20">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full p-0.5" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' }}>
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-black text-2xl text-white">
                            {user?.avatar || user?.name?.[0] || 'U'}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{user?.name}</h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-400" /> Space Secured
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex bg-white/5 rounded-2xl p-1 border border-white/5">
                    <div className="flex-1 text-center py-2">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Paired With</p>
                        <p className="text-white font-semibold mt-1 truncate px-2">
                            {bond?.user1_id === user?.id ? bond?.user2_name : (bond?.user1_name || 'Partner')}
                        </p>
                    </div>
                    <div className="w-px bg-white/10 my-2" />
                    <div className="flex-1 text-center py-2">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Streak</p>
                        <p className="text-rose-400 font-bold mt-1 tracking-tight flex items-center justify-center gap-1">
                            <CalendarHeart size={14} /> {bond?.connected_at ? Math.max(1, Math.ceil(Math.abs(new Date().getTime() - new Date(bond.connected_at).getTime()) / (1000 * 60 * 60 * 24))) : 0} Days
                        </p>
                    </div>
                </div>
            </div>

            {/* Relationship Health Score Dashboard */}
            <div className="shrink-0 mx-4 mt-6">
                <div className="flex justify-between items-end mb-4 px-1">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <HeartPulse size={22} className="text-rose-400" /> Health Score
                    </h3>
                    <button
                        onClick={calculateHealth}
                        disabled={loadingHealth}
                        className="text-xs text-rose-300 font-medium bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                    >
                        {loadingHealth ? 'Analyzing...' : 'Refresh AI Analysis'}
                    </button>
                </div>

                <div className="glass rounded-3xl p-6 border-white/5 bg-black/40">
                    {loadingHealth && !healthScore ? (
                        <div className="py-8 flex flex-col items-center justify-center">
                            <HeartPulse size={40} className="text-rose-500 animate-pulse mb-3" />
                            <p className="text-gray-400 text-sm">SambaNova AI is analyzing your bond...</p>
                        </div>
                    ) : healthScore ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex items-center justify-center mb-6">
                                <div className="relative">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                                        <circle
                                            cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent"
                                            strokeDasharray={351.8}
                                            strokeDashoffset={351.8 - (351.8 * healthScore.bond_strength) / 100}
                                            strokeLinecap="round"
                                            className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                        <span className="text-3xl font-bold text-white">{healthScore.bond_strength}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <MetricBar label="Communication" value={healthScore.communication_score} color="bg-blue-400" />
                                <MetricBar label="Trust & Consistency" value={healthScore.trust_meter} color="bg-emerald-400" />
                                <MetricBar label="Interaction Quality" value={healthScore.interaction_score} color="bg-purple-400" />
                                <MetricBar label="Activity Level" value={healthScore.activity_score} color="bg-rose-400" />
                            </div>

                            {healthScore.ai_insight && (
                                <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed">
                                    <p className="font-semibold text-rose-300 mb-1">AI Guru Insight:</p>
                                    {healthScore.ai_insight}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">No health data available. Generate your first report!</div>
                    )}
                </div>
            </div>

            {/* Discovery & Tools */}
            <div className="shrink-0 mx-4 mt-6">
                <h3 className="text-sm font-black text-gray-600 tracking-widest uppercase ml-1 mb-4">Discovery & Tools</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/arena" className="glass p-5 rounded-3xl border-white/5 bg-gradient-to-br from-amber-600/20 to-black/40 flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                            <Trophy size={24} />
                        </div>
                        <span className="text-white font-bold text-sm">Arena Hub</span>
                        <span className="text-[10px] text-gray-500 mt-1">Challenges & Badges</span>
                    </Link>
                    <Link href="/planner" className="glass p-5 rounded-3xl border-white/5 bg-gradient-to-br from-purple-900/40 to-black/40 flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                            <Wand2 size={24} />
                        </div>
                        <span className="text-white font-bold text-sm">Aura Planner</span>
                        <span className="text-[10px] text-gray-500 mt-1">AI-suggested dates</span>
                    </Link>
                    <Link href="/store" className="glass p-5 rounded-3xl border-white/5 bg-gradient-to-br from-rose-900/40 to-black/40 flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={24} />
                        </div>
                        <span className="text-white font-bold text-sm">Point Store</span>
                        <span className="text-[10px] text-gray-500 mt-1">Unlock stickers</span>
                    </Link>
                    <Link href="/letters" className="glass p-5 rounded-3xl border-white/5 bg-gradient-to-br from-emerald-900/40 to-black/40 flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                            <CalendarHeart size={24} />
                        </div>
                        <span className="text-white font-bold text-sm">Time Capsule</span>
                        <span className="text-[10px] text-gray-500 mt-1">Future letters</span>
                    </Link>
                </div>
            </div>

            {/* Settings & Logout */}
            <div className="shrink-0 px-4 mt-8 mb-8 space-y-3">
                <button
                    onClick={() => alert("Settings coming soon! ⚙️")}
                    className="w-full glass p-4 rounded-2xl flex items-center justify-between text-white hover:bg-white/5 transition-colors border-white/5 group"
                >
                    <span className="font-medium flex items-center gap-3">
                        <Settings size={20} className="text-gray-400 group-hover:text-white transition-colors" /> Settings & Privacy
                    </span>
                </button>
                <button
                    onClick={logout}
                    className="w-full glass p-4 rounded-2xl flex items-center justify-between text-gray-300 hover:bg-white/5 transition-colors border-white/5"
                >
                    <span className="font-medium flex items-center gap-3">
                        <LogOut size={20} /> Log Out
                    </span>
                </button>
            </div>

            {/* Danger Zone */}
            {bond?.id && (
                <div className="shrink-0 px-4 mb-12 space-y-3">
                    <h4 className="text-xs uppercase tracking-widest text-rose-500 font-bold ml-2 mb-2">Danger Zone</h4>

                    {disconnectMsg && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl mb-3 text-center">
                            {disconnectMsg}
                        </div>
                    )}

                    <button
                        onClick={() => handleDisconnect(false)}
                        className="w-full glass p-4 rounded-2xl flex items-center justify-between text-orange-400 hover:bg-orange-500/10 transition-colors border-orange-500/20"
                    >
                        <span className="font-medium flex items-center gap-3 text-sm">
                            <HeartCrack size={18} /> Request Mutual Disconnect
                        </span>
                    </button>

                    <button
                        onClick={() => handleDisconnect(true)}
                        className="w-full glass p-4 rounded-2xl flex items-center justify-between text-rose-500 hover:bg-rose-500/10 transition-colors border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.15)]"
                    >
                        <span className="font-medium flex items-center gap-3 text-sm">
                            <AlertTriangle size={18} /> Emergency Break (Instant)
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}

function MetricBar({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-gray-300">{label}</span>
                <span className="text-white">{value}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
        </div>
    );
}
