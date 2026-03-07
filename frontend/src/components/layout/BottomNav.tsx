"use client";

import { MessageCircle, Gamepad2, Brain, User, Map, Image as ImageIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { icon: MessageCircle, label: 'Chat', href: '/' },
    { icon: Map, label: 'Location', href: '/location' },
    { icon: Gamepad2, label: 'Games', href: '/games' },
    { icon: ImageIcon, label: 'Gallery', href: '/gallery' },
    { icon: Brain, label: 'AI Guru', href: '/guru' },
    { icon: User, label: 'Profile', href: '/profile' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-6 pt-2">
            <nav className="glass rounded-3xl p-2 flex items-center justify-around shadow-2xl max-w-sm mx-auto border-white/10 bg-black/40 backdrop-blur-xl">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className="relative flex flex-col items-center p-3 rounded-2xl transition-all w-16"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bubble"
                                    className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-purple-500/20 rounded-2xl border border-white/5"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn(
                                    "relative z-10 transition-colors duration-300",
                                    isActive ? "text-rose-400" : "text-gray-500 hover:text-gray-300"
                                )}
                            />

                            <span className={cn(
                                "relative z-10 text-[10px] font-medium mt-1 transition-all duration-300",
                                isActive ? "text-rose-300 opacity-100" : "text-gray-500 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                            )}>
                                {item.label}
                            </span>

                            {/* Active glow indicator */}
                            {isActive && (
                                <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-rose-500 glow-rose shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
