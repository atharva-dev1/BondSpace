"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, Lock, Check, Sparkles, ArrowLeft, Heart, Coins } from 'lucide-react';
import Link from 'next/link';

interface StoreItem {
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
    media_url: string;
    rarity: string;
}

export default function StorePage() {
    const { user, token, isAuthenticated, checkAuth } = useStore();
    const [items, setItems] = useState<StoreItem[]>([]);
    const [inventory, setInventory] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!user) checkAuth();
        fetchStore();
    }, [token]);

    const fetchStore = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/store`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(res.data.items);
            setInventory(res.data.inventory);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (item: StoreItem) => {
        if (inventory.includes(item.id)) return;
        if ((user?.points || 0) < item.price) {
            alert("Not enough Love Points! ❤️ Complete daily challenges to earn more.");
            return;
        }

        setPurchasing(item.id);
        try {
            await axios.post(`${API_URL}/store/purchase`, { item_id: item.id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowSuccess(item.name);
            checkAuth(); // Update global XP
            fetchStore(); // Update local inventory
            setTimeout(() => setShowSuccess(null), 3000);
        } catch (err: any) {
            alert(err.response?.data?.error || "Purchase failed");
        } finally {
            setPurchasing(null);
        }
    };

    if (!isAuthenticated) return null;

    const rarityColors: Record<string, string> = {
        common: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
        rare: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        epic: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        legendary: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    };

    return (
        <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden relative">
            {/* Header */}
            <header className="mb-6 flex justify-between items-center bg-black/40 glass p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/10">
                        <ArrowLeft size={18} />
                    </Link>
                </div>
                <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                        <Heart size={12} className="text-white fill-white" />
                    </div>
                    <span className="text-white font-black text-xs tracking-tighter">{user?.points || 0}</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-60 px-4">
                <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-48 glass rounded-3xl animate-pulse" />)
                    ) : (
                        items.map((item) => {
                            const isOwned = inventory.includes(item.id);
                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    className="glass p-4 rounded-[32px] border-white/5 bg-white/[0.02] flex flex-col items-center text-center space-y-3 relative group"
                                >
                                    {/* Icon/Media Preview */}
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shadow-inner">
                                        {item.media_url}
                                    </div>

                                    <div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${rarityColors[item.rarity]}`}>
                                            {item.rarity}
                                        </span>
                                        <h4 className="text-white font-bold text-sm mt-1 truncate w-full">{item.name}</h4>
                                        <p className="text-[10px] text-gray-500 line-clamp-1">{item.description}</p>
                                    </div>

                                    <button
                                        disabled={isOwned || purchasing === item.id}
                                        onClick={() => handlePurchase(item)}
                                        className={`w-full py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isOwned
                                            ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                                            : 'bg-white text-black hover:bg-rose-500 hover:text-white'
                                            }`}
                                    >
                                        {purchasing === item.id ? (
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : isOwned ? (
                                            <><Check size={14} /> Unlocked</>
                                        ) : (
                                            <><Coins size={14} /> {item.price}</>
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Success Notification */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-4 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-3 border border-white/20"
                    >
                        <Sparkles className="text-yellow-200" />
                        <div>
                            <p className="font-bold text-sm">Unlocked {showSuccess}!</p>
                            <p className="text-[10px] opacity-80">Check your inventory in Profile.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
