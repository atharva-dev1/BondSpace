"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { Image as ImageIcon, Plus, Heart, Calendar, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function GalleryPage() {
    const { token, bond, checkAuth } = useStore();
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            checkAuth();
        }
    }, [token, checkAuth]);

    useEffect(() => {
        if (bond?.id) {
            axios.get(`${API_URL}/gallery/albums/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setAlbums(res.data.albums);
                setLoading(false);
            }).catch(console.error);
        }
    }, [bond?.id, token]);

    const handleCreateAlbum = async () => {
        const title = prompt("Enter album title:");
        if (!title || !bond?.id) return;

        try {
            const { data } = await axios.post(`${API_URL}/gallery/albums`, {
                couple_id: bond.id,
                title: title
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Auto refresh
            setAlbums(prev => [data.album, ...prev]);
        } catch (err) {
            console.error('Failed to create album', err);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <header className="p-4 mx-4 mt-4 mb-2 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-purple-400 flex items-center gap-2">
                        <ImageIcon size={28} className="text-rose-400" /> Space
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Your private memory cloud.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/bond-tree" className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-2xl border border-rose-500/20 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2">
                        <Star size={14} className="fill-current" /> View Bond Tree
                    </Link>
                    <button
                        onClick={handleCreateAlbum}
                        className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] glow-rose"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 no-scrollbar">
                {/* Memory Reel Highlight */}
                <div className="glass rounded-3xl p-4 border-rose-500/20 relative overflow-hidden bg-black/60 shadow-lg group cursor-pointer">
                    <img
                        src="https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&h=400&fit=crop"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                        alt="Memory Reel"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="relative z-10 h-40 flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-1">
                            <Heart size={16} fill="currentColor" className="text-rose-500 animate-pulse" />
                            <p className="text-rose-300 text-xs font-semibold tracking-wider uppercase">Memory Reel</p>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Summer '24 Highlights</h3>
                        <p className="text-gray-300 text-sm mt-1.5 flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" /> Auto-generated • 2m 14s
                        </p>
                    </div>
                </div>

                {/* Albums Grid */}
                <h3 className="text-lg font-semibold text-white mt-8 mb-2 px-1">Shared Albums</h3>
                <AnimatePresence>
                    <div className="grid grid-cols-2 gap-3">
                        {albums.map((album, i) => (
                            <Link key={album.id} href={`/gallery/${album.id}`}>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass rounded-3xl overflow-hidden aspect-[4/5] relative group cursor-pointer border-white/5"
                                >
                                    {album.cover_url ? (
                                        <img src={album.cover_url} alt={album.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center">
                                            <ImageIcon size={32} className="text-white/20" />
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 p-4 relative z-10">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h4 className="font-semibold text-white text-sm leading-tight drop-shadow-md">{album.title}</h4>
                                                <p className="text-[11px] text-gray-300 mt-1 font-medium bg-black/40 w-max px-2 py-0.5 rounded backdrop-blur-md">
                                                    {album.media_count || 0} items
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className="text-white/40 group-hover:text-white/80 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                                </motion.div>
                            </Link>
                        ))}

                        {/* Empty State / Add Placeholder */}
                        {albums.length === 0 && !loading && (
                            <div className="col-span-2 flex flex-col items-center justify-center py-10 px-6 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
                                <ImageIcon size={40} className="text-white/20 mb-3" />
                                <p className="text-gray-400 text-sm font-medium">No albums yet.</p>
                                <p className="text-gray-500 text-xs mt-1">Tap the + to create your first memory collection.</p>
                            </div>
                        )}
                    </div>
                </AnimatePresence>
            </div>
        </div>
    );
}
