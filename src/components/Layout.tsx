import { Outlet, NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, BookOpen, Timer, User, Users, Swords, Zap, Triangle, Crosshair } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';
import { useApp } from '@/src/lib/store.tsx';
import { type ReactNode } from 'react';

export function Layout() {
  const { state, getLevel, getRank, getXpProgress } = useApp();
  const level = getLevel();
  const rank = getRank();
  const xpProgress = getXpProgress();

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col items-center overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-50 rounded-full blur-[100px] opacity-50 animate-pulse" style={{ animationDelay: '700ms' }} />
      </div>

      <main className="flex-1 w-full max-w-lg px-5 pt-6 pb-36 relative z-10">
        {/* Header HUD */}
        <header className="mb-8 flex justify-between items-center px-4 py-4 system-panel aero-gloss border-white/60 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-blue-50/20 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-system-blue to-blue-600 flex items-center justify-center border border-white/50 shadow-[0_4px_15px_rgba(0,210,255,0.4)] transition-transform group-hover:scale-110">
                <Zap className="text-white fill-white/10" size={28} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-md">
                {level}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-900 leading-tight flex items-center gap-2">
                Level {level}
                <Triangle className="fill-blue-500 text-blue-500 rotate-180" size={10} />
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Rank {rank}</span>
              </div>
              <div className="w-32 hud-progress mt-1.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.progress * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="hud-progress-fill"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 relative z-10">
            <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/80 shadow-sm transition-all hover:bg-white/80">
              <span className="text-orange-500 font-bold text-xl leading-none drop-shadow-sm">🔥</span>
              <span className="font-black text-blue-900 text-sm tracking-tight">{state.streak}</span>
            </div>
            {state.momentum > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg border border-purple-100">
                <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest">⚡ ×{(1 + state.momentum * 0.1).toFixed(1)}</span>
              </div>
            )}
          </div>
        </header>

        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 max-w-[480px] mx-auto z-50">
        <div className="system-panel p-1.5 flex justify-between items-center border-white/80 shadow-2xl relative overflow-hidden backdrop-blur-3xl bg-white/40 rounded-[2rem]">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          
          <NavItem to="/home" icon={<Home size={22} />} label="Home" />
          <NavItem to="/focus" icon={<Timer size={22} />} label="Focus" />
          <NavItem to="/decks" icon={<BookOpen size={22} />} label="Decks" />
          <NavItem to="/battle" icon={<Swords size={22} />} label="Battle" />
          <NavItem to="/social" icon={<Users size={22} />} label="Social" />
          <NavItem to="/profile" icon={<User size={22} />} label="Status" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, disabled }: { to: string; icon: ReactNode; label: string; disabled?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-500 relative z-10 flex-1 min-w-0 max-w-[70px]",
          disabled && "opacity-40 pointer-events-none",
          isActive 
            ? "text-blue-600 bg-white/60 scale-105 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]" 
            : "text-blue-900/40 hover:text-blue-600 hover:bg-white/10"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            {icon}
            {isActive && (
              <div className="absolute inset-0 blur-md opacity-40 text-current pointer-events-none" aria-hidden="true">
                {icon}
              </div>
            )}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest leading-none truncate w-full text-center">{label}</span>
        </>
      )}
    </NavLink>
  );
}
