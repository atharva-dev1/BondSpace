"use client";

import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';

const moods = [
    { id: 'romantic', label: 'Romantic', icon: '❤️', color: 'from-rose-400 to-rose-600', aura: 'rgba(244, 63, 94, 0.4)' },
    { id: 'excited', label: 'Excited', icon: '⚡', color: 'from-amber-400 to-amber-600', aura: 'rgba(245, 158, 11, 0.4)' },
    { id: 'calm', label: 'Calm', icon: '🌙', color: 'from-teal-400 to-teal-600', aura: 'rgba(20, 184, 166, 0.4)' },
    { id: 'sad', label: 'Sad', icon: '☁️', color: 'from-indigo-400 to-indigo-600', aura: 'rgba(99, 102, 241, 0.4)' },
    { id: 'spicy', label: 'Spicy', icon: '🔥', color: 'from-orange-400 to-orange-600', aura: 'rgba(249, 115, 22, 0.4)' },
    { id: 'tired', label: 'Tired', icon: '💤', color: 'from-purple-400 to-purple-600', aura: 'rgba(139, 92, 246, 0.4)' },
];

export default function MoodSelector({ onClose }: { onClose: () => void }) {
    const { updateMood, user } = useStore();

    const handleMoodSelect = (moodId: string) => {
        updateMood(moodId);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-0 left-0 right-0 z-[100] bg-[#0d0d0d] border-t border-white/10 rounded-t-[40px] p-8 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter">Your Current Vibe</h3>
                    <p className="text-white/40 text-sm">Partner will see your aura change live ✨</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {moods.map((mood) => (
                    <motion.button
                        key={mood.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMoodSelect(mood.id)}
                        className={`relative group flex flex-col items-center gap-3 p-5 rounded-3xl transition-all ${user?.current_mood === mood.id
                                ? 'bg-white/10 ring-2 ring-white/20'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        <span className="text-3xl">{mood.icon}</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-white/60 group-hover:text-white transition-colors">
                            {mood.label}
                        </span>

                        {user?.current_mood === mood.id && (
                            <motion.div
                                layoutId="activeMood"
                                className={`absolute inset-0 rounded-3xl opacity-20 blur-xl bg-gradient-to-br ${mood.color}`}
                            />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Clear Mood */}
            <button
                onClick={() => handleMoodSelect('')}
                className="w-full mt-8 py-4 text-white/30 text-xs font-bold uppercase tracking-widest hover:text-white/60 transition-colors border border-white/5 rounded-2xl"
            >
                Clear Mood
            </button>
        </motion.div>
    );
}
