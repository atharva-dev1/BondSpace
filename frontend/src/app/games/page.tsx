"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Play, Trophy, Sparkles, HeartCrack } from 'lucide-react';
import GameHost from '@/components/games/GameHost';

export default function GamesPage() {
    const { user, token, bond, checkAuth, isLoading: authLoading, isAuthenticated } = useStore();
    const [games, setGames] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({ love_xp: 0, couple_level: 1, streak_days: 0 });

    useEffect(() => {
        if (!user || !bond) {
            checkAuth();
        }
        fetchGames();
    }, [checkAuth, user, bond]);

    useEffect(() => {
        if (user?.id) fetchStats();
        if (bond?.id) fetchActiveSession();
    }, [user?.id, bond?.id]);

    const fetchActiveSession = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/games/active/${bond?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.session) {
                setActiveSession(data.session);
            }
        } catch (err) {
            // No active session or ignored
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/gamification/stats/${user?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.stats) setStats(data.stats);
        } catch (err: any) {
            console.error(err);
            alert("XP Error: " + (err.response?.data?.error || err.message));
        }
    };

    const handleCheckIn = async () => {
        try {
            const { data } = await axios.post(`${API_URL}/gamification/checkin`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(data.message);
            fetchStats();
        } catch (err) {
            console.error(err);
        }
    };

    const fetchGames = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/games`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGames(data.games);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startGame = async (gameId: string) => {
        if (!bond) {
            alert('Cannot start game: Bond state is missing. Please try logging out and logging back in.');
            return;
        }
        try {
            const { data } = await axios.post(`${API_URL}/games/session/start`, {
                game_id: gameId,
                couple_id: bond.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveSession(data.session);
        } catch (err: any) {
            console.error(err);
            alert("Game Start Error: " + (err.response?.data?.error || err.message));
        }
    };

    // We must wait for BOTH local games fetch AND global auth hydration to finish
    if (loading || authLoading) return <div className="flex items-center justify-center h-[calc(100vh-100px)]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" /></div>;

    if (!isAuthenticated || !bond) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] px-6 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <HeartCrack className="text-gray-400" size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Not Connected</h2>
                <p className="text-gray-400 text-sm">You need to have an active bond and be logged in to play games.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <header className="p-4 mx-4 mt-4 mb-2 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-purple-400 flex items-center gap-2">
                        <Gamepad2 size={28} className="text-rose-400" /> Love Arena
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Play games, earn Love XP, and connect deeply.</p>
                </div>
                <button
                    onClick={handleCheckIn}
                    className="px-4 py-2 bg-rose-500/10 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 hover:bg-rose-500/20 transition-all font-sans tracking-wide"
                >
                    Daily Check-in
                </button>
            </header>

            {/* Active Session View */}
            <AnimatePresence mode="wait">
                {activeSession ? (
                    <motion.div
                        key="game-host"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex-1 w-full max-w-md mx-auto h-full flex flex-col"
                    >
                        <GameHost session={activeSession} onExit={() => setActiveSession(null)} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="games-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 no-scrollbar"
                    >
                        {/* Top Stats Card */}
                        <div className="glass rounded-3xl p-5 border-white/5 bg-gradient-to-br from-purple-900/40 to-black/60 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full pointer-events-none" />
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium">Couple Level</p>
                                    <h3 className="text-3xl font-bold text-white mt-1">{stats.couple_level}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400 text-sm font-medium">Love XP</p>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <Trophy size={16} className="text-yellow-400" />
                                        <h3 className="text-2xl font-bold text-yellow-400">{stats.love_xp.toLocaleString()}</h3>
                                    </div>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-rose-500 to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]"
                                    style={{ width: `${(stats.love_xp % 500) / 500 * 100}%` }}
                                />
                            </div>
                            <p className="text-right text-[10px] text-gray-500 mt-1.5">{500 - (stats.love_xp % 500)} XP to Level {stats.couple_level + 1}</p>
                        </div>

                        <h3 className="text-lg font-semibold text-white mt-6 mb-2">Available Games</h3>

                        <div className="grid grid-cols-2 gap-3">
                            {games.map((game, i) => (
                                <button
                                    key={game.id}
                                    onClick={() => startGame(game.id)}
                                    className="glass p-4 rounded-3xl border-transparent hover:border-rose-500/30 transition-all text-left group relative overflow-hidden"
                                >
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${i % 2 === 0 ? 'from-rose-500/10 to-transparent' : 'from-purple-500/10 to-transparent'}`} />
                                    <div className="relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 text-gray-300 group-hover:text-rose-400 transition-colors">
                                            <Play size={18} className="ml-1" />
                                        </div>
                                        <h4 className="font-semibold text-gray-200 text-sm leading-tight">{game.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{game.description}</p>

                                        <div className="mt-3 flex items-center gap-1 bg-white/5 w-max px-2 py-0.5 rounded text-[10px] text-emerald-400 font-medium border border-white/5">
                                            +50 XP
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
