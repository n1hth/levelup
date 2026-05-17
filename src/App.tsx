import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from '@/src/lib/store.tsx';
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

function AppContent() {
  const { state, isLoading, session } = useApp();
  const location = useLocation();

  if (isLoading) {
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
            <span className="text-[11px] font-black tracking-[0.6em] text-cyan-400 uppercase italic">Initializing Neural Core</span>
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

  if (!state.user || !state.user.onboardingCompleted) {
    const initialPhase = (session || state.user) ? 0 : 2;
    return <QuickStart initialPhase={initialPhase} />;
  }

  // Only trigger full page unmounts when entering/leaving full-screen isolated views
  const isIsolatedView = location.pathname.startsWith('/duels');
  const routeKey = isIsolatedView ? location.pathname : 'main-layout';

  return (
    <>
      <AppTour />
      <AnimatePresence mode="wait">
        <div key={routeKey}>
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
            </Route>
            
            {/* Isolated Full-Screen Routes */}
            <Route path="duels/:duelId" element={<ArenaDuel />} />
            
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </AnimatePresence>
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
