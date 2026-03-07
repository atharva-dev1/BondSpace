"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Loader2 } from 'lucide-react';
import { deriveSymmetricKey, hashPasscode } from '@/lib/encryption';

// Auth screens
import AuthPage from '@/components/auth/AuthPage';
import ProfileSetup from '@/components/auth/ProfileSetup';
import ConnectPartner from '@/components/auth/ConnectPartner';
import PendingBond from '@/components/auth/PendingBond';
import SetupPasscode from '@/components/auth/SetupPasscode';
import SecureChat from '@/components/chat/SecureChat';

export default function Home() {
  const { bond, user, isLocked, lockChat, unlockChat, token, isAuthenticated, isLoading, checkAuth, setBond } = useStore();
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // 1) Restore session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // 2) After auth, handle any pending invite from /join/[code] redirect
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const pendingCode = sessionStorage.getItem('pending_invite');
    if (!pendingCode) return;
    sessionStorage.removeItem('pending_invite');

    // Auto-join the pending invite
    axios.post(`${API_URL}/bond/join/${pendingCode}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => checkAuth()).catch(() => { });
  }, [isAuthenticated, token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || !bond?.id) return;
    setIsVerifying(true);
    setUnlockError('');
    try {
      // Client-side verification: hash the passcode and compare against stored hash
      const inputHash = await hashPasscode(passcode);

      if (bond.mutual_passcode_hash && inputHash !== bond.mutual_passcode_hash) {
        setUnlockError('Wrong passcode! Try again 🔒');
        return;
      }

      // Derive encryption key from passcode + bond id
      const key = await deriveSymmetricKey(passcode, bond.id);
      unlockChat(key);
    } catch (err: any) {
      console.error('Unlock error:', err);
      setUnlockError(err.message || 'Something went wrong. Try again.');
    } finally {
      setIsVerifying(false);
      setPasscode('');
    }
  };

  // ─── STEP 0: Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.5)]"
          >
            <Heart size={30} className="text-white fill-white" />
          </motion.div>
          <Loader2 size={18} className="text-rose-400 animate-spin" />
        </div>
      </div>
    );
  }

  // ─── STEP 1: Not logged in ────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  // ─── STEP 2: Profile not complete ────────────────────────────────────────
  if (!user.profile_complete) {
    return <ProfileSetup onDone={() => checkAuth()} />;
  }

  // ─── STEP 3: No bond yet → invite partner ────────────────────────────────
  if (!bond) {
    return <ConnectPartner />;
  }

  // ─── STEP 4: Bond pending ────────────────────────────────────────────────
  if (bond.status === 'pending') {
    return <PendingBond />;
  }

  // ─── STEP 5: Bonded but passcode not set ─────────────────────────────────
  if (bond.status === 'bonded' && !bond.mutual_passcode_hash) {
    return <SetupPasscode />;
  }

  // ─── STEP 6: Fully active — secure chat ──────────────────────────────────
  const partnerName = bond.user1_id === user.id ? bond.user2_name : bond.user1_name;
  const partnerAvatar = bond.user1_id === user.id ? bond.user2_avatar : bond.user1_avatar;

  return (
    <div className="flex flex-col h-screen bg-[#080808]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 glass mx-4 mt-4 rounded-3xl z-30 shadow-lg bg-black/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 flex items-center justify-center text-lg shadow-lg border-2 border-white/10">
              {partnerAvatar || partnerName?.[0] || '❤️'}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-tight">{partnerName || 'Your Partner'}</h2>
            <p className="text-[11px] text-emerald-400 font-medium">Online</p>
          </div>
        </div>
        <button
          onClick={() => !isLocked && lockChat()}
          disabled={isLocked}
          className={`p-2.5 rounded-full transition-all ${isLocked ? 'bg-rose-500/20 text-rose-400 opacity-50 cursor-not-allowed' : 'bg-white/5 text-gray-400 hover:text-white'}`}
        >
          {isLocked ? <Lock size={18} /> : <Heart size={18} />}
        </button>
      </header>

      {/* Chat / Lock screen */}
      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-6 glow-rose">
              <Lock size={32} />
            </div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400 mb-2">Space Locked</h3>
            <p className="text-gray-500 text-sm text-center mb-8 max-w-xs">Enter your mutual passcode to reveal your private universe.</p>
            <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
              <input
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Passcode..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-center text-lg tracking-widest text-white focus:outline-none focus:border-rose-500/50 transition-all"
                autoFocus
              />
              {unlockError && <p className="text-rose-400 text-sm text-center">{unlockError}</p>}
              <button
                type="submit"
                disabled={!passcode || isVerifying}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {isVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Unlock Space'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden">
            <SecureChat />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
