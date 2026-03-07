"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationLog {
    id: string;
    lat: number;
    lng: number;
    address?: string;
    place_name?: string;
    is_reached_home: boolean;
    timestamp: string;
}

export default function TravelTimeline({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { bond, token } = useStore();
    const [history, setHistory] = useState<LocationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && bond?.user2_id && token) {
            axios.get(`${API_URL}/location/history/${bond.user2_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setHistory(res.data.history);
                setLoading(false);
            }).catch(console.error);
        }
    }, [isOpen, bond?.user2_id, token]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 w-full h-[60%] bg-black/95 backdrop-blur-3xl rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40 flex flex-col pt-2"
                >
                    <div className="w-full flex justify-center pb-4 pt-2 cursor-pointer" onClick={onClose}>
                        <div className="w-12 h-1.5 rounded-full bg-white/20" />
                    </div>

                    <div className="px-6 pb-4">
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400">
                            Partner's Timeline
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10">No travel history available yet.</div>
                        ) : (
                            <div className="relative border-l-2 border-white/10 ml-3 pl-6 space-y-8">
                                {history.map((log, idx) => {
                                    const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const date = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

                                    return (
                                        <div key={log.id} className="relative">
                                            {/* Dot */}
                                            <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-black ${log.is_reached_home ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-indigo-400'}`} />

                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <div className="font-semibold text-gray-200">
                                                    {log.is_reached_home ? 'Home 🏡' : (log.place_name || log.address || 'Unknown Location')}
                                                </div>
                                                <span className="text-xs text-gray-500 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                                                    <Clock size={10} /> {time}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <MapPin size={10} /> {Number(log.lat).toFixed(4)}, {Number(log.lng).toFixed(4)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
