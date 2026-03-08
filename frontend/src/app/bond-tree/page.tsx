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
    const [isAdding, setIsAdding] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        label: '',
        description: '',
        event_type: 'milestone',
        event_date: new Date().toISOString().split('T')[0]
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!bond) checkAuth();
    }, []);

    const fetchEvents = () => {
        if (bond?.id && token) {
            setLoading(true);
            axios.get(`${API_URL}/gallery/timeline/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setEvents(res.data.timeline || []);
            }).catch(console.error).finally(() => setLoading(false));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [bond?.id, token]);

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bond?.id || !token) return;

        setUploading(true);
        let media_url = '';
        try {
            // Upload image if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('couple_id', bond.id);
                formData.append('media', selectedFile);

                const { data } = await axios.post(`${API_URL}/gallery/timeline/upload`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                media_url = data.media_url;
            }

            await axios.post(`${API_URL}/gallery/timeline`, {
                couple_id: bond.id,
                ...newMilestone,
                media_url: media_url || undefined
            }, { headers: { Authorization: `Bearer ${token}` } });

            setIsAdding(false);
            setNewMilestone({
                label: '',
                description: '',
                event_type: 'milestone',
                event_date: new Date().toISOString().split('T')[0]
            });
            setSelectedFile(null);
            setPreviewUrl(null);
            fetchEvents();
        } catch (err: any) {
            console.error('Failed to add milestone:', err.response?.data || err);
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="flex-1 flex flex-col bg-[#080808] p-4 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full -z-10" />

            <header className="mb-6 flex justify-between items-center bg-black/40 glass p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3">
                    <Link href="/gallery" className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/10">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
                            Bond Tree <Heart size={18} className="text-accent fill-accent" />
                        </h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">Growth Timeline</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="bg-accent-soft px-2 py-1 rounded-full border border-accent/20 text-accent text-[9px] font-black uppercase tracking-tight flex items-center gap-1">
                        <Star size={10} /> {Math.floor(events.length / 5) + 1}
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-9 h-9 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
                </div>
            ) : (
                <div className="flex-1 relative overflow-auto no-scrollbar">
                    <div className="relative pt-20 pb-40 min-h-full">
                        {/* The Tree Root & Trunk */}
                        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 bg-gradient-to-b from-transparent via-rose-500/20 to-rose-500/40 rounded-full" />
                        {events.length === 0 ? (
                            <div className="text-center py-20 space-y-4">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-gray-500 text-sm italic">"The best time to plant a tree was 20 years ago. <br /> The second best time is now."</p>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="bg-rose-500 text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 mx-auto active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                                >
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
                                        <div className={`absolute top-1/2 h-0.5 w-[5%] bg-rose-500/40 ${i % 2 === 0 ? 'left-[45%]' : 'right-[45%]'}`} />

                                        {/* Glowing Node on Trunk */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-rose-500 rounded-full z-10 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />

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

            {/* Add Milestone Modal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsAdding(false)}
                    >
                        <motion.form
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#121212] w-full max-w-sm rounded-[40px] p-8 space-y-4 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
                            onClick={e => e.stopPropagation()}
                            onSubmit={handleAddMilestone}
                        >
                            <h3 className="text-2xl font-black text-white mb-2">New Milestone 🌿</h3>

                            {/* Image Picker */}
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="milestone-image"
                                />
                                <label
                                    htmlFor="milestone-image"
                                    className="block aspect-video rounded-3xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer overflow-hidden group-hover:border-rose-500/30"
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 bg-white/5">
                                            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 border border-rose-500/20">
                                                <Camera size={24} />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400/60">Tapon to Add Photo</span>
                                        </div>
                                    )}
                                </label>
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/60 hover:text-white transition-colors"
                                    >
                                        <Plus className="rotate-45" size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">What happened?</label>
                                <input
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-rose-500/50 outline-none transition-all"
                                    placeholder="First Date, Moved In, etc."
                                    value={newMilestone.label}
                                    onChange={e => setNewMilestone({ ...newMilestone, label: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">The Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-rose-500/50 outline-none transition-all"
                                    value={newMilestone.event_date}
                                    onChange={e => setNewMilestone({ ...newMilestone, event_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">The Story</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-rose-500/50 outline-none transition-all resize-none h-32"
                                    placeholder="Write a little note about this memory..."
                                    value={newMilestone.description}
                                    onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 bg-rose-500 text-white font-bold py-4 rounded-2xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Planting...
                                        </>
                                    ) : (
                                        'Plant Seed'
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
