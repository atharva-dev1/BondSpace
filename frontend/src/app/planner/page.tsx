"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, MapPin, Clock, ArrowLeft, Plus, Check, Loader2, Wand2 } from 'lucide-react';
import Link from 'next/link';

interface PlannedEvent {
    id: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    theme: string;
    is_completed: boolean;
}

interface Suggestion {
    title: string;
    description: string;
    location: string;
    theme: string;
    duration: string;
}

export default function AIPlannerPage() {
    const { bond, token, isAuthenticated, checkAuth } = useStore();
    const [events, setEvents] = useState<PlannedEvent[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPlanning, setIsPlanning] = useState(false);
    const [suggestionMode, setSuggestionMode] = useState(false);

    useEffect(() => {
        if (!bond) checkAuth();
        fetchEvents();
    }, [bond?.id, token]);

    const fetchEvents = async () => {
        if (!bond?.id || !token) return;
        try {
            const res = await axios.get(`${API_URL}/planner/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(res.data.events);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const generateSuggestions = async () => {
        setIsPlanning(true);
        setSuggestionMode(true);
        try {
            const { data } = await axios.post(`${API_URL}/ai/plan-activity`,
                { theme: 'romantic', mood: 'adventurous' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuggestions(data.suggestions);
        } catch (err) {
            console.error(err);
        } finally {
            setIsPlanning(false);
        }
    };

    const addEvent = async (sug: Suggestion) => {
        try {
            await axios.post(`${API_URL}/planner/event`, {
                couple_id: bond?.id,
                title: sug.title,
                description: sug.description,
                event_date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
                location: sug.location,
                theme: sug.theme
            }, { headers: { Authorization: `Bearer ${token}` } });

            setSuggestionMode(false);
            fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    const markCompleted = async (id: string) => {
        try {
            await axios.put(`${API_URL}/planner/event/${id}`, { is_completed: true }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] p-4 overflow-hidden relative">
            <header className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/profile" className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            Aura Planner <Wand2 size={20} className="text-purple-400" />
                        </h2>
                        <p className="text-gray-500 text-xs font-medium">AI-powered date architect.</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                {/* AI Inspiration Card */}
                {!suggestionMode && (
                    <div
                        onClick={generateSuggestions}
                        className="glass p-6 rounded-[32px] border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-black/60 cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -z-10" />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Need inspiration?</h3>
                                <p className="text-xs text-gray-400">Let Aura suggest your next adventure.</p>
                            </div>
                        </div>
                        <button className="w-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold py-3 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                            Ask Aura for Ideas
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {suggestionMode ? (
                        <motion.div
                            key="suggestions"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="space-y-4"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-black text-purple-400 tracking-widest uppercase">Aura's Suggestions</h3>
                                <button onClick={() => setSuggestionMode(false)} className="text-xs text-gray-500 underline">Dismiss</button>
                            </div>

                            {isPlanning ? (
                                <div className="h-40 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="animate-spin text-purple-500" size={32} />
                                    <p className="text-gray-500 text-sm italic">Dreaming up beautiful things...</p>
                                </div>
                            ) : (
                                suggestions.map((sug, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="glass p-4 rounded-3xl border-white/5 bg-white/[0.02] flex justify-between items-center"
                                    >
                                        <div className="space-y-1 pr-4">
                                            <h4 className="font-bold text-white text-[15px]">{sug.title}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2">{sug.description}</p>
                                            <div className="flex gap-3 pt-2">
                                                <span className="text-[10px] text-purple-400 flex items-center gap-1"><MapPin size={10} /> {sug.location}</span>
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10} /> {sug.duration}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addEvent(sug)}
                                            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-600 tracking-widest uppercase ml-1">Planned Horizon</h3>
                            {events.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-sm">No plans yet. The future is a blank canvas. ✨</p>
                                </div>
                            ) : (
                                events.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        layout
                                        className={`glass p-5 rounded-3xl border border-white/5 transition-all ${event.is_completed ? 'opacity-50 grayscale' : 'shadow-xl'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className={`font-bold text-white ${event.is_completed ? 'line-through' : ''}`}>{event.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-bold uppercase tracking-tighter">
                                                        {event.theme}
                                                    </span>
                                                    <span className="text-[10px] text-rose-400 font-bold">
                                                        {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                            {!event.is_completed && (
                                                <button
                                                    onClick={() => markCompleted(event.id)}
                                                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">{event.description}</p>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                <MapPin size={12} className="text-gray-600" /> {event.location}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
