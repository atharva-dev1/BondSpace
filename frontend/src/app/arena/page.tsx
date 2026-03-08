"use client";

import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ArenaHub from '@/components/arena/ArenaHub';

export default function ArenaPage() {
    const { isAuthenticated } = useStore();

    if (!isAuthenticated) return null;

    return (
        <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden relative">
            {/* Header */}
            <header className="mb-6 flex justify-between items-center bg-black/40 glass p-4 rounded-3xl border border-white/5 mx-4 mt-4">
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/10">
                        <ArrowLeft size={18} />
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <Trophy className="text-amber-500" size={20} />
                    <span className="text-white font-black text-xs tracking-tighter uppercase">Love Arena</span>
                </div>
                <div className="w-10 h-10" /> {/* Spacer */}
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4">
                <ArenaHub />
            </div>
        </div>
    );
}
