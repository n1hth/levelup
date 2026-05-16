import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode, useState } from 'react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { 
  Zap, 
  Flame, 
} from 'lucide-react';
import { Orb } from './Orb.tsx';

// ═══════════════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════════════

export function Layout() {
  const { state, getLevel, getRank, getXpProgress } = useApp();
  const location = useLocation();
  const level = getLevel();
  const rank = getRank();
  const xpProgress = getXpProgress();

  const [interaction, setInteraction] = useState<'none' | 'holding' | 'insight' | 'nav-open'>('none');

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col items-center overflow-x-hidden bg-[#020617] selection:bg-cyan-500/30">
      {/* Page Content Panel */}
      <motion.div 
        animate={{ 
          opacity: interaction === 'holding' ? 0.4 : interaction === 'insight' ? 0.6 : interaction === 'nav-open' ? 0.7 : 1,
          y: interaction === 'insight' ? 60 : 0
        }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full h-full flex flex-col items-center"
      >
        <main className="flex-1 w-full max-w-lg px-5 pt-8 pb-[140px] relative z-10">
          {/* Header HUD - Minimal & Sophisticated */}
          <header className="mb-8 relative">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center p-2">
                      <Zap className="text-cyan-400 w-full h-full" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-md bg-white text-slate-950 flex items-center justify-center text-[10px] font-black italic">
                      {level}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black text-white/40 italic tracking-widest uppercase leading-none mb-1">Hunter Rank</h2>
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                      {rank.split(' ')[0]} <span className="text-cyan-400">CLASS</span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-0.5">
                     <div className="flex items-center gap-1">
                       <Flame size={10} className="text-orange-500" />
                       <span className="text-[10px] font-black text-white italic tracking-tighter tabular-nums">{state.streak}D</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Zap size={10} className="text-cyan-400" />
                       <span className="text-[10px] font-black text-white italic tracking-tighter tabular-nums">×{(1 + state.momentum * 0.1).toFixed(1)}</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="relative w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname.split('/')[1]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.32, 1] }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </motion.div>

      {/* Persistence Layer */}
      <Orb onInteractionChange={setInteraction} />
    </div>
  );
}

