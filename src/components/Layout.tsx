import { Outlet, NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, BookOpen, Timer, User, Users, Swords, Zap } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';
import { useApp } from '@/src/lib/store.tsx';
import { type ReactNode } from 'react';
import { NotificationHub } from './NotificationHub.tsx';

export function Layout() {
  const { state, getLevel, getRank, getXpProgress } = useApp();
  const level = getLevel();
  const rank = getRank();
  const xpProgress = getXpProgress();

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col items-center overflow-x-hidden bg-slate-50">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-50 rounded-full blur-[100px] opacity-50 animate-pulse" />
      </div>

      <main className="flex-1 w-full max-w-lg px-5 pt-6 pb-36 relative z-10">
        <header className="mb-8 flex justify-between items-center px-4 py-4 system-panel aero-gloss border-white/60 shadow-xl overflow-hidden relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border border-white/50 shadow-lg">
                <Zap className="text-white" size={28} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                {level}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-900 leading-tight">Level {level}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Rank {rank}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-white/80 shadow-sm">
              <span className="text-orange-500 font-bold text-xl">🔥</span>
              <span className="font-black text-blue-900 text-sm ml-2">{state.streak}</span>
            </div>
            <NotificationHub />
          </div>
        </header>

        <Outlet />
      </main>

      <nav className="fixed bottom-6 left-4 right-4 max-w-[480px] mx-auto z-50">
        <div className="system-panel p-1.5 flex justify-between items-center border-white/80 shadow-2xl bg-white/40 backdrop-blur-2xl rounded-[2rem]">
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

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 min-w-0 max-w-[70px]",
          isActive ? "text-blue-600 bg-white/60 scale-105 shadow-sm" : "text-blue-900/40"
        )
      }
    >
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest truncate w-full text-center">{label}</span>
    </NavLink>
  );
}
