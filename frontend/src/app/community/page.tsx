"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe2, MessageSquare, Plus, ArrowLeft, Send, Sparkles } from 'lucide-react';

export default function CommunityPage() {
    const { token, user, socket, checkAuth } = useStore();
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCommunity, setActiveCommunity] = useState<any | null>(null);

    useEffect(() => {
        if (token) {
            checkAuth();
            fetchCommunities();
        }
    }, [token]);

    const fetchCommunities = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/communities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommunities(data.communities);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const joinCommunity = async (slug: string) => {
        try {
            await axios.post(`${API_URL}/communities/${slug}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh to update local cache
            fetchCommunities();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" /></div>;

    return (
        <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden">
            <header className="p-4 mx-4 mt-4 mb-4 flex justify-between items-center bg-black/40 glass rounded-3xl border border-white/5">
                <div className="min-w-0">
                    <Globe2 size={24} className="text-accent" />
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeCommunity ? (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col overflow-hidden relative"
                    >
                        <CommunityChat community={activeCommunity} onBack={() => setActiveCommunity(null)} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-y-auto px-4 pb-44 space-y-4 no-scrollbar"
                    >
                        {/* Soul Connect Feature Card */}
                        <div
                            onClick={() => window.location.href = '/chat/anonymous'}
                            className="relative overflow-hidden group cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-purple-600 rounded-3xl opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -right-4 -top-8 w-32 h-32 bg-white/20 blur-2xl rounded-full" />
                            <div className="relative p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-white">
                                        <Sparkles size={20} className="fill-white" />
                                        <h3 className="text-xl font-black">Soul Connect</h3>
                                    </div>
                                    <p className="text-white/80 text-xs font-medium">Chat anonymously with verified members.</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-white text-xs font-bold border border-white/20">
                                    Match Now
                                </div>
                            </div>
                        </div>

                        {/* Featured Community */}
                        {communities.length > 0 && (
                            <div className="glass rounded-3xl p-5 border-white/5 bg-gradient-to-br from-rose-900/30 via-black/40 to-black/60 relative overflow-hidden group border border-rose-500/20 shadow-xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform border border-rose-500/20">
                                        <Users size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-sm">{communities[0].name}</h3>
                                    <p className="text-gray-400 font-medium text-sm mb-6 max-w-xs">{communities[0].description}</p>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                joinCommunity(communities[0].slug);
                                                setActiveCommunity(communities[0]);
                                            }}
                                            className="px-8 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all hover:scale-105"
                                        >
                                            Enter Room
                                        </button>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-rose-300 font-bold">{communities[0].member_count}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Members</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between px-1 mt-8 mb-3">
                            <h3 className="text-lg font-bold text-white tracking-tight">Explore Groups</h3>
                            <div className="h-px flex-1 bg-white/5 mx-4" />
                        </div>

                        <div className="space-y-4">
                            {communities.slice(1).map((comm) => (
                                <motion.div
                                    key={comm.id}
                                    whileHover={{ y: -2 }}
                                    className="glass p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-rose-500/30 transition-all bg-white/[0.03]"
                                >
                                    <div className="flex-1 pr-4">
                                        <h4 className="font-bold text-white text-[15px] group-hover:text-rose-300 transition-colors uppercase tracking-tight">{comm.name}</h4>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1 font-medium">{comm.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] text-rose-400 font-bold bg-rose-500/15 border border-rose-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                <Users size={10} /> {comm.member_count} Members
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            joinCommunity(comm.slug);
                                            setActiveCommunity(comm);
                                        }}
                                        className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-rose-500/80 transition-all border border-white/10 group-hover:border-rose-500/50 shadow-lg"
                                    >
                                        <MessageSquare size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CommunityChat({ community, onBack }: { community: any, onBack: () => void }) {
    const { user, socket, token } = useStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        socket.emit('join_community', community.id);

        const fetchHistory = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/communities/${community.id}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(data.messages);
            } catch (err) {
                console.error('Failed to fetch chat history:', err);
            }
        };

        fetchHistory();

        const handleReceive = (msg: any) => {
            setMessages(prev => [...prev, msg]);
        };

        socket.on('receive_community_message', handleReceive);

        return () => {
            socket.emit('leave_community', community.id);
            socket.off('receive_community_message', handleReceive);
        };
    }, [socket, community.id, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !socket) return;

        socket.emit('send_community_message', {
            community_id: community.id,
            message: input
        });
        setInput('');
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Premium Wallpaper Backdrop */}
            <div className="absolute inset-0 chat-wallpaper z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

            {/* Premium Header Card */}
            <header className="px-4 pt-4 pb-2 z-20 flex-shrink-0">
                <div className="glass bg-black/40 backdrop-blur-2xl rounded-[32px] p-3 border border-white/5 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-gray-400 transition-all active:scale-90">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <p className="text-[10px] text-accent font-black uppercase tracking-widest leading-none mb-1">Community Hub</p>
                            <h3 className="font-bold text-white text-[15px] leading-none uppercase tracking-tight">{community.name}</h3>
                        </div>
                    </div>
                    <div className="flex flex-col items-end px-3">
                        <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">{community.member_count} Members</span>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow" />
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Live Chat</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-7 pb-40 no-scrollbar z-10 relative">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-10 glass rounded-2xl mx-10 border-white/5">
                        Welcome to {community.name}! Be the first to say hi 👋
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMe = msg.user_id === user?.id;
                    const showName = !isMe && (i === 0 || messages[i - 1].user_id !== msg.user_id);
                    const isFirstInGroup = i === 0 || messages[i - 1].user_id !== msg.user_id;

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}
                        >
                            {!isMe && showName && (
                                <span className="text-[10px] text-gray-400 ml-1 mb-1 font-bold uppercase tracking-wider">{msg.user_name}</span>
                            )}
                            <div className={`px-4 py-3.5 rounded-[22px] max-w-[85%] text-[15px] shadow-lg transition-all duration-300 relative
                                ${isMe
                                    ? `text-white rounded-tr-sm border border-white/10 bubble-shadow-me ${isFirstInGroup ? 'bubble-nip-me' : ''}`
                                    : `bg-zinc-900/60 border border-white/10 text-gray-100 rounded-tl-sm backdrop-blur-md bubble-shadow-partner ${isFirstInGroup ? 'bubble-nip-partner' : ''}`
                                }`}
                                style={isMe ? {
                                    background: 'linear-gradient(135deg, #f43f5e, #9333ea)',
                                } : {}}
                            >
                                <p className="leading-[1.6] font-medium break-words whitespace-pre-wrap">{msg.message}</p>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Form */}
            <div className="absolute bottom-24 left-4 right-4 z-20">
                <form onSubmit={handleSend} className="glass rounded-[32px] p-1.5 flex items-center gap-1 shadow-2xl border-indigo-500/20 bg-black/60 backdrop-blur-xl input-focus-glow">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${community.name}...`}
                        className="flex-1 bg-transparent border-none focus:outline-none text-white px-4 min-w-0 font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-11 h-11 text-white rounded-2xl transition-all active:scale-94 disabled:opacity-50 shrink-0 mr-0.5 flex items-center justify-center"
                        style={{ background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))', boxShadow: '0 4px 15px var(--accent-glow)' }}
                    >
                        <Send size={16} className="translate-x-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
