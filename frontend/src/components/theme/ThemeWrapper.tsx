"use client";

import { useStore } from '@/store/useStore';
import { useEffect, useState, useMemo } from 'react';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { user, token, checkAuth, isLoading, partnerMood } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (token && !user && !isLoading) {
            checkAuth();
        }
    }, [token, user, isLoading, checkAuth]);

    const auraColor = useMemo(() => {
        if (!partnerMood) return 'transparent';
        const colors: Record<string, string> = {
            romantic: 'rgba(244, 63, 94, 0.4)',  // Rose
            excited: 'rgba(245, 158, 11, 0.4)',   // Amber
            calm: 'rgba(20, 184, 166, 0.4)',      // Teal
            sad: 'rgba(99, 102, 241, 0.4)',       // Indigo
            spicy: 'rgba(249, 115, 22, 0.4)',     // Orange
            tired: 'rgba(139, 92, 246, 0.4)',     // Violet
        };
        return colors[partnerMood.toLowerCase()] || 'transparent';
    }, [partnerMood]);

    const themeClass = useMemo(() => {
        if (!user?.gender) return 'theme-neutral';
        const gender = user.gender.toLowerCase().trim();
        if (gender === 'male') return 'theme-male';
        if (gender === 'female') return 'theme-female';
        return 'theme-neutral';
    }, [user?.gender]);

    const activeTheme = mounted ? themeClass : 'theme-neutral';

    return (
        <div
            className={`${activeTheme} min-h-screen flex flex-col transition-colors duration-1000`}
            style={{
                //@ts-ignore
                '--partner-aura': auraColor,
            }}
        >
            {children}
        </div>
    );
}
