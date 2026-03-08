"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Award, Zap, ChevronRight, CheckCircle2, Lock, Star, Heart } from 'lucide-react';
import Link from 'next/link';

interface Challenge {
    id: string;
    title: string;
    description: string;
    task_type: string;
    current_count: number;
    target_count: number;
    is_completed: boolean;
    points_reward: number;
    xp_reward: number;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    category: string;
    unlocked_at: string | null;
    points_reward: number;
}

export default function ArenaHub() {
    const { user, token } = useStore();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArenaData();
    }, [token]);

    const fetchArenaData = async () => {
        if (!token) return;
        try {
            const [chRes, achRes] = await Promise.all([
                axios.get(`${API_URL}/gamification/challenges`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/gamification/achievements`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setChallenges(chRes.data.challenges);

            // Map achievements to include unlocked status
            const unlockedIds = achRes.data.unlocked.map((a: any) => a.id);
            const allAch = achRes.data.all.map((a: any) => ({
                ...a,
                unlocked_at: unlockedIds.includes(a.id) ? 'unlocked' : null
            }));
            setAchievements(allAch);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'chat': return <Zap className="text-yellow-400" size={16} />;
            case 'game': return <Trophy className="text-rose-400" size={16} />;
            case 'wall': return <Star className="text-purple-400" size={16} />;
            case 'photo': return <Heart className="text-pink-400" size={16} />;
            default: return <Target className="text-blue-400" size={16} />;
        }
    };

    return (
        <div className="space-y-8 pb-32">
            {/* Stats Header */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-4 rounded-3xl border-white/5 bg-gradient-to-br from-rose-500/10 to-transparent">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Level</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white">{user?.couple_level || 1}</span>
                        <span className="text-xs text-rose-400 font-bold mb-1">XP: {user?.love_xp || 0}</span>
                    </div>
                </div>
                <div className="glass p-4 rounded-3xl border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Love Points</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white">{user?.points || 0}</span>
                        <Link href="/store" className="p-1 px-2 bg-white/5 rounded-lg border border-white/10 text-[8px] font-black uppercase text-gray-400 mb-1 hover:text-white transition-colors">
                            Shop
                        </Link>
                    </div>
                </div>
            </div>

            {/* Daily Challenges */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-white font-black text-sm tracking-tighter flex items-center gap-2">
                        <Target size={18} className="text-rose-500" />
                        Daily Challenges
                    </h3>
                    <span className="text-[10px] text-gray-500 font-medium">Resets daily</span>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-20 glass rounded-3xl animate-pulse" />)
                    ) : (
                        challenges.map(ch => (
                            <motion.div
                                key={ch.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass p-4 rounded-[28px] border-white/5 relative overflow-hidden group ${ch.is_completed ? 'bg-emerald-500/5' : ''}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                                        {getTypeIcon(ch.task_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-white font-bold text-xs truncate">{ch.title}</h4>
                                            <span className="text-[10px] font-black text-emerald-400">+{ch.points_reward} Pts</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 truncate mb-2">{ch.description}</p>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (ch.current_count / ch.target_count) * 100)}%` }}
                                                className={`h-full rounded-full ${ch.is_completed ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}
                                            />
                                        </div>
                                    </div>
                                    {ch.is_completed && (
                                        <div className="text-emerald-500">
                                            <CheckCircle2 size={20} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </section>

            {/* Achievement Badges */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-white font-black text-sm tracking-tighter flex items-center gap-2">
                        <Award size={18} className="text-purple-500" />
                        Badges & Achievements
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square glass rounded-3xl animate-pulse" />)
                    ) : (
                        achievements.map((ach) => (
                            <div
                                key={ach.id}
                                className={`aspect-square glass p-3 rounded-[32px] border-dashed border-white/10 flex flex-col items-center justify-center text-center relative group ${ach.unlocked_at ? 'bg-purple-500/10 border-solid border-purple-500/20' : 'opacity-40 filter grayscale'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${ach.unlocked_at ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500'}`}>
                                    {ach.unlocked_at ? <Trophy size={20} /> : <Lock size={16} />}
                                </div>
                                <h5 className="text-[9px] font-black text-white leading-tight uppercase tracking-tighter line-clamp-2">{ach.name}</h5>
                                {!ach.unlocked_at && (
                                    <div className="mt-1 px-1.5 py-0.5 bg-black/40 rounded-full border border-white/5">
                                        <span className="text-[7px] text-gray-500 font-bold">Locked</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
