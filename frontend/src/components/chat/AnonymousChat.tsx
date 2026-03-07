"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Shield, Sparkles, User, MessageCircle } from 'lucide-react';

interface Message {
    id: string;
    chat_id?: string;
    sender_id: string;
    message: string;
    timestamp: string;
}

export default function AnonymousChat({ chat_id, onEnd }: { chat_id: string, onEnd: () => void }) {
    const { user, token, socket } = useStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Pseudonyms
    const myName = "You";
    const partnerName = "Stranger";

    useEffect(() => {
        if (chat_id && token) {
            axios.get(`${API_URL}/chat/anonymous/${chat_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then((res) => {
                setMessages(res.data.messages);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [chat_id, token]);

    useEffect(() => {
        if (!socket) return;
        const handleMsg = (msg: Message) => {
            if (msg.chat_id === chat_id) {
                setMessages(prev => [...prev, msg]);
            }
        };
        const handleEnd = (data: { chat_id: string }) => {
            if (data.chat_id === chat_id) {
                alert("The stranger has left the chat.");
                onEnd();
            }
        };

        socket.on('anonymous_message_received', handleMsg);
        socket.on('anonymous_chat_ended', handleEnd);
        return () => {
            socket.off('anonymous_message_received', handleMsg);
            socket.off('anonymous_chat_ended', handleEnd);
        };
    }, [socket, chat_id, onEnd]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const text = input;
        setInput('');

        try {
            await axios.post(`${API_URL}/chat/anonymous/message`,
                { chat_id, message: text },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Local update
            setMessages(prev => [...prev, {
                id: Math.random().toString(),
                sender_id: user?.id || '',
                message: text,
                timestamp: new Date().toISOString()
            }]);
        } catch (err) {
            console.error('Failed to send anonymous message:', err);
        }
    };

    const endChat = async () => {
        if (!confirm("Are you sure you want to end this anonymous chat?")) return;
        try {
            await axios.post(`${API_URL}/chat/anonymous/end`, { chat_id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onEnd();
        } catch (err) {
            console.error('Failed to end chat:', err);
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                        <User size={20} className="text-gray-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Anonymous Soul</h3>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Shield size={10} /> End-to-End Private
                        </p>
                    </div>
                </div>
                <button
                    onClick={endChat}
                    className="p-2 hover:bg-rose-500/20 rounded-full text-gray-400 hover:text-rose-400 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-2">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-[11px] text-gray-400 font-medium">You've been matched! Say hello.</span>
                    </div>
                </div>

                <AnimatePresence>
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-lg ${isMe
                                    ? 'bg-rose-600 text-white rounded-tr-sm'
                                    : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                    <p className={`text-[9px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type anonymously..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500/50"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg hover:bg-rose-500 disabled:opacity-50 transition-all"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
