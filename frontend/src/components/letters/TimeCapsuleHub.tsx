"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    Unlock,
    MailOpen,
    Send,
    Calendar,
    Clock,
    Image as ImageIcon,
    ChevronRight,
    Plus,
    History
} from 'lucide-react';
import { formatDistanceToNow, isAfter } from 'date-fns';

export default function TimeCapsuleHub({ onWriteClick }: { onWriteClick: () => void }) {
    const { token, user } = useStore();
    const [letters, setLetters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'received' | 'sent'>('received');
    const [selectedLetter, setSelectedLetter] = useState<any>(null);

    useEffect(() => {
        fetchLetters();
    }, [token]);

    const fetchLetters = async () => {
        try {
            const res = await axios.get(`${API_URL}/letters`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLetters(res.data.letters);
        } catch (err) {
            console.error('Failed to fetch letters:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = async (id: string) => {
        try {
            const res = await axios.post(`${API_URL}/letters/${id}/open`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedLetter(res.data.letter);
            fetchLetters(); // Refresh list
        } catch (err) {
            console.error('Failed to open letter:', err);
        }
    };

    const filteredLetters = letters.filter(l =>
        tab === 'received' ? l.to_user === user?.id : l.from_user === user?.id
    );

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-32">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Time Capsule</h2>
                    <p className="text-zinc-500 text-sm">Seal memories for the future</p>
                </div>
                <button
                    onClick={onWriteClick}
                    className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-zinc-900/50 rounded-2xl mb-6">
                <button
                    onClick={() => setTab('received')}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${tab === 'received' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Inbox
                </button>
                <button
                    onClick={() => setTab('sent')}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${tab === 'sent' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Sent
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {filteredLetters.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 mb-4 border border-zinc-800">
                            {tab === 'received' ? <MailOpen size={32} /> : <Send size={32} />}
                        </div>
                        <p className="text-zinc-500 text-sm">{tab === 'received' ? "No capsules waiting for you yet." : "You haven't sealed any capsules yet."}</p>
                    </div>
                ) : (
                    filteredLetters.map((letter) => (
                        <LetterCard
                            key={letter.id}
                            letter={letter}
                            isSent={tab === 'sent'}
                            onOpen={() => handleOpen(letter.id)}
                            onClick={() => letter.is_opened || tab === 'sent' ? setSelectedLetter(letter) : null}
                        />
                    ))
                )}
            </div>

            {/* Letter Viewer Modal */}
            <AnimatePresence>
                {selectedLetter && (
                    <LetterViewer
                        letter={selectedLetter}
                        onClose={() => setSelectedLetter(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function LetterCard({ letter, isSent, onOpen, onClick }: { letter: any, isSent: boolean, onOpen: () => void, onClick: () => void }) {
    const isLocked = !isSent && !letter.is_opened && isAfter(new Date(letter.open_at), new Date());
    const isReady = !isSent && !letter.is_opened && !isLocked;

    return (
        <motion.div
            layout
            onClick={onClick}
            className={`group relative p-4 rounded-3xl border transition-all cursor-pointer ${letter.is_opened ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-900/80 border-white/5 shadow-xl'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${isLocked ? 'bg-zinc-800 text-zinc-500 grayscale' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                    {letter.is_opened ? <MailOpen size={24} /> : isLocked ? <Lock size={24} /> : <Unlock size={24} />}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">
                        {isSent ? `To ${letter.to_name}` : `From ${letter.from_name}`}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                            <Calendar size={12} />
                            {new Date(letter.created_at).toLocaleDateString()}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                            <Clock size={12} />
                            {isLocked ? `Opens in ${formatDistanceToNow(new Date(letter.open_at))}` : 'Ready to open'}
                        </div>
                    </div>
                </div>

                {isReady && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpen(); }}
                        className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all active:scale-95 whitespace-nowrap"
                    >
                        Unlock
                    </button>
                )}

                {(letter.is_opened || isSent) && (
                    <ChevronRight size={18} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                )}
            </div>
        </motion.div>
    );
}

function LetterViewer({ letter, onClose }: { letter: any, onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-zinc-900/50 border border-white/10 rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-rose-500/20 p-0.5">
                            <img src={letter.from_avatar || '/default-avatar.png'} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">{letter.from_name}</h4>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">
                                Sent {new Date(letter.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-white">
                        <History size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 pt-4 flex-1 overflow-y-auto space-y-6">
                    {letter.media_url && (
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-black border border-white/5">
                            <img src={letter.media_url} className="w-full h-full object-cover shadow-2xl" />
                        </div>
                    )}

                    <div className="relative">
                        {/* Decorative Quote Mark */}
                        <div className="absolute -top-4 -left-2 text-rose-500/20 text-6xl font-serif">“</div>
                        <p className="text-white/90 text-lg leading-relaxed font-serif italic relative z-10 px-4">
                            {letter.content}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-0 mt-auto">
                    <div className="h-px w-full bg-zinc-800/50 mb-6" />
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
