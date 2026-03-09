import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5005';

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    gender: string | null;
    bio: string | null;
    profile_complete: boolean;
    love_xp: number;
    points: number;
    couple_level: number;
    current_mood?: string;
}

interface Bond {
    id: string;
    user1_id: string;
    user2_id: string;
    status: 'pending' | 'bonded';
    user1_name?: string;
    user1_avatar?: string;
    user2_name?: string;
    user2_avatar?: string;
    mutual_passcode_hash?: string | null;
    connected_at?: string;
    location_sharing_user1: boolean;
    location_sharing_user2: boolean;
    user1_mood?: string;
    user2_mood?: string;
}

interface StoreState {
    user: User | null;
    token: string | null;
    bond: Bond | null;
    socket: Socket | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isLocked: boolean;
    encryptionKey: Uint8Array | null;
    partnerMood: string | null;
    isCheckingAuth: boolean;

    // Actions
    login: (token: string, user: User) => Promise<void>;
    logout: () => void;
    setBond: (bond: Bond | null) => void;
    initializeSocket: () => void;
    checkAuth: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    unlockChat: (key: Uint8Array) => void;
    lockChat: () => void;
    updateMood: (mood: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('bondspace_token') : null,
    bond: null,
    socket: null,
    isAuthenticated: false,
    isLoading: false,
    isLocked: true, // Default to locked
    isCheckingAuth: false,
    encryptionKey: null,
    partnerMood: null,

    login: async (token, user) => {
        localStorage.setItem('bondspace_token', token);
        // We set isLoading: true because we need to wait for checkAuth to grab the bond!
        set({ user, token, isAuthenticated: true, isLoading: true });
        get().initializeSocket();
        await get().checkAuth();
    },

    logout: () => {
        localStorage.removeItem('bondspace_token');
        const { socket } = get();
        if (socket) socket.disconnect();
        set({ user: null, token: null, bond: null, socket: null, isAuthenticated: false, isLocked: true, encryptionKey: null });
    },

    setBond: (bond) => set({ bond }),

    initializeSocket: () => {
        const { token, socket } = get();
        if (!token) return;

        // Don't re-initialize if active and connected
        if (socket?.connected) return;

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'], // Prefer websockets
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            // Only log if it's a significant event, or use debug to keep console clean
            if (!get().socket) console.debug('Socket connected 🔌');
        });

        newSocket.on('disconnect', (reason) => {
            console.debug('Socket disconnected:', reason);
            // If disconnected due to server-side issues, it will auto-reconnect
        });

        newSocket.on('partner_mood_update', ({ mood }: { mood: string }) => {
            set({ partnerMood: mood });
        });

        set({ socket: newSocket });
    },

    checkAuth: async () => {
        const { token, isCheckingAuth } = get();
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        if (isCheckingAuth) return; // Prevent concurrent checks

        set({ isLoading: true, isCheckingAuth: true });
        try {
            const { data } = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const bondRes = await axios.get(`${API_URL}/bond/my-bond`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const bond = bondRes.data.bond;

            // Phase 20: Fetch Points/XP/Level
            const ptsRes = await axios.get(`${API_URL}/gamification/stats/${data.user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const stats = ptsRes.data.stats;

            const pMood = bond?.user1_id === data.user.id ? bond?.user2_mood : bond?.user1_mood;

            set({
                user: { ...data.user, points: stats.amount, love_xp: stats.love_xp, couple_level: stats.couple_level },
                isAuthenticated: true,
                isLoading: false,
                isCheckingAuth: false,
                bond: bond,
                partnerMood: pMood || null
            });
            get().initializeSocket();
        } catch (err) {
            console.error('Auth check failed:', err);
            localStorage.removeItem('bondspace_token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false, isCheckingAuth: false, bond: null, isLocked: true, encryptionKey: null });
        }
    },

    updateUser: (data) => {
        const { user } = get();
        if (user) set({ user: { ...user, ...data } });
    },

    unlockChat: (key) => set({ isLocked: false, encryptionKey: key }),
    lockChat: () => set({ isLocked: true, encryptionKey: null }),

    updateMood: (mood) => {
        const { socket, user } = get();
        if (socket) socket.emit('update_mood', mood);
        if (user) set({ user: { ...user, current_mood: mood } });
    }
}));
