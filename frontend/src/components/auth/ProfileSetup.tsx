"use client";

import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Loader2, User, FileText, Heart } from 'lucide-react';

const AVATARS = ['💖', '🌸', '🦋', '🌙', '⭐', '🌺', '🍀', '🎀', '🌈', '🦄', '🌊', '🔮', '🌻', '💎', '🎵', '🏹', '🍓', '🐾', '🌍', '☁️', '🎯', '💫'];

const GENDERS = [
    { label: 'Male', icon: '♂️', value: 'male' },
    { label: 'Female', icon: '♀️', value: 'female' },
    { label: 'Non-binary', icon: '⚧️', value: 'non-binary' },
    { label: 'Prefer not to say', icon: '🤐', value: 'private' },
];

type Step = 'avatar' | 'theme' | 'bio';

export default function ProfileSetup({ onDone }: { onDone: () => void }) {
    const { token, user, login, updateUser } = useStore();
    const [step, setStep] = useState<Step>('avatar');
    const [form, setForm] = useState({
        avatar: '💖',
        name: user?.name || '',
        gender: '',
        bio: '',
    });
    const [loading, setLoading] = useState(false);
    const steps: Step[] = ['avatar', 'theme', 'bio'];
    const stepIdx = steps.indexOf(step);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data } = await axios.put(`${API_URL}/auth/profile`, {
                avatar: form.avatar,
                name: form.name,
                gender: form.gender,
                bio: form.bio || undefined,
            }, { headers: { Authorization: `Bearer ${token}` } });
            // Update user in store
            if (data.user) {
                const stored = JSON.parse(localStorage.getItem('bondspace_token') ? 'null' : 'null');
                // Re-fetch user via checkAuth will update the store
            }
            onDone();
        } catch (err) {
            console.error(err);
            onDone(); // proceed anyway
        } finally {
            setLoading(false);
        }
    };

    const canProgress = useCallback(() => {
        if (step === 'avatar') return !!form.avatar;
        if (step === 'theme') return form.name.trim().length >= 2 && !!form.gender;
        return true;
    }, [step, form]);

    return (
        <div className="h-[100dvh] bg-[#080808] flex flex-col relative overflow-hidden">
            {/* bg blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[15%] w-[500px] h-[500px] bg-purple-700/15 rounded-full blur-[130px]" />
                <div className="absolute bottom-[-15%] left-[5%] w-[400px] h-[400px] bg-rose-600/15 rounded-full blur-[110px]" />
            </div>

            <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 pt-10 pb-16 relative z-10 overflow-hidden">
                {/* Step indicators */}
                <div className="flex gap-2 mb-8 shrink-0">
                    {steps.map((s, i) => (
                        <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= stepIdx ? 'bg-gradient-to-r from-rose-500 to-purple-500' : 'bg-white/10'}`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1 — Avatar */}
                    {step === 'avatar' && (
                        <motion.div key="avatar" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex-1 flex flex-col min-h-0">
                            <div className="mb-8 shrink-0">
                                <p className="text-rose-400 text-sm font-bold uppercase tracking-widest mb-2">Step 1 of 3</p>
                                <h2 className="text-3xl font-black text-white">Pick your vibe</h2>
                                <p className="text-gray-500 text-sm mt-2">This emoji represents you to your partner.</p>
                            </div>

                            {/* Preview */}
                            <div className="text-7xl text-center mb-6 shrink-0">{form.avatar}</div>

                            <div className="flex-1 grid grid-cols-5 gap-3 overflow-y-auto pb-4 no-scrollbar min-h-0">
                                {AVATARS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => setForm(f => ({ ...f, avatar: emoji }))}
                                        className={`aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all duration-300 ${form.avatar === emoji
                                            ? 'bg-rose-500/20 border-2 border-rose-500 scale-110'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95'
                                            }`}
                                        style={form.avatar === emoji ? { boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)' } : {}}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 'theme' && (
                        <motion.div key="theme" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex-1 flex flex-col min-h-0">
                            <div className="mb-6 shrink-0">
                                <p className="text-rose-400 text-sm font-bold uppercase tracking-widest mb-2">Step 2 of 3</p>
                                <h2 className="text-3xl font-black text-white">Your details</h2>
                                <p className="text-gray-500 text-sm mt-2">Tell us a bit about yourself.</p>
                            </div>

                            <div className="overflow-y-auto pb-4 no-scrollbar flex-1">
                                {/* Name field */}
                                <div className="mb-6">
                                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Display Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="What should we call you?"
                                            maxLength={50}
                                            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-rose-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-3">Gender</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {GENDERS.map(g => (
                                            <button
                                                key={g.value}
                                                onClick={() => {
                                                    setForm(f => ({ ...f, gender: g.value }));
                                                    // Proactively update store for immediate theme change without resetting state
                                                    updateUser({ gender: g.value });
                                                }}
                                                className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all text-left ${form.gender === g.value
                                                    ? 'border-rose-500 bg-rose-500/10 text-white'
                                                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-2xl shrink-0">{g.icon}</span>
                                                <span className="text-sm font-semibold">{g.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3 — Bio */}
                    {step === 'bio' && (
                        <motion.div key="bio" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="flex-1 flex flex-col min-h-0">
                            <div className="mb-6 shrink-0">
                                <p className="text-rose-400 text-sm font-bold uppercase tracking-widest mb-2">Step 3 of 3</p>
                                <h2 className="text-3xl font-black text-white">Your story</h2>
                                <p className="text-gray-500 text-sm mt-2">Something your partner will see. Optional.</p>
                            </div>

                            <div className="overflow-y-auto pb-4 no-scrollbar flex-1 flex flex-col">
                                {/* Profile preview card */}
                                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 shrink-0">
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-white/10 shrink-0">
                                        {form.avatar}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white truncate">{form.name}</p>
                                        <p className="text-xs text-gray-500 capitalize truncate">{form.gender}</p>
                                    </div>
                                </div>

                                <textarea
                                    value={form.bio}
                                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                    placeholder="Something about you... what makes you, you? ✨"
                                    rows={5}
                                    maxLength={150}
                                    className="w-full shrink-0 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl px-4 py-4 focus:outline-none focus:border-rose-500/50 resize-none transition-all mb-1"
                                />
                                <p className="text-right text-xs text-gray-600 mb-2 shrink-0">{form.bio.length}/150</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom navigation */}
                <div className="mt-8 space-y-3">
                    <button
                        disabled={!canProgress() || loading}
                        onClick={() => {
                            if (step === 'avatar') setStep('theme');
                            else if (step === 'theme') setStep('bio');
                            else handleSave();
                        }}
                        className="w-full text-white font-black uppercase tracking-widest py-5 rounded-3xl flex items-center justify-center gap-2 shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                        style={{
                            background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))',
                            boxShadow: '0 10px 25px -5px var(--accent-glow)'
                        }}
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : step === 'bio' ? (
                            <><Check size={18} /> Complete Profile</>
                        ) : (
                            <>Continue <ChevronRight size={18} /></>
                        )}
                    </button>

                    {step !== 'avatar' && (
                        <button
                            onClick={() => setStep(step === 'bio' ? 'theme' : 'avatar')}
                            className="w-full text-white/30 text-xs font-bold uppercase tracking-widest hover:text-white transition-all py-3"
                        >
                            ← Go Back
                        </button>
                    )}
                    {step === 'bio' && (
                        <button onClick={onDone} className="w-full text-gray-700 text-xs hover:text-gray-500 transition-colors">
                            Skip for now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
