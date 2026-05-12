import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Timer, BookOpen, Zap, Flame, Clock, Target, ChevronRight, Activity, Trophy, Sparkles, TrendingUp, Calendar } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      {/* ═══ Greeting ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{greeting.emoji}</span>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            {greeting.text}, {state.user?.name?.split(' ')[0] || 'Player'}
          </h1>
        </div>
        <p className="text-[11px] font-bold text-blue-400 mt-1 ml-10">{motivation}</p>
      </motion.div>

      {/* ═══ Daily Progress Ring ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="system-panel p-6 border-white/60 shadow-xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          {/* Ring */}
          <div className="relative shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="80" cy="80" r={ringRadius}
                fill="transparent"
                stroke="rgba(37, 99, 235, 0.05)"
                strokeWidth="12"
              />
              {/* Progress ring */}
              <motion.circle
                cx="80" cy="80" r={ringRadius}
                fill="transparent"
                stroke="url(#progressGradient)"
                strokeWidth="12"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-blue-900 leading-none">{todayXp}</span>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">XP Today</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Clock size={10} /> Focus
              </span>
              <span className="text-sm font-black text-blue-900">{todayFocusMin}m</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Target size={10} /> Sessions
              </span>
              <span className="text-sm font-black text-blue-900">{todaySessions}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <BookOpen size={10} /> Cards
              </span>
              <span className="text-sm font-black text-blue-900">{todayCards}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Zap size={10} /> Goal
              </span>
              <span className="text-sm font-black text-blue-900">{Math.round(ringProgress * 100)}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Missions ═══ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-2">
             Daily Missions <span className="text-blue-300 font-bold">[{missionsComplete}/{missions.length}]</span>
          </h3>
        </div>
        
        <div className="space-y-2">
          {missions.map((mission, i) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all flex items-center gap-4 overflow-hidden",
                mission.done 
                  ? "bg-emerald-50/50 border-emerald-100 opacity-70" 
                  : "bg-white border-blue-50 hover:border-blue-200 shadow-sm"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all",
                mission.done ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600 group-hover:scale-110"
              )}>
                {mission.done ? <Zap size={18} fill="currentColor" /> : <Sparkles size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={cn("text-xs font-black uppercase tracking-tight", mission.done ? "text-emerald-700 line-through" : "text-blue-900")}>
                    {mission.title}
                  </h4>
                  <span className="text-[9px] font-black text-blue-400">{mission.done ? 'DONE' : 'IN PROGRESS'}</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(mission.current / mission.target) * 100}%` }}
                    className={cn("h-full", mission.done ? "bg-emerald-400" : "bg-blue-400")}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ Weekly Insights ═══ */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] px-1">Weekly Intelligence</h3>
        <div className="system-panel p-5 border-white/60 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Recall Performance</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-2xl font-black italic tracking-tighter">{insights.thisWeekXp} XP</div>
                <div className="text-[9px] font-bold uppercase opacity-60 mt-1">This Week</div>
              </div>
              <div>
                <div className="text-2xl font-black italic tracking-tighter">{insights.consistency}%</div>
                <div className="text-[9px] font-bold uppercase opacity-60 mt-1">Consistency</div>
              </div>
            </div>
          </div>
        </div>
        
        {(insights.bestDay || insights.mostStudiedDeck) && (
          <div className="space-y-2 mt-3">
            {insights.bestDay && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-blue-50 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <Calendar size={14} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[9px] font-black text-blue-900 uppercase">Peak Performance Day</span>
                  <span className="text-[9px] font-bold text-blue-400 uppercase">{insights.bestDay.day}</span>
                </div>
              </div>
            )}
            {insights.mostStudiedDeck && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-blue-50 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                  <BookOpen size={14} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[9px] font-black text-blue-900 uppercase">Primary Focus</span>
                  <span className="text-[9px] font-bold text-blue-400 uppercase truncate max-w-[100px] text-right">{insights.mostStudiedDeck.title}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Recent Activity ═══ */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] px-1">Neural Logs</h3>
        <div className="space-y-2">
          {activity.length > 0 ? activity.map((item, i) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/40 border border-white/60">
              <div className="text-xs">{item.type === 'study' ? '⚔️' : '🧠'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-blue-900 uppercase truncate">{item.title}</p>
                <p className="text-[8px] font-bold text-blue-400 uppercase">{getRelativeTime(item.timestamp)}</p>
              </div>
              <div className="text-[10px] font-black text-emerald-500">+{item.xp} XP</div>
            </div>
          )) : (
            <div className="text-center py-6 system-panel border-white/60 opacity-40">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-900">No recent logs found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
