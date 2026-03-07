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
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <header className="p-4 mx-4 mt-4 mb-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-purple-400 flex items-center gap-2">
                    <Globe2 size={28} className="text-rose-400" /> Secure Connect
                </h2>
                <p className="text-gray-400 text-sm mt-1">Join interest-based communities & chat securely.</p>
            </header>

            <AnimatePresence mode="wait">
                {activeCommunity ? (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col mx-4 mb-4 glass rounded-3xl overflow-hidden border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.1)] relative"
                    >
                        <CommunityChat community={activeCommunity} onBack={() => setActiveCommunity(null)} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 no-scrollbar"
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
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 text-gray-400">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h3 className="font-bold text-white leading-tight">{community.name}</h3>
                        <p className="text-[10px] text-gray-400">{community.member_count} members</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 no-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-10">
                        Welcome to {community.name}! Be the first to say hi 👋
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isMe = msg.user_id === user?.id;
                    const showAvatar = i === 0 || messages[i - 1].user_id !== msg.user_id;

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                            {!isMe && showAvatar && (
                                <span className="text-[10px] text-gray-400 ml-1 mb-1 font-medium">{msg.user_name}</span>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-[15px] shadow-sm
                                ${isMe
                                    ? 'bg-indigo-500 text-white rounded-tr-sm'
                                    : 'bg-white/10 border border-white/10 text-gray-100 rounded-tl-sm'
                                }`}
                            >
                                <p>{msg.message}</p>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Form */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
                <form onSubmit={handleSend} className="glass rounded-2xl p-1.5 flex items-center pr-2 shadow-2xl border-indigo-500/20 bg-black/60 backdrop-blur-xl">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${community.name}...`}
                        className="flex-1 bg-transparent border-none focus:outline-none text-white px-3"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    >
                        <Send size={16} className="translate-x-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
