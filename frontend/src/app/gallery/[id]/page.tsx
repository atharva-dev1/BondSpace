"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Upload, Loader2, Image as ImageIcon, Trash2, Maximize2 } from 'lucide-react';
import Link from 'next/link';

export default function AlbumDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token, bond, user, checkAuth } = useStore();
    const [album, setAlbum] = useState<any>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (token) {
            checkAuth();
        }
    }, [token, checkAuth]);

    useEffect(() => {
        if (id && token) {
            fetchAlbumData();
        }
    }, [id, token]);

    const fetchAlbumData = async () => {
        try {
            const [albumRes, mediaRes] = await Promise.all([
                axios.get(`${API_URL}/gallery/album/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/gallery/media/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setAlbum(albumRes.data.album);
            setMedia(mediaRes.data.media);
        } catch (err) {
            console.error('Failed to fetch album data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!bond?.id || !id) {
            alert("Bond information not loaded. Please wait a moment or refresh.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        setUploadProgress(10);

        const formData = new FormData();
        formData.append('album_id', id as string);
        formData.append('couple_id', bond.id);
        formData.append('caption', '');
        formData.append('media', file);

        try {
            const { data } = await axios.post(`${API_URL}/gallery/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    setUploadProgress(percentCompleted);
                }
            });

            // Set progress to 100 before finishing
            setUploadProgress(100);

            // Artificial delay for smooth transition
            await await new Promise(r => setTimeout(r, 800));

            setMedia(prev => [data.media, ...prev]);

            // Clean up
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err: any) {
            console.error('Upload failed', err);
            const errorMsg = err.response?.data?.details || err.message || "Upload failed";
            alert(`Error: ${errorMsg}`);
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-rose-500" /></div>;
    if (!album) return <div className="p-10 text-center">Album not found.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <header className="p-4 flex items-center gap-4">
                <Link href="/gallery" className="p-2 glass rounded-full hover:bg-white/10 transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white leading-tight">{album.title}</h2>
                    <p className="text-xs text-gray-400 capitalize">{album.template} Album • {media.length} items</p>
                </div>
                <button
                    onClick={() => {
                        console.log('Upload clicked. Bond:', bond?.id, 'Album ID:', id);
                        fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 disabled:bg-rose-500/50 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploading ? `${uploadProgress}%` : 'Upload'}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*"
                />
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-10 no-scrollbar">
                {media.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <ImageIcon size={48} className="mb-4" />
                        <p className="text-sm">This album is empty.</p>
                        <p className="text-[10px] mt-1">Start by uploading your first memory!</p>
                    </div>
                ) : (
                    <div className="columns-2 gap-3 space-y-3">
                        {media.map((item: any) => (
                            <motion.div
                                key={item.id}
                                layoutId={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedMedia(item)}
                                className="relative rounded-2xl overflow-hidden glass border-white/5 break-inside-avoid group cursor-pointer"
                            >
                                {item.media_type === 'video' ? (
                                    <video
                                        src={item.media_url}
                                        className="w-full h-auto object-cover"
                                        poster={item.media_url.replace(/\.[^/.]+$/, ".jpg")}
                                        muted
                                        loop
                                        onMouseOver={e => (e.target as HTMLVideoElement).play()}
                                        onMouseOut={e => (e.target as HTMLVideoElement).pause()}
                                    />
                                ) : (
                                    <img
                                        src={item.media_url}
                                        alt={item.caption || ''}
                                        className="w-full h-auto object-cover transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516245834210-c4c142787335?w=400&h=400&fit=crop&q=40';
                                        }}
                                    />
                                )}
                                {item.media_type === 'video' && (
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1 rounded">
                                        <Play size={10} fill="white" className="ml-0.5" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Overlay */}
            <AnimatePresence>
                {selectedMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-10"
                    >
                        <motion.button
                            onClick={() => setSelectedMedia(null)}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <ChevronLeft size={24} className="rotate-[-90deg]" />
                        </motion.button>

                        <div className="w-full h-full flex items-center justify-center max-w-5xl">
                            {selectedMedia.media_type === 'video' ? (
                                <video
                                    src={selectedMedia.media_url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-full rounded-2xl shadow-2xl"
                                />
                            ) : (
                                <motion.img
                                    layoutId={selectedMedia.id}
                                    src={selectedMedia.media_url}
                                    className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                                    alt={selectedMedia.caption || 'Memory'}
                                />
                            )}
                        </div>

                        {selectedMedia.caption && (
                            <p className="mt-4 text-gray-300 text-sm font-medium">{selectedMedia.caption}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Uploading Overlay */}
            <AnimatePresence>
                {uploading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed bottom-24 left-4 right-4 glass p-4 rounded-2xl border-rose-500/20 z-50 flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <Loader2 className="animate-spin text-rose-500" size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold text-rose-300 tracking-wide uppercase">Uploading Memory</span>
                                <span className="text-xs text-rose-400">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                <motion.div
                                    className="bg-rose-500 h-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Play({ size, fill, className }: { size: number, fill: string, className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
