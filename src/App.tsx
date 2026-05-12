import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './lib/store.tsx';
import { motion, AnimatePresence } from 'motion/react';
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

function AppContent() {
  const { state, isLoading, session } = useApp();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
          <span className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase">Initializing System</span>
        </motion.div>
      </div>
    );
  }

  if (!state.user || !state.user.onboardingCompleted) {
    const initialPhase = (session || state.user) ? 2.5 : 0;
    return <QuickStart initialPhase={initialPhase} />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
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
          <Route path="social" element={<Social />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Unified Duel Route - Handles Searching & Combat */}
        <Route path="duels/:duelId" element={<ArenaDuel />} />
        
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
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
