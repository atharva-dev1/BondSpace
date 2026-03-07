"use client";

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, MessageSquare } from 'lucide-react';

export default function GuruPage() {
    const { token, bond } = useStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bond?.id) {
            axios.get(`${API_URL}/ai/guru/history/${bond.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setMessages(res.data.history))
                .catch(console.error);
        }
    }, [bond?.id, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !bond?.id) return;

        const userMessage = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/ai/guru`, {
                couple_id: bond.id,
                message: userMessage.content
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply
            }]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getToneAnalysis = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(`${API_URL}/ai/analyse-tone`, { couple_id: bond?.id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `**Tone Analysis:**\n${data.analysis}`
            }]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] relative">
            <header className="p-4 mx-4 mt-4 mb-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-rose-400 flex items-center gap-2">
                    <Brain size={28} className="text-purple-400" /> Love Guru
                </h2>
                <p className="text-gray-400 text-sm mt-1">SambaNova AI Relationship Counsel.</p>

                <button
                    onClick={getToneAnalysis}
                    className="mt-4 flex items-center gap-2 text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-full hover:bg-purple-500/20 transition-colors"
                >
                    <MessageSquare size={14} /> Analyse Recent Chat Tone
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-6 mt-4 no-scrollbar">
                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                        <Brain size={48} className="text-purple-500 mb-4 animate-pulse" />
                        <p className="text-gray-300 font-medium">I'm your relationship guide.</p>
                        <p className="text-sm text-gray-500 mt-2 max-w-[200px]">Ask me for communication advice, conflict resolution, or date ideas.</p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg) => {
                        const isMe = msg.role === 'user';
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {!isMe && (
                                    <div className="flex-shrink-0 w-8">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                            <Sparkles size={14} />
                                        </div>
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed backdrop-blur-md shadow-lg
                    ${isMe
                                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-tr-sm border border-purple-400/20'
                                            : 'bg-white/10 text-gray-100 rounded-tl-sm border border-white/5 whitespace-pre-wrap'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </motion.div>
                        );
                    })}

                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                            <div className="flex-shrink-0 w-8">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                                    <Sparkles size={14} />
                                </div>
                            </div>
                            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150" />
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-300" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Input Form */}
            <div className="absolute bottom-4 left-0 w-full px-4 z-20">
                <form onSubmit={handleSend} className="glass rounded-full p-1.5 flex items-center pr-2 shadow-[0_0_30px_rgba(168,85,247,0.15)] border-purple-500/20 bg-black/60 backdrop-blur-xl">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Ask for advice..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-white px-4 placeholder:text-gray-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="bg-purple-500 hover:bg-purple-400 text-white p-2.5 rounded-full transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        <Send size={18} className="translate-x-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
