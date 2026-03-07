"use client";

import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { MessageCircle, MapPin, Gamepad2, Users, Images, User } from 'lucide-react';
import Link from 'next/link';

export default function BottomNav() {
    const { isAuthenticated, bond } = useStore();
    const pathname = usePathname();

    // Only show the navigation if the user is authenticated and fully bonded
    if (!isAuthenticated || !bond || bond.status !== 'bonded') return null;

    const navItems = [
        { path: '/', label: 'Chat', icon: <MessageCircle size={24} /> },
        { path: '/location', label: 'Map', icon: <MapPin size={24} /> },
        { path: '/games', label: 'Play', icon: <Gamepad2 size={24} /> },
        { path: '/gallery', label: 'Memories', icon: <Images size={24} /> },
        { path: '/community', label: 'Spaces', icon: <Users size={24} /> },
        { path: '/profile', label: 'Hub', icon: <User size={24} /> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
            <div className="mx-auto max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex justify-between items-center shadow-2xl shadow-rose-500/10 pointer-events-auto relative overflow-hidden">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-purple-500/5 to-rose-500/5 bg-[length:200%_auto] animate-pulse" />

                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-2xl shadow-lg shadow-rose-500/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                {item.icon}
                                {isActive && (
                                    <span className="text-[10px] font-medium tracking-wide">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
