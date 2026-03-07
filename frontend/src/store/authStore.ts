import { create } from 'zustand';

interface AuthState {
    token: string | null;
    user: any | null;
    bond: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: any) => void;
    logout: () => void;
    setBond: (bond: any) => void;
    checkAuth: () => Promise<void>;
    initializeSocket: () => void;
    socket: any | null;
}

// See implementation in useStore.ts, this file is replaced
export { useStore } from './useStore';
