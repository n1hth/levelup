import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Flame, BookOpen, Clock, ChevronRight, AlertTriangle, Trophy, Lock, Shield } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { getRankColor, getRankTitle } from '@/src/lib/xp.ts';
import { cn } from '@/src/lib/utils.ts';
import { formatDuration } from '@/src/lib/utils.ts';

// ═══════════════════════════════════════════════
// RANK LADDER DATA
// ═══════════════════════════════════════════════

const RANKS = [
  { letter: 'E', title: 'Novice Learner', minLevel: 1, maxLevel: 5, color: '#94a3b8' },
  { letter: 'D', title: 'Card Apprentice', minLevel: 6, maxLevel: 10, color: '#22c55e' },
  { letter: 'C', title: 'Knowledge Seeker', minLevel: 11, maxLevel: 20, color: '#3b82f6' },
  { letter: 'B', title: 'Focus Hunter', minLevel: 21, maxLevel: 35, color: '#a855f7' },
  { letter: 'A', title: 'Arena Master', minLevel: 36, maxLevel: 50, color: '#ef4444' },
  { letter: 'S', title: 'Sovereign Scholar', minLevel: 51, maxLevel: 99, color: '#fbbf24' },
];

// ═══════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════

export function Profile() {
  const {
    state, getLevel, getRank, getXpProgress, resetUser, signOut,
    getTotalFocusTime, getTotalCardsStudied, getTotalCardsMastered,
    getStudyHeatmap, getAchievements,
  } = useApp();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const level = getLevel();
  const rank = getRank();
  const xpProgress = getXpProgress();
  const rankColor = getRankColor(rank);
  const rankTitle = getRankTitle(rank);
  const totalFocusTime = getTotalFocusTime();
  const cardsStudied = getTotalCardsStudied();
  const cardsMastered = getTotalCardsMastered();
  const heatmap = getStudyHeatmap();
  const achievements = getAchievements();

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const memberSince = state.user ? new Date(state.user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

  // Find current and next rank
  const currentRankData = RANKS.find(r => r.letter === rank) || RANKS[0];
  const currentRankIdx = RANKS.findIndex(r => r.letter === rank);
  const nextRank = currentRankIdx < RANKS.length - 1 ? RANKS[currentRankIdx + 1] : null;

  // Heatmap intensity
  const maxMin = Math.max(...heatmap.map(d => d.minutes), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      {/* ═══ Player Card ═══ */}
      <div className="system-panel p-6 border-white/60 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${rankColor}, ${rankColor}88)`, boxShadow: `0 8px 30px ${rankColor}40` }}
            >
              {state.user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black text-white border-2 border-white shadow-md"
              style={{ background: rankColor }}
            >
              {rank}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-blue-900 truncate">{state.user?.name || 'Player'}</h2>
            <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: rankColor }}>
              {rankTitle}
            </p>

            {/* Level + XP Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Level {level}</span>
                <span className="text-[9px] font-bold text-blue-400">{xpProgress.currentLevelXp} / {xpProgress.nextLevelXp} XP</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-blue-100/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.progress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${rankColor}, ${rankColor}cc)` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">Since {memberSince}</span>
              <span className="text-[8px] font-bold text-blue-300">•</span>
              <span className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">{state.totalXp.toLocaleString()} Total XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Quick Stats ═══ */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Flame size={18} className="text-orange-500" />, value: state.streak, label: 'Streak', suffix: 'd' },
          { icon: <Zap size={18} className="text-purple-500" />, value: `×${(1 + state.momentum * 0.1).toFixed(1)}`, label: 'Momentum', suffix: '' },
          { icon: <BookOpen size={18} className="text-emerald-500" />, value: cardsMastered, label: 'Mastered', suffix: '' },
          { icon: <Clock size={18} className="text-blue-500" />, value: Math.round(totalFocusTime / 3600), label: 'Hours', suffix: 'h' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="system-panel p-3 flex flex-col items-center gap-1 border-white/60"
          >
            {stat.icon}
            <span className="text-lg font-black text-blue-900 leading-none">{stat.value}{stat.suffix}</span>
            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* ═══ Rank Progression ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="system-panel p-5 border-white/60"
      >
        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Shield size={14} className="text-blue-500" /> Rank Progression
        </h3>
        <div className="space-y-2">
          {RANKS.map((r, i) => {
            const isCurrent = r.letter === rank;
            const isPast = i < currentRankIdx;
            const isFuture = i > currentRankIdx;

            return (
              <div
                key={r.letter}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  isCurrent && "bg-white shadow-md border border-white/80 scale-[1.02]",
                  isPast && "opacity-50",
                  isFuture && "opacity-30"
                )}
              >
                {/* Rank Badge */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 transition-all",
                    isCurrent && "shadow-lg scale-110"
                  )}
                  style={{
                    background: isCurrent || isPast ? r.color : '#cbd5e1',
                    boxShadow: isCurrent ? `0 4px 15px ${r.color}40` : 'none',
                  }}
                >
                  {r.letter}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-black truncate", isCurrent ? "text-blue-900" : "text-blue-600")}>{r.title}</span>
                    {isCurrent && (
                      <span className="text-[7px] font-black text-white bg-blue-500 px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>
                    )}
                  </div>
                  <span className="text-[8px] font-bold text-blue-400">
                    Lv. {r.minLevel} — {r.maxLevel}
                  </span>
                </div>

                {/* Status */}
                {isPast && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">✓</span>}
                {isCurrent && <ChevronRight size={14} className="text-blue-400" />}
                {isFuture && <Lock size={12} className="text-blue-200" />}
              </div>
            );
          })}
        </div>

        {nextRank && (
          <div className="mt-4 pt-3 border-t border-blue-50">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Next: Rank {nextRank.letter}</span>
              <span className="text-[9px] font-bold text-blue-400">Level {nextRank.minLevel}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-blue-50 mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((level - currentRankData.minLevel) / (nextRank.minLevel - currentRankData.minLevel)) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                className="h-full rounded-full"
                style={{ background: nextRank.color }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ Study Activity Heatmap ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="system-panel p-5 border-white/60"
      >
        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Flame size={14} className="text-orange-500" /> Study Activity
        </h3>

        {/* Heatmap Grid — 12 weeks × 7 days */}
        <div className="flex gap-[3px]">
          {Array.from({ length: 12 }, (_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const day = heatmap[idx];
                if (!day) return <div key={dayIdx} className="w-[22px] h-[22px]" />;

                const intensity = day.minutes / maxMin;
                let bg = 'bg-blue-50';
                if (day.minutes > 0) {
                  if (intensity > 0.75) bg = 'bg-blue-600';
                  else if (intensity > 0.5) bg = 'bg-blue-400';
                  else if (intensity > 0.25) bg = 'bg-blue-300';
                  else bg = 'bg-blue-200';
                }

                return (
                  <div
                    key={dayIdx}
                    className={cn("w-[22px] h-[22px] rounded-[5px] transition-all hover:scale-125 cursor-default group relative", bg)}
                    title={`${day.date}: ${day.minutes} min, ${day.sessions} sessions`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-blue-900 text-white text-[8px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      {day.date}<br/>{day.minutes}m · {day.sessions}s
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[8px] font-bold text-blue-400 mr-1">Less</span>
          {['bg-blue-50', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-600'].map(c => (
            <div key={c} className={cn("w-3 h-3 rounded-[3px]", c)} />
          ))}
          <span className="text-[8px] font-bold text-blue-400 ml-1">More</span>
        </div>
      </motion.div>

      {/* ═══ Achievements ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="system-panel p-5 border-white/60"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
            <Trophy size={14} className="text-yellow-500" /> Achievements
          </h3>
          <span className="text-[9px] font-black text-blue-400">{unlockedCount}/{achievements.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {achievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.04 }}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all relative overflow-hidden",
                a.unlocked
                  ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm"
                  : "bg-blue-50/30 border-blue-50 opacity-50"
              )}
            >
              {a.unlocked && (
                <div className="absolute top-1 right-1">
                  <span className="text-[7px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-widest">✓</span>
                </div>
              )}
              <div className="text-2xl mb-1">{a.icon}</div>
              <h4 className={cn("text-[10px] font-black uppercase tracking-wider", a.unlocked ? "text-amber-900" : "text-blue-400")}>{a.title}</h4>
              <p className={cn("text-[8px] font-bold mt-0.5 leading-tight", a.unlocked ? "text-amber-700" : "text-blue-300")}>{a.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Danger Zone ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="system-panel p-5 border-red-100/50"
      >
        <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle size={14} /> Danger Zone
        </h3>
        <p className="text-[10px] font-bold text-blue-400 mb-4 leading-relaxed">
          Reset your entire account. All progress, decks, cards, and XP will be permanently deleted.
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 py-3 rounded-2xl border-2 border-red-100 bg-red-50/50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-100 hover:border-red-200 transition-all"
          >
            Reset Account
          </button>
          <button
            onClick={() => signOut()}
            className="flex-1 py-3 rounded-2xl border-2 border-blue-100 bg-blue-50/50 text-blue-500 font-black text-xs uppercase tracking-widest hover:bg-blue-100 hover:border-blue-200 transition-all"
          >
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* ═══ Reset Confirmation Modal ═══ */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
            onClick={e => e.target === e.currentTarget && setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-black text-blue-900 mb-2">Reset Everything?</h3>
                <p className="text-[11px] font-bold text-blue-400 mb-6 leading-relaxed">
                  This will delete all your progress, decks, cards, and XP. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-blue-50 bg-white text-blue-600 font-black text-sm hover:bg-blue-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { resetUser(); setShowResetConfirm(false); }}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all shadow-lg"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
