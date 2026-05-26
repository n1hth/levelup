import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/src/lib/store.tsx';
import { supabase } from '@/src/lib/supabase';
import { Lock, Orbit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout.tsx';
import { Focus } from './pages/Focus.tsx';
import { Decks } from './pages/Decks.tsx';
import { DeckDetail } from './pages/DeckDetail.tsx';
import { StudySession } from './pages/StudySession.tsx';
import { QuickStart } from './components/QuickStart.tsx';
import { ComingSoon } from './pages/ComingSoon.tsx';
import { Profile } from './pages/Profile.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Battle } from './pages/Battle.tsx';
import { ArenaPlay } from './pages/ArenaPlay.tsx';
import { ArenaDuel } from './pages/ArenaDuel.tsx';
import { Social } from './pages/Social.tsx';
import { Chat } from './pages/Chat.tsx';

import { AppTour } from './components/AppTour.tsx';
import Landing from './pages/Landing.tsx';

function PasswordResetPage({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ text: "Password reset successful! Redirecting...", type: 'success' });
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to reset password.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black overflow-hidden relative font-sans text-white">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '700ms' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-[#06060c]/90 border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 text-center"
      >
        <div className="w-16 h-16 rounded-[1.8rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Orbit size={32} className="text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-white">
          Reset Password
        </h2>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest italic mb-6">
          Establish a new password for your account
        </p>

        {message && (
          <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-wider mb-6 border ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4 text-left">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center text-cyan-400">
              <Lock size={18} />
            </div>
            <input
              required
              minLength={6}
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all text-white placeholder:text-white/20 font-bold text-xs tracking-wider"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-30 text-black mt-2"
          >
            {loading ? "Resetting..." : "Save Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { state, isLoading, session } = useApp();
  const location = useLocation();
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || window.location.href.includes('recovery_token=')) {
      setIsRecovering(true);
    }
  }, []);

  if (isRecovering) {
    return (
      <PasswordResetPage 
        onComplete={() => {
          setIsRecovering(false);
          window.location.hash = ''; // clear hash
        }} 
      />
    );
  }

  if (isLoading || (session && !state.user)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '700ms' }} />
        
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-8 relative z-10"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center p-2">
               <div className="w-full h-full rounded-full border-2 border-cyan-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
            </div>
            <div className="absolute inset-0 blur-xl bg-cyan-500/20 rounded-full animate-pulse" />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-black tracking-[0.6em] text-cyan-400 uppercase italic">System Initializing</span>
            <div className="flex gap-1">
               {Array.from({ length: 3 }).map((_, i) => (
                 <motion.div
                   key={i}
                   animate={{ opacity: [0.2, 1, 0.2] }}
                   transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                   className="w-1.5 h-px bg-cyan-400"
                 />
               ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!state.user) {
    if (location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }
    return <Landing />;
  }

  if (!state.user.onboardingCompleted) {
    return <QuickStart initialPhase={0} />;
  }

  return (
    <>
      <AppTour />
      <Routes location={location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Dashboard />} />
          <Route path="focus" element={<Focus />} />
          <Route path="decks" element={<Decks />} />
          <Route path="decks/:id" element={<DeckDetail />} />
          <Route path="decks/:id/study" element={<StudySession />} />
          <Route path="battle" element={<Battle />} />
          <Route path="arenas" element={<Navigate to="/battle" replace />} />
          <Route path="arenas/:deckId/:difficulty" element={<ArenaPlay />} />
          <Route path="social" element={<Social />}>
            <Route path="chat/:userId" element={<Chat />} />
          </Route>
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
        </Route>
        
        {/* Isolated Full-Screen Routes */}
        <Route path="duels/:duelId" element={<ArenaDuel />} />
        
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}
