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

    // Actions
    login: (token: string, user: User) => Promise<void>;
    logout: () => void;
    setBond: (bond: Bond | null) => void;
    initializeSocket: () => void;
    checkAuth: () => Promise<void>;
    unlockChat: (key: Uint8Array) => void;
    lockChat: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('bondspace_token') : null,
    bond: null,
    socket: null,
    isAuthenticated: false,
    isLoading: true,
    isLocked: true, // Default to locked
    encryptionKey: null,

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
        if (socket) socket.disconnect();

        const newSocket = io(SOCKET_URL, {
            auth: { token },
        });

        newSocket.on('connect', () => {
            console.log('Socket connected 🔌');
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected 🔴');
        });

        set({ socket: newSocket });
    },

    checkAuth: async () => {
        const { token } = get();
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        try {
            const { data } = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const bondRes = await axios.get(`${API_URL}/bond/my-bond`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
                bond: bondRes.data.bond
            });
            get().initializeSocket();
        } catch (err) {
            console.error('Auth check failed:', err);
            localStorage.removeItem('bondspace_token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false, bond: null, isLocked: true, encryptionKey: null });
        }
    },

    unlockChat: (key) => set({ isLocked: false, encryptionKey: key }),
    lockChat: () => set({ isLocked: true, encryptionKey: null })
}));
