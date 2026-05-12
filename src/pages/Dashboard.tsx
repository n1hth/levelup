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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      <div className="w-full bg-orange-600 text-white py-4 text-center text-xs font-black uppercase tracking-[0.5em] shadow-2xl rounded-2xl mb-4">
        V5 SYNC: FOLDER [/app/api/chat/src/pages] ACTIVE
      </div>
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
                fill="none" stroke="#e2e8f0" strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Progress ring */}
              <motion.circle
                cx="80" cy="80" r={ringRadius}
                fill="none"
                stroke={todayXp >= DAILY_XP_GOAL ? '#22c55e' : rankColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-3xl font-black text-blue-900"
              >
                {todayXp}
              </motion.span>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">XP Today</span>
              {todayXp >= DAILY_XP_GOAL && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 1.2 }}
                  className="mt-1"
                >
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Goal ✓</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right side info */}
          <div className="flex-1 space-y-3">
            <div>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Daily Goal</span>
              <p className="text-sm font-black text-blue-900">{todayXp} / {DAILY_XP_GOAL} XP</p>
            </div>
            <div className="w-full h-1.5 rounded-full bg-blue-100/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${ringProgress * 100}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                className="h-full rounded-full"
                style={{ background: todayXp >= DAILY_XP_GOAL ? '#22c55e' : rankColor }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg border border-orange-100">
                <Flame size={12} className="text-orange-500" />
                <span className="text-[9px] font-black text-orange-600">{state.streak}d</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg border border-purple-100">
                <Zap size={12} className="text-purple-500" />
                <span className="text-[9px] font-black text-purple-600">×{(1 + state.momentum * 0.1).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-[9px] font-black" style={{ color: rankColor }}>Lv.{level}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Quick Actions ═══ */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/focus')}
          className="system-panel p-5 border-white/60 text-left relative overflow-hidden group hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/40 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Timer size={24} className="text-white" />
            </div>
            <h3 className="text-sm font-black text-blue-900">Focus</h3>
            <p className="text-[9px] font-bold text-blue-400 mt-0.5">
              {todayFocusMin > 0 ? `${todayFocusMin} min today` : 'Start a session'}
            </p>
          </div>
          <ChevronRight size={16} className="absolute top-1/2 right-4 -translate-y-1/2 text-blue-200 group-hover:text-blue-400 transition-colors" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={() => navigate('/decks')}
          className="system-panel p-5 border-white/60 text-left relative overflow-hidden group hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 to-green-50/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-3 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
              <BookOpen size={24} className="text-white" />
            </div>
            <h3 className="text-sm font-black text-blue-900">Study</h3>
            <p className="text-[9px] font-bold text-blue-400 mt-0.5">
              {allDue > 0 ? `${allDue} cards due` : `${state.decks.length} decks`}
            </p>
          </div>
          <ChevronRight size={16} className="absolute top-1/2 right-4 -translate-y-1/2 text-blue-200 group-hover:text-blue-400 transition-colors" />
        </motion.button>
      </div>

      {/* ═══ Today's Stats ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-4 gap-2"
      >
        {[
          { value: todaySessions, label: 'Sessions', icon: <Activity size={14} className="text-blue-500" /> },
          { value: todayFocusMin, label: 'Minutes', icon: <Clock size={14} className="text-cyan-500" /> },
          { value: todayCards, label: 'Cards', icon: <BookOpen size={14} className="text-emerald-500" /> },
          { value: todayXp, label: 'XP', icon: <Zap size={14} className="text-purple-500" /> },
        ].map((s, i) => (
          <div key={s.label} className="system-panel p-2.5 flex flex-col items-center gap-0.5 border-white/60">
            {s.icon}
            <span className="text-base font-black text-blue-900 leading-none">{s.value}</span>
            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ═══ Daily Missions ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="system-panel p-5 border-white/60"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} className="text-blue-500" /> Daily Missions
          </h3>
          <span className={cn(
            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
            missionsComplete === 3 ? "text-emerald-600 bg-emerald-50" : "text-blue-400 bg-blue-50"
          )}>
            {missionsComplete}/3
          </span>
        </div>

        <div className="space-y-3">
          {missions.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                m.done ? "bg-emerald-50/60 border border-emerald-100" : "bg-blue-50/30 border border-transparent"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
                m.done ? "bg-emerald-100" : "bg-blue-100/60"
              )}>
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-black", m.done ? "text-emerald-700" : "text-blue-900")}>{m.title}</span>
                  {m.done && <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">✓ Done</span>}
                </div>
                <p className="text-[9px] font-bold text-blue-400 mt-0.5">{m.description}</p>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-blue-100/60 mt-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.current / m.target) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 + i * 0.1 }}
                    className={cn("h-full rounded-full", m.done ? "bg-emerald-400" : "bg-blue-400")}
                  />
                </div>
              </div>
              <span className="text-[9px] font-black text-blue-400 shrink-0">{m.current}/{m.target}</span>
            </motion.div>
          ))}
        </div>

        {missionsComplete === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 1 }}
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-yellow-500" />
              <span className="text-xs font-black text-amber-800 uppercase tracking-widest">All Missions Complete!</span>
              <Sparkles size={16} className="text-yellow-500" />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ═══ Recent Activity ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="system-panel p-5 border-white/60"
      >
        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity size={14} className="text-blue-500" /> Recent Activity
        </h3>

        {activity.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[10px] font-bold text-blue-300">No activity yet. Start a Focus session or study a deck!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/20 hover:bg-blue-50/40 transition-colors"
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  a.type === 'focus' ? "bg-cyan-100 text-cyan-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {a.type === 'focus' ? <Timer size={18} /> : <BookOpen size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black text-blue-900 truncate block">{a.title}</span>
                  <span className="text-[9px] font-bold text-blue-400">{a.subtitle}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5">
                    <Zap size={10} className="text-purple-500" />
                    <span className="text-[10px] font-black text-purple-600">+{a.xp}</span>
                  </div>
                  <span className="text-[8px] font-bold text-blue-300">{getRelativeTime(a.timestamp)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══ Weekly Insights ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="system-panel p-5 border-white/60"
      >
        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-500" /> Weekly Insights
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-50">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">This Week</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-900 tabular-nums">{insights.thisWeekXp}</span>
              {insights.thisWeekXp >= insights.lastWeekXp ? (
                <div className="flex items-center text-emerald-500 text-[9px] font-bold">
                  <TrendingUp size={10} className="mr-0.5" /> +{insights.thisWeekXp - insights.lastWeekXp}
                </div>
              ) : (
                <div className="flex items-center text-red-500 text-[9px] font-bold">
                  <TrendingDown size={10} className="mr-0.5" /> {insights.thisWeekXp - insights.lastWeekXp}
                </div>
              )}
            </div>
            <p className="text-[8px] font-bold text-blue-300 mt-0.5">vs {insights.lastWeekXp} last week</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-50">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Consistency</span>
            <span className="text-xl font-black text-blue-900 tabular-nums block">{insights.consistency}%</span>
            <div className="w-full h-1 bg-blue-100 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${insights.consistency}%` }} />
            </div>
          </div>
        </div>
        {(insights.bestDay || insights.mostStudiedDeck) && (
          <div className="space-y-8 pb-32">
            <div className="w-full bg-orange-600 text-white py-4 text-center text-xs font-black uppercase tracking-[0.5em] shadow-2xl rounded-2xl mb-4">
              V5 SYNC: FOLDER [/app/api/chat/src/pages] ACTIVE
            </div>
            {insights.bestDay && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-blue-50 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <Calendar size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-900">Best: {insights.bestDay.day}</span>
                  <span className="text-[8px] font-bold text-blue-400 block">{insights.bestDay.minutes} min</span>
                </div>
              </div>
            )}
            {insights.mostStudiedDeck && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-blue-50 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <BookOpen size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-900">Top: {insights.mostStudiedDeck.title}</span>
                  <span className="text-[8px] font-bold text-blue-400 block">{insights.mostStudiedDeck.sessions} sessions</span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
