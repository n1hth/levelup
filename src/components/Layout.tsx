import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode, useState } from 'react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { 
  Zap, 
  Flame, 
} from 'lucide-react';
import { Orb } from './Orb.tsx';
import { getOrbGradient, getOrbColors } from '@/src/lib/orb-color';

function SmallOrb({ hue = 200, state = 'idle', size = 36 }: { hue?: number; state?: string; size?: number }) {
  const palette = getOrbColors(hue, 'idle');
  const gradient = getOrbGradient(hue, 'idle', 'E');

  return (
    <div 
      className="rounded-full relative shrink-0 shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        boxShadow: `0 0 15px ${palette.glow}`,
        background: gradient
      }}
    >
      <div className="absolute inset-0 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)] rounded-full pointer-events-none" />
      <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[1px] -rotate-[35deg]" />
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════════════

export function Layout() {
  const { state, getLevel, getRank, getXpProgress, getOrbHue } = useApp();
  const navigate = useNavigate();
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
                  <button 
                    id="profile-orb"
                    onClick={() => navigate('/profile')}
                    className="relative hover:scale-105 active:scale-95 transition-transform"
                  >
                    <SmallOrb hue={getOrbHue()} size={40} />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-md bg-white text-slate-950 flex items-center justify-center text-[10px] font-black italic">
                      {level}
                    </div>
                  </button>
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
            <Outlet />
          </div>
        </main>
      </motion.div>

      {/* Persistence Layer */}
      <Orb onInteractionChange={setInteraction} />
    </div>
  );
}

