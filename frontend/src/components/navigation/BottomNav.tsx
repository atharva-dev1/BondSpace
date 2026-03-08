"use client";

import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { MessageCircle, MapPin, Gamepad2, Users, Images, User, Palette } from 'lucide-react';
import Link from 'next/link';

export default function BottomNav() {
    // Only show the navigation if the user is authenticated, fully bonded, and profile is complete
    const { user, isAuthenticated, bond } = useStore();
    const pathname = usePathname();

    if (!isAuthenticated || !user?.profile_complete || !bond || bond.status !== 'bonded') return null;

    const navItems = [
        { path: '/', label: 'Chat', icon: <MessageCircle size={24} /> },
        { path: '/location', label: 'Map', icon: <MapPin size={24} /> },
        { path: '/games', label: 'Play', icon: <Gamepad2 size={24} /> },
        { path: '/wall', label: 'Wall', icon: <Palette size={24} /> },
        { path: '/gallery', label: 'Memories', icon: <Images size={24} /> },
        { path: '/community', label: 'Spaces', icon: <Users size={24} /> },
        { path: '/profile', label: 'Hub', icon: <User size={24} /> },
    ];

    return (
        <div className="absolute bottom-0 left-0 w-full z-50 px-4 pb-3 pt-2 pointer-events-none">
            <div className="mx-auto max-w-lg lg:max-w-xl bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-2 flex justify-between items-center shadow-2xl pointer-events-auto relative overflow-hidden" style={{ boxShadow: '0 25px 50px -12px var(--accent-glow)' }}>
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent-secondary/5 to-accent/5 bg-[length:200%_auto] animate-pulse" />

                {navItems.map((item) => {
                    const isActive = item.path === '/'
                        ? pathname === '/' || pathname.startsWith('/chat')
                        : item.path === '/gallery'
                            ? pathname.startsWith('/gallery') || pathname.startsWith('/bond-tree')
                            : item.path === '/profile'
                                ? pathname.startsWith('/profile') || pathname.startsWith('/planner') || pathname.startsWith('/store') || pathname.startsWith('/guru')
                                : pathname.startsWith(item.path);
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
                                    className="absolute inset-0 rounded-2xl shadow-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                                        boxShadow: '0 10px 15px -3px var(--accent-glow)'
                                    }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="relative z-10 flex flex-col items-center">
                                {item.icon}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
