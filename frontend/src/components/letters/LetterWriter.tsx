"use client";

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Send,
    Calendar,
    Image as ImageIcon,
    Heart,
    Loader2
} from 'lucide-react';

export default function LetterWriter({ onClose, onSealed }: { onClose: () => void, onSealed: () => void }) {
    const { token, bond, user } = useStore();
    const [content, setContent] = useState('');
    const [trigger, setTrigger] = useState('custom');
    const [openAt, setOpenAt] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [sealing, setSealing] = useState(false);

    const partnerId = bond?.user1_id === user?.id ? bond?.user2_id : bond?.user1_id;
    const partnerName = bond?.user1_id === user?.id ? bond?.user2_name : bond?.user1_name;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !bond?.id) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('couple_id', bond.id);

        try {
            const res = await axios.post(`${API_URL}/gallery/timeline/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMediaUrl(res.data.media_url);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSeal = async () => {
        if (!content || !openAt) {
            alert('Please write something and pick a date to seal the capsule.');
            return;
        }

        setSealing(true);
        try {
            await axios.post(`${API_URL}/letters`, {
                to_user: partnerId,
                couple_id: bond?.id,
                content,
                open_trigger: trigger,
                open_at: openAt,
                media_url: mediaUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSealed();
            onClose();
        } catch (err) {
            console.error('Sealing failed:', err);
            alert('Failed to seal the letter. Please try again.');
        } finally {
            setSealing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[120] bg-black flex flex-col"
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <X size={20} />
                </button>
                <div className="text-center">
                    <h2 className="text-white font-bold">New Time Capsule</h2>
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Seal for {partnerName}</p>
                </div>
                <div className="w-10" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                {/* Visual Attachment */}
                <div className="space-y-4">
                    <label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Attach a Photo</label>
                    <div className="relative group aspect-video rounded-3xl overflow-hidden bg-zinc-900/50 border-2 border-dashed border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-center">
                        {mediaUrl ? (
                            <>
                                <img src={mediaUrl} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setMediaUrl('')}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                                    {uploading ? <Loader2 size={24} className="animate-spin text-rose-500" /> : <ImageIcon size={24} />}
                                </div>
                                <p className="text-zinc-500 text-xs">{uploading ? 'Uploading...' : 'Click to add a memory'}</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest text-center block">Your Message</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write something that will make them smile in the future..."
                        className="w-full h-48 bg-transparent text-white text-xl font-serif italic text-center outline-none resize-none placeholder:text-zinc-700 leading-relaxed"
                    />
                </div>

                {/* Trigger & Date */}
                <div className="space-y-6 bg-zinc-900/30 p-6 rounded-[32px] border border-white/5">
                    <div className="space-y-3">
                        <label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest text-center block">When should it open?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['anniversary', 'birthday', 'custom'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTrigger(t)}
                                    className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${trigger === t ? 'bg-rose-500 border-rose-500 text-white' : 'bg-transparent border-white/5 text-zinc-500'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="date"
                                value={openAt}
                                onChange={(e) => setOpenAt(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-rose-500/50 transition-all appearance-none"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                <Calendar size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="p-8 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent">
                <button
                    onClick={handleSeal}
                    disabled={sealing || uploading}
                    className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-3 font-bold text-white shadow-2xl transition-all active:scale-95 ${(sealing || uploading) ? 'bg-zinc-800 cursor-not-allowed opacity-50' : 'bg-rose-500 shadow-rose-500/20'
                        }`}
                >
                    {sealing ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            <span>Sealing...</span>
                        </>
                    ) : (
                        <>
                            <Heart size={24} />
                            <span>Seal with Love</span>
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
