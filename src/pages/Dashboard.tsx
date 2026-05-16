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
  if (streak >= 7) return "The Shadow Monarch's presence is overwhelming. Keep pushing.";
  if (streak >= 3) return "Your mana is surging. Level up your rank today.";
  if (streak >= 1) return "The System awaits your next move. Don't falter.";
  return "Awaken your potential. The first quest begins now.";
}

const DAILY_XP_GOAL = 100;

// ═══════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
      <div className={cn("opacity-70", color)}>{icon}</div>
      <span className="text-sm font-black text-white italic">{value}</span>
      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest italic">{label}</span>
    </div>
  );
}

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

               <motion.span className="text-5xl font-black text-white italic tracking-tighter leading-none tabular-nums">
                 {todayXp}
               </motion.span>
               <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] font-mono mt-2">GOAL: {DAILY_XP_GOAL}</span>
             </div>
          </div>

          <div className="w-full max-w-[240px] text-center">
            <h3 className="text-sm font-black text-white italic tracking-widest uppercase mb-1">Daily Progress</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-[10px] font-black italic text-cyan-400 tabular-nums">{Math.round(ringProgress * 100)}% Complete</span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>
          </div>
        </motion.div>

        {/* Protocols & History Row */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
           {/* Quests */}
           <motion.div variants={itemVariants} className="md:col-span-7 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
                    <Target size={14} className="text-cyan-400" /> Daily Quests
                 </h3>
                 <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">{missionsComplete} / 3 Complete</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {missions.map((m) => (
                  <div key={m.id} className={cn(
                    "px-6 py-4 rounded-[1.5rem] border flex items-center justify-between group transition-all",
                    m.done ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.01] border-white/5 hover:border-white/10"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] border shadow-inner transition-all",
                        m.done ? "bg-emerald-500 border-emerald-500 text-black" : "bg-white/5 border-white/5 text-white/30"
                      )}>
                        {m.done ? <Sparkles size={14} /> : m.icon}
                      </div>
                      <div>
                        <span className={cn("text-[10px] font-black uppercase italic tracking-widest block", m.done ? "text-emerald-400" : "text-white")}>{m.title}</span>
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-widest italic">{m.current}/{m.target} PROGRESS</span>
                      </div>
                    </div>
                    {m.done && <Sparkles size={14} className="text-emerald-400" />}
                  </div>
                ))}
              </div>
           </motion.div>

           {/* Raid History */}
           <motion.div variants={itemVariants} className="md:col-span-5 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
                    <Clock size={14} className="text-purple-400" /> Raid History
                 </h3>
                 <button onClick={() => navigate('/decks')} className="text-[8px] font-black text-white/10 uppercase tracking-widest italic hover:text-white transition-colors">All Decks</button>
              </div>

              <div className="space-y-3">
                 {activity.length === 0 ? (
                   <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[2rem]">
                      <p className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">No combat records</p>
                   </div>
                 ) : (
                   activity.slice(0, 4).map((act, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.01] border border-white/5 rounded-2xl group hover:bg-white/[0.03] transition-all">
                        <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center shrink-0 group-hover:border-cyan-400/20 transition-colors">
                           <BookOpen size={16} className="text-white/10 group-hover:text-cyan-400/40 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-black text-white italic uppercase truncate">{act.deckTitle}</p>
                           <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic mt-0.5">{getRelativeTime(act.timestamp)}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-cyan-400 italic">+{act.xp} XP</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </motion.div>
        </div>

        {/* Action Row */}
        <motion.div variants={itemVariants} className="col-span-6">
          <button
            onClick={() => navigate('/focus')}
            className="w-full system-panel p-6 modular-card group text-left flex flex-col justify-between aspect-square active:scale-95 transition-transform bg-white/[0.01]"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Timer size={24} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight">Focus Mode</h3>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.1em] italic mt-1">Deep learning sessions</p>
            </div>
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-6">
          <button
            onClick={() => navigate('/decks')}
            className="w-full system-panel p-6 modular-card group text-left flex flex-col justify-between aspect-square active:scale-95 transition-transform bg-white/[0.01]"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight">My Decks</h3>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.1em] italic mt-1">{allDue} Cards Due</p>
            </div>
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="col-span-12 system-panel p-6 modular-card bg-white/[0.01] flex justify-between items-center overflow-x-auto">
          {[
            { value: todaySessions, label: 'SESSIONS', icon: <Activity className="text-cyan-400" size={16} /> },
            { value: todayFocusMin, label: 'MINS', icon: <Clock className="text-blue-400" size={16} /> },
            { value: todayCards, label: 'CARDS', icon: <BookOpen className="text-emerald-400" size={16} /> },
            { value: todayXp, label: 'XP', icon: <Zap className="text-yellow-400" size={16} /> },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="text-white/20">{s.icon}</div>
              <span className="text-base font-black text-white italic tabular-nums leading-none">{s.value}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </motion.div>
  );
}
