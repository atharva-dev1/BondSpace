"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, Camera, Star, ArrowLeft, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TimelineEvent {
    id: string;
    event_type: string;
    label: string;
    description: string;
    media_url?: string;
    event_date: string;
}

export default function BondTreePage() {
    const { bond, token, isAuthenticated, checkAuth } = useStore();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

    useEffect(() => {
        if (!bond) checkAuth();
    }, []);

    useEffect(() => {
        if (bond?.id && token) {
            axios.get(`${API_URL}/gallery/timeline/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setEvents(res.data.timeline || []);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [bond?.id, token]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] p-4 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full -z-10" />

            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/gallery" className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            Bond Tree <Heart size={20} className="text-rose-500 fill-rose-500" />
                        </h2>
                        <p className="text-gray-500 text-xs font-medium">Your relationship, branch by branch.</p>
                    </div>
                </div>
                <div className="bg-rose-500/20 px-4 py-1.5 rounded-full border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                    <Star size={14} /> Level {Math.floor(events.length / 5) + 1}
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
                </div>
            ) : (
                <div className="flex-1 relative overflow-auto no-scrollbar">
                    {/* The Tree Root & Trunk */}
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-2 h-full bg-gradient-to-t from-rose-900/40 via-rose-500/20 to-transparent rounded-full" />

                    <div className="relative pt-20 pb-40 min-h-full">
                        {events.length === 0 ? (
                            <div className="text-center py-20 space-y-4">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-gray-500 text-sm italic">"The best time to plant a tree was 20 years ago. <br /> The second best time is now."</p>
                                <button className="bg-rose-500 text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 mx-auto">
                                    <Plus size={18} /> Add First Milestone
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-16 max-w-sm mx-auto">
                                {events.map((event, i) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`relative flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                                    >
                                        {/* Connector Branch */}
                                        <div className={`absolute top-1/2 h-0.5 w-12 bg-rose-500/30 ${i % 2 === 0 ? 'left-[calc(50%+4px)]' : 'right-[calc(50%+4px)]'}`} />

                                        <div
                                            onClick={() => setSelectedEvent(event)}
                                            className="w-[45%] group cursor-pointer"
                                        >
                                            <div className="glass p-3 rounded-2xl border-white/5 group-hover:border-rose-500/30 transition-all bg-black/40 backdrop-blur-xl group-hover:scale-105">
                                                {event.media_url ? (
                                                    <img src={event.media_url} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                                                ) : (
                                                    <div className="w-full h-16 bg-white/5 rounded-xl mb-2 flex items-center justify-center text-gray-700">
                                                        <Camera size={24} />
                                                    </div>
                                                )}
                                                <h4 className="text-white text-[13px] font-bold truncate">{event.label}</h4>
                                                <div className="flex items-center gap-1 mt-1 opacity-60">
                                                    <Calendar size={10} className="text-rose-400" />
                                                    <span className="text-[9px] text-gray-400">{new Date(event.event_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedEvent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#121212] w-full max-w-sm rounded-[40px] overflow-hidden border border-white/10 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {selectedEvent.media_url && (
                                <img src={selectedEvent.media_url} alt="" className="w-full h-56 object-cover" />
                            )}
                            <div className="p-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                                        {selectedEvent.event_type}
                                    </span>
                                    <span className="text-gray-500 text-xs flex items-center gap-2">
                                        <Calendar size={14} /> {new Date(selectedEvent.event_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-white">{selectedEvent.label}</h3>
                                <p className="text-gray-400 text-[15px] leading-relaxed italic">{selectedEvent.description}</p>

                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
