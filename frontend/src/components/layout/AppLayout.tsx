"use client";

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import AuthScreen from '@/components/auth/AuthScreen';
import PairScreen from '@/components/auth/PairScreen';
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, bond, checkAuth } = useStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthScreen onLoginSuccess={checkAuth} />;
    }

    if (!bond || bond.status !== 'bonded') {
        return <PairScreen onPairSuccess={checkAuth} />;
    }

    return (
        <div className="min-h-screen pb-24 relative">
            <main className="container max-w-lg mx-auto p-4">{children}</main>
            <BottomNav />
        </div>
    );
}
