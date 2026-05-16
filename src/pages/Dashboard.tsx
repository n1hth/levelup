import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Timer, BookOpen, Zap, Flame, Clock, Target, ChevronRight, Activity, Trophy, Sparkles, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { getRankColor } from '@/src/lib/xp.ts';
import { cn, getRelativeTime } from '@/src/lib/utils.ts';

// ═══════════════════════════════════════════════
// GREETING LOGIC
// ═══════════════════════════════════════════════

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Late Night', emoji: '🌙' };
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌅' };
  return { text: 'Late Night', emoji: '🌙' };
}

function getMotivation(streak: number): string {
  if (streak >= 7) return "You're on fire! Keep the momentum going.";
  if (streak >= 3) return "Great streak! Don't break the chain.";
  if (streak >= 1) return "Consistency is key. Show up again today.";
  return "Start fresh today. Every session counts.";
}

const DAILY_XP_GOAL = 100;

// ═══════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════

export function Dashboard() {
  const navigate = useNavigate();
  const {
    state, getLevel, getRank, getXpProgress,
    getTodayFocusTime, getTodaySessionCount, getTodayXp,
    getTodayCardsReviewed, getDailyMissions, getRecentActivity, getAllDueCards, getWeeklyInsights,
  } = useApp();

  const level = getLevel();
  const rank = getRank();
  const rankColor = getRankColor(rank);
  const xpProgress = getXpProgress();
  const greeting = getGreeting();
  const motivation = getMotivation(state.streak);

  const todayXp = getTodayXp();
  const todayFocusMin = Math.round(getTodayFocusTime() / 60);
  const todaySessions = getTodaySessionCount();
  const todayCards = getTodayCardsReviewed();
  const missions = getDailyMissions();
  const activity = getRecentActivity();
  const allDue = getAllDueCards();
  const insights = getWeeklyInsights();
  const missionsComplete = missions.filter(m => m.done).length;

  // Daily progress ring
  const ringProgress = Math.min(todayXp / DAILY_XP_GOAL, 1);
  const ringRadius = 70;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - ringProgress);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-24"
    >
      {/* ═══ Header Greeting ═══ */}
      <motion.div variants={itemVariants} className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="text-3xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {greeting.emoji}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
              {greeting.text.split(' ')[0]} <span className="text-cyan-400">{state.user?.name?.split(' ')[0] || 'HUNTER'}</span>
            </h1>
            <p className="text-[7px] font-black text-white/30 tracking-[0.4em] uppercase italic mt-1">{motivation}</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ Core Status Area (Bento Grid) ═══ */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Left Col: Sync Ring (Hero) */}
        <motion.div variants={itemVariants} className="col-span-12 system-panel p-6 modular-card group relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
          
          <div className="relative shrink-0 mb-6">
             <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90 drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]">
               <defs>
                 <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#0891b2" />
                   <stop offset="50%" stopColor="#22d3ee" />
                   <stop offset="100%" stopColor="#ffffff" />
                 </linearGradient>
               </defs>
               <circle cx="90" cy="90" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="10" />
               <motion.circle
                 cx="90" cy="90" r={ringRadius}
                 fill="none" stroke="url(#ringGradient)" strokeWidth="10" strokeLinecap="round"
                 strokeDasharray={ringCircumference}
                 initial={{ strokeDashoffset: ringCircumference }}
                 animate={{ strokeDashoffset: ringOffset }}
                 transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-[8px] font-black text-cyan-400/40 uppercase tracking-[0.4em] mb-1 italic">YIELD</span>
               <motion.span className="text-5xl font-black text-white italic tracking-tighter leading-none tabular-nums">
                 {todayXp}
               </motion.span>
               <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] font-mono mt-2">GOAL: {DAILY_XP_GOAL}</span>
             </div>
          </div>

          <div className="w-full max-w-[240px] text-center">
            <h3 className="text-sm font-black text-white italic tracking-widest uppercase mb-1">Neural Integration</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-[10px] font-black italic text-cyan-400 tabular-nums">{Math.round(ringProgress * 100)}% Complete</span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>
          </div>
        </motion.div>

        {/* Protocols — MOVED TO SECOND POSITION */}
        <motion.div variants={itemVariants} className="col-span-12 system-panel p-5 modular-card bg-white/[0.01]">
          <div className="flex items-center justify-between mb-4 px-1">
             <div className="flex items-center gap-2">
               <Target size={14} className="text-cyan-400" />
               <h3 className="text-[9px] font-black text-white/40 italic tracking-[0.3em] uppercase">Daily Protocols</h3>
             </div>
             <span className="text-[9px] font-black text-cyan-400 tabular-nums">[{missionsComplete}/3]</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {missions.map((m) => (
              <div key={m.id} className={cn(
                "px-4 py-2.5 rounded-xl border flex items-center justify-between",
                m.done ? "bg-cyan-500/[0.03] border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.05)]" : "bg-white/[0.01] border-white/5"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] border shadow-inner",
                    m.done ? "bg-cyan-400 border-cyan-400 text-slate-950" : "bg-white/5 border-white/5 text-white/30"
                  )}>
                    {m.done ? <Sparkles size={10} /> : m.icon}
                  </div>
                  <span className={cn("text-[9px] font-black uppercase italic tracking-widest", m.done ? "text-cyan-400" : "text-white/40")}>{m.title}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[7px] font-black text-white/20 tabular-nums mb-1">{m.current}/{m.target}</span>
                   <div className="w-12 h-0.5 bg-white/5 rounded-full overflow-hidden">
                     <div className={cn("h-full", m.done ? "bg-cyan-400" : "bg-white/20")} style={{ width: `${(m.current/m.target)*100}%` }} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Row */}
        <motion.div variants={itemVariants} className="col-span-6">
          <button
            onClick={() => navigate('/focus')}
            className="w-full system-panel p-5 modular-card group text-left flex flex-col justify-between aspect-square active:scale-95 transition-transform bg-white/[0.01]"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Timer size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-tight">Focus</h3>
              <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.1em] italic mt-1">Pulse active</p>
            </div>
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-6">
          <button
            onClick={() => navigate('/decks')}
            className="w-full system-panel p-5 modular-card group text-left flex flex-col justify-between aspect-square active:scale-95 transition-transform bg-white/[0.01]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <BookOpen size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-tight">Cores</h3>
              <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.1em] italic mt-1">{allDue} Due</p>
            </div>
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="col-span-12 system-panel p-5 modular-card bg-white/[0.01] flex justify-between items-center">
          {[
            { value: todaySessions, label: 'RUNS', icon: <Activity className="text-cyan-400" size={14} /> },
            { value: todayFocusMin, label: 'MINS', icon: <Clock className="text-blue-400" size={14} /> },
            { value: todayCards, label: 'SYNC', icon: <BookOpen className="text-emerald-400" size={14} /> },
            { value: todayXp, label: 'XP', icon: <Zap className="text-yellow-400" size={14} /> },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <div className="text-white/20">{s.icon}</div>
              <span className="text-sm font-black text-white italic tabular-nums leading-none">{s.value}</span>
              <span className="text-[6px] font-black text-white/20 uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </motion.div>
  );
}
