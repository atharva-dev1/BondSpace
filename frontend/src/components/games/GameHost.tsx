"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Heart, CheckCircle2 } from 'lucide-react';

export default function GameHost({ session, onExit }: { session: any, onExit: () => void }) {
    const { user, token, socket } = useStore();
    const [gameState, setGameState] = useState(session.game_state);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on('game_move_received', (data) => {
            // Refresh full state from API to ensure consistency when partner moves
            refreshSession();
        });

        return () => {
            socket.off('game_move_received');
        };
    }, [socket]);

    const refreshSession = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/games/session/${session.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGameState(data.session.game_state);
        } catch (err) {
            console.error(err);
        }
    };

    const submitMove = async (action: string, value: string) => {
        if (!value.trim() || loading) return;
        setLoading(true);

        try {
            const { data } = await axios.post(
                `${API_URL}/games/session/${session.id}/action`,
                { action, value },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setGameState(data.session.game_state);
            setAnswer('');

            // Notify partner
            socket?.emit('game_move', { session_id: session.id, user_id: user?.id, action });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Derived state helpers
    const currentQ = gameState.questions[gameState.current_question];
    const totalQ = gameState.questions.length;
    const moves = gameState.moves || [];

    // Check moves for the current question
    const movesForThisQ = moves.filter((m: any) => m.action === `q${gameState.current_question}`);

    // In a real scenario, these are different user IDs. 
    // For local testing with same ID, we just check if there are 2 moves.
    const myMoveForCurrentQ = movesForThisQ.find((m: any) => m.user_id === user?.id);

    // Robust partner move detection (handles same-account testing)
    const partnerMoveForCurrentQ = movesForThisQ.length >= 2
        ? (movesForThisQ.find((m: any) => m.user_id !== user?.id) || movesForThisQ[1])
        : null;

    const bothAnswered = movesForThisQ.length >= 2;

    // Advanced logic to auto-progress
    useEffect(() => {
        if (bothAnswered && !gameState.completed) {
            // Both answered, show answers for 4 seconds then go to next
            const timer = setTimeout(async () => {
                try {
                    // Only ONE player needs to advance the backend state
                    // We'll let the user who joined first (alphabetically ID) do it for consistency
                    // but axios call is idempotent in effect here
                    const { data } = await axios.post(
                        `${API_URL}/games/session/${session.id}/action`,
                        { action: 'next_question', value: 'next' },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    setGameState(data.session.game_state);
                    socket?.emit('game_move', { session_id: session.id, user_id: user?.id, action: 'next_question' });
                } catch (err) {
                    // If error, maybe already advanced? Let's refresh.
                    refreshSession();
                }
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [bothAnswered, gameState.current_question]);

    const renderCompleted = () => (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-rose-500 rounded-full flex items-center justify-center p-1 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <Trophy size={40} className="text-yellow-400" />
                </div>
            </div>
            <div className="text-center">
                <h3 className="text-3xl font-bold text-white mb-2">Game Complete!</h3>
                <p className="text-emerald-400 font-medium">+50 Love XP Awarded</p>
            </div>
            <button
                onClick={onExit}
                className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-colors border border-white/10 mt-8"
            >
                Back to Arena
            </button>
        </div>
    );

    const renderWaiting = () => (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mb-4" />
            <h4 className="text-xl font-medium text-gray-200">Waiting for partner...</h4>
            <p className="text-gray-400 text-sm">You've locked in your answer.</p>

            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 w-full">
                <p className="text-xs text-rose-300 mb-1 uppercase tracking-wider font-bold">Your Answer:</p>
                <p className="text-white text-lg">{myMoveForCurrentQ.value}</p>
            </div>
        </div>
    );

    const renderReveal = () => (
        <div className="flex flex-col space-y-6 py-6">
            <div className="text-center mb-4">
                <h4 className="text-rose-400 font-bold uppercase tracking-widest text-sm mb-2 opacity-80">Reveal!</h4>
                <p className="text-xl text-white font-medium">{currentQ.q || currentQ.a + ' vs ' + currentQ.b}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Heart size={40} /></div>
                    <p className="text-xs text-indigo-300 font-bold uppercase mb-2">You</p>
                    <p className="text-lg text-white font-medium leading-tight relative z-10">{myMoveForCurrentQ.value}</p>
                </div>
                <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-2 opacity-20"><Heart size={40} /></div>
                    <p className="text-xs text-rose-300 font-bold uppercase mb-2">Partner</p>
                    <p className="text-lg text-white font-medium leading-tight relative z-10">{partnerMoveForCurrentQ.value}</p>
                </div>
            </div>

            {myMoveForCurrentQ.value.toLowerCase() === partnerMoveForCurrentQ.value.toLowerCase() ? (
                <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center flex justify-center items-center gap-2 border border-emerald-500/30">
                    <CheckCircle2 size={18} /> It's a match!
                </div>
            ) : (
                <div className="bg-white/5 text-gray-300 p-3 rounded-xl text-center border border-white/10 text-sm">
                    Interesting difference!
                </div>
            )}

            <p className="text-center text-xs text-gray-500 mt-4 animate-pulse">Next question in a few seconds...</p>
        </div>
    );

    const renderQuestionFormat = () => {
        if (!currentQ) return null;

        // This or That format
        if (currentQ.a && currentQ.b) {
            return (
                <div className="space-y-4 mt-8">
                    <button
                        onClick={() => submitMove(`q${gameState.current_question}`, currentQ.a)}
                        disabled={loading}
                        className="w-full p-6 glass rounded-3xl border-white/10 hover:border-rose-400/50 hover:bg-rose-500/10 transition-all text-xl font-medium text-white shadow-lg"
                    >
                        {currentQ.a}
                    </button>
                    <div className="flex items-center justify-center text-rose-400 font-bold italic opacity-50">OR</div>
                    <button
                        onClick={() => submitMove(`q${gameState.current_question}`, currentQ.b)}
                        disabled={loading}
                        className="w-full p-6 glass rounded-3xl border-white/10 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all text-xl font-medium text-white shadow-lg"
                    >
                        {currentQ.b}
                    </button>
                </div>
            );
        }

        // Open text format
        if (currentQ.type === 'open' || !currentQ.options) {
            return (
                <div className="space-y-4 mt-8">
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your honest answer..."
                        className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:outline-none focus:border-rose-500 transition-colors text-lg"
                    />
                    <button
                        onClick={() => submitMove(`q${gameState.current_question}`, answer)}
                        disabled={!answer.trim() || loading}
                        className="w-full bg-gradient-to-r from-rose-500 to-purple-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-opacity flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                    >
                        Lock it in <Sparkles size={18} />
                    </button>
                </div>
            );
        }

        // MCQ format
        if (currentQ.options) {
            return (
                <div className="grid grid-cols-1 gap-3 mt-8">
                    {currentQ.options.map((opt: string) => (
                        <button
                            key={opt}
                            onClick={() => submitMove(`q${gameState.current_question}`, opt)}
                            disabled={loading}
                            className="p-4 glass rounded-2xl border-white/5 hover:border-rose-500/30 hover:bg-white/10 text-left text-white transition-all shadow-md"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )
        }
    };

    if (gameState.completed) return renderCompleted();

    const handleAbort = async () => {
        try {
            await axios.post(
                `${API_URL}/games/session/${session.id}/abandon`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Failed to abort session', err);
        }
        onExit();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 glass rounded-3xl p-6 border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.1)] flex flex-col justify-between"
        >
            <div>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-gray-300">Question {gameState.current_question + 1}<span className="text-gray-500">/{totalQ}</span></h3>
                    <div className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/30 flex items-center gap-1.5">
                        <Heart size={12} className="fill-rose-400" /> {session.game_name}
                    </div>
                </div>

                {!bothAnswered && (
                    <div className="text-center py-6">
                        <p className="text-2xl font-medium text-gray-100 leading-relaxed drop-shadow-lg">
                            "{currentQ?.q || (currentQ?.a ? 'This or That?' : 'Question')}"
                        </p>
                    </div>
                )}

                {bothAnswered ? renderReveal() : (myMoveForCurrentQ ? renderWaiting() : renderQuestionFormat())}
            </div>

            {!gameState.completed && !bothAnswered && (
                <button onClick={handleAbort} className="mt-8 text-xs text-gray-500 hover:text-gray-300 uppercase tracking-widest text-center w-full transition-colors">Abort Game</button>
            )}
        </motion.div>
    );
}
