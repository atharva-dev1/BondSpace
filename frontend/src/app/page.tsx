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

  // 1) Restore session on mount - removed to rely on ThemeWrapper for deduplication

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
        <div className="flex flex-col items-center gap-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 relative"
          >
            <img src="/logo.svg" alt="BondSpace" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]" />
          </motion.div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">Igniting Universe</span>
            <Loader2 size={14} className="text-rose-500/40 animate-spin" />
          </div>
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
    <div className="flex-1 flex flex-col h-full bg-[#080808] overflow-hidden">
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
            <div className="w-24 h-24 mb-8 relative group">
              <img src="/logo.svg" alt="Locked" className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(244,63,94,0.3)] group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter mb-2">Space Locked</h3>
            <p className="text-white/40 text-sm text-center mb-10 max-w-[240px] leading-relaxed">Enter your mutual passcode to reveal your private universe.</p>
            <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
              <input
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="••••"
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-center text-2xl tracking-[1em] text-white focus:outline-none focus:border-accent/50 transition-all font-mono"
                autoFocus
              />
              {unlockError && <p className="text-accent text-xs font-bold text-center animate-bounce">{unlockError}</p>}
              <button
                type="submit"
                disabled={!passcode || isVerifying}
                className="w-full text-white font-black uppercase tracking-widest py-5 rounded-3xl flex items-center justify-center gap-2 shadow-2xl hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all"
                style={{
                  background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))',
                  boxShadow: '0 10px 25px -5px var(--accent-glow)'
                }}
              >
                {isVerifying ? <Loader2 size={20} className="animate-spin" /> : 'Enter Now'}
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
