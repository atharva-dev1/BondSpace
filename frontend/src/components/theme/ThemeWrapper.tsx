"use client";

import { useStore } from '@/store/useStore';
import { useEffect, useState, useMemo } from 'react';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { user, token, checkAuth, isLoading } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // If we have a token but no user, proactively fetch
        if (token && !user && !isLoading) {
            checkAuth();
        }
    }, [token, user, isLoading, checkAuth]);

    const themeClass = useMemo(() => {
        if (!user?.gender) return 'theme-neutral';

        const gender = user.gender.toLowerCase().trim();
        if (gender === 'male') return 'theme-male';
        if (gender === 'female') return 'theme-female';
        return 'theme-neutral';
    }, [user?.gender]);

    // During SSR and first paint, we render a stable neutral theme
    // Once mounted and user data is loaded, we apply the gender-based theme
    const activeTheme = mounted ? themeClass : 'theme-neutral';

    return (
        <div className={`${activeTheme} min-h-screen flex flex-col`}>
            {children}
        </div>
    );
}
