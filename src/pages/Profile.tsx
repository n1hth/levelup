import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Flame, BookOpen, Clock, ChevronRight, AlertTriangle, Trophy, Lock, Shield, Activity } from 'lucide-react';
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
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-8"
    >
      {/* ═══ Player Card ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-8 border-white/5 shadow-2xl relative overflow-hidden bg-white/[0.01]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          {/* Avatar */}
          <div className="relative group cursor-pointer">
            <motion.div
              animate={{ 
                boxShadow: [`0 0 20px ${rankColor}30`, `0 0 40px ${rankColor}60`, `0 0 20px ${rankColor}30`]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-white border-2 border-white/10 transition-transform group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${rankColor}44, #000)` }}
            >
              {state.user?.name?.charAt(0).toUpperCase() || '?'}
            </motion.div>
            <div
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-black text-black border-[4px] border-black shadow-xl italic"
              style={{ background: rankColor }}
            >
              {rank}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 w-full">
            <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">{state.user?.name || 'V-HUNTER'}</h2>
            <div className="flex items-center justify-center gap-3 mt-4">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] italic" style={{ color: rankColor }}>
                 {rankTitle.split(' ')[0]} <span className="text-white opacity-40">{rankTitle.split(' ')[1]}</span>
               </span>
            </div>

            {/* Level + XP Bar */}
            <div className="mt-8 px-4 max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] italic">Core Lvl {level}</span>
                <span className="text-[11px] font-black text-white italic tabular-nums">{xpProgress.currentLevelXp} <span className="text-white/10">/</span> {xpProgress.nextLevelXp} <span className="text-[8px] opacity-40 ml-1">XP</span></span>
              </div>
              <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.progress * 100}%` }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  className="h-full rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  style={{ background: rankColor }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="px-3 py-1 bg-white/[0.03] rounded-lg border border-white/5">
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Node Member since <span className="text-cyan-400/60">{memberSince}</span></span>
              </div>
              <div className="px-3 py-1 bg-white/[0.03] rounded-lg border border-white/5">
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">{state.totalXp.toLocaleString()} Total Load</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Quick Stats ═══ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {[
          { icon: <Flame size={20} className="text-orange-500" />, value: state.streak, label: 'Persistence', suffix: 'D' },
          { icon: <Zap size={20} className="text-cyan-400" />, value: `×${(1 + state.momentum * 0.1).toFixed(1)}`, label: 'Velocity', suffix: '' },
          { icon: <BookOpen size={20} className="text-emerald-400" />, value: cardsMastered, label: 'Mastery', suffix: '' },
          { icon: <Clock size={20} className="text-blue-400" />, value: Math.round(totalFocusTime / 3600), label: 'ActiveTime', suffix: 'H' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="system-panel p-5 flex items-center gap-4 border-white/5 bg-white/[0.015] hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
               {stat.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white leading-none italic tracking-tighter tabular-nums">{stat.value}{stat.suffix}</span>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">{stat.label}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ═══ Rank Progression ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-8 border-white/5 bg-white/[0.01]">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
          <Shield size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" /> Hierarchical Status
        </h3>
        <div className="space-y-3">
          {RANKS.map((r, i) => {
            const isCurrent = r.letter === rank;
            const isPast = i < currentRankIdx;
            const isFuture = i > currentRankIdx;

            return (
              <div
                key={r.letter}
                className={cn(
                  "flex items-center gap-5 px-5 py-4 rounded-3xl transition-all relative overflow-hidden group border",
                  isCurrent ? "bg-cyan-500/[0.03] border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.05)] scale-[1.02]" : "bg-white/[0.02] border-white/5",
                  isPast && "opacity-40",
                  isFuture && "opacity-20 translate-x-2"
                )}
              >
                {/* Rank Badge */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-black shrink-0 transition-all italic border-4 border-black/80",
                    isCurrent && "shadow-2xl scale-110"
                  )}
                  style={{
                    background: isCurrent || isPast ? r.color : '#222',
                  }}
                >
                  {r.letter}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-black uppercase italic tracking-tighter", isCurrent ? "text-cyan-400" : "text-white")}>{r.title}</span>
                    {isCurrent && (
                      <span className="text-[8px] font-black text-black bg-cyan-400 px-2 py-0.5 rounded-full uppercase tracking-widest italic animate-pulse">Synced</span>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-white/30 italic uppercase tracking-widest mt-1 block">
                    Lv. {r.minLevel} <span className="mx-1 opacity-20">—</span> {r.maxLevel}
                  </span>
                </div>

                {/* Status */}
                {isPast && <span className="text-emerald-400 font-black italic text-xs">COMPLETE</span>}
                {isCurrent && <ChevronRight size={18} className="text-cyan-400 animate-pulse" />}
                {isFuture && <Lock size={14} className="text-white/10" />}
              </div>
            );
          })}
        </div>

        {nextRank && (
          <div className="mt-10 pt-6 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">Next Calibration: {nextRank.letter}</span>
              <span className="text-[10px] font-black text-cyan-400 italic">Lv. {nextRank.minLevel}</span>
            </div>
            <div className="w-full h-[2px] bg-white/[0.03] mt-3 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((level - currentRankData.minLevel) / (nextRank.minLevel - currentRankData.minLevel)) * 100, 100)}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                className="h-full rounded-full"
                style={{ background: nextRank.color }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ Study Activity Heatmap ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-8 border-white/5 bg-white/[0.01]">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
          <Activity size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" /> Synchronization Density
        </h3>

        {/* Heatmap Grid — 12 weeks × 7 days */}
        <div className="flex gap-[4px] justify-center overflow-x-auto no-scrollbar pb-2">
          {Array.from({ length: 12 }, (_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[4px] shrink-0">
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const day = heatmap[idx];
                if (!day) return <div key={dayIdx} className="w-[20px] h-[20px] bg-white/[0.02] rounded-[4px]" />;

                const intensity = day.minutes / maxMin;
                let bg = 'bg-white/[0.02]';
                let shadow = 'none';
                if (day.minutes > 0) {
                  if (intensity > 0.75) { bg = 'bg-cyan-400'; shadow = '0 0 10px rgba(34,211,238,0.6)'; }
                  else if (intensity > 0.5) { bg = 'bg-cyan-500'; shadow = '0 0 6px rgba(34,211,238,0.4)'; }
                  else if (intensity > 0.25) { bg = 'bg-cyan-600'; shadow = '0 0 4px rgba(34,211,238,0.2)'; }
                  else { bg = 'bg-cyan-900/50'; }
                }

                return (
                  <motion.div
                    key={dayIdx}
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    className={cn("w-[20px] h-[20px] rounded-[4px] transition-all cursor-crosshair group relative", bg)}
                    style={{ boxShadow: shadow }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-black border border-white/10 text-white text-[9px] font-black rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-xl italic">
                      {day.date}<br/>
                      <span className="text-cyan-400">{day.minutes}M SYNCED</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-8">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic mr-2">Core Stability</span>
          {['bg-white/5', 'bg-cyan-900/50', 'bg-cyan-600', 'bg-cyan-500', 'bg-cyan-400'].map(c => (
            <div key={c} className={cn("w-2.5 h-2.5 rounded-[2px]", c)} />
          ))}
        </div>
      </motion.div>

      {/* ═══ Achievements ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-8 border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-3 italic">
            <Trophy size={16} className="text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]" /> Commendations
          </h3>
          <span className="text-[10px] font-black text-white/20 italic tabular-nums">{unlockedCount} <span className="text-white/5 mx-1">/</span> {achievements.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {achievements.map((a, i) => (
            <div
              key={a.id}
              className={cn(
                "p-5 rounded-3xl border transition-all relative overflow-hidden group",
                a.unlocked
                  ? "bg-white/[0.03] border-cyan-500/20 shadow-2xl"
                  : "bg-white/[0.01] border-white/5 opacity-30 grayscale"
              )}
            >
              {a.unlocked && (
                <div className="absolute top-2 right-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
                </div>
              )}
              <div className="text-3xl mb-3 group-hover:scale-125 transition-transform duration-500 inline-block">{a.icon}</div>
              <h4 className={cn("text-[11px] font-black uppercase italic tracking-tighter", a.unlocked ? "text-white" : "text-white/30")}>{a.title}</h4>
              <p className={cn("text-[9px] font-black mt-2 leading-relaxed uppercase tracking-wider italic", a.unlocked ? "text-white/40" : "text-white/10")}>{a.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Danger Zone ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-8 border-red-500/10 bg-red-500/[0.01]">
        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-3 italic">
          <AlertTriangle size={16} className="animate-pulse" /> Critical Access
        </h3>
        <p className="text-[10px] font-black text-white/20 mb-8 leading-relaxed uppercase tracking-widest italic">
          System wipe requested. All neural progress, fragment decks, and XP loads will be purged from the core. This is irreversible.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="py-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-red-500/10 hover:border-red-500/40 transition-all shadow-2xl"
          >
            PURGE CORE
          </button>
          <button
            onClick={() => signOut()}
            className="py-4 rounded-2xl border border-white/5 bg-white/[0.03] text-white/60 font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-white/[0.05] hover:text-white transition-all shadow-2xl"
          >
            DISCONNECT
          </button>
        </div>
      </motion.div>

      {/* ═══ Reset Confirmation Modal ═══ */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/90 backdrop-blur-2xl"
            onClick={e => e.target === e.currentTarget && setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="system-panel p-10 max-w-sm w-full shadow-2xl border-red-500/30 bg-black relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent pointer-events-none" />
              <div className="text-center relative z-10">
                <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <AlertTriangle size={40} className="text-red-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4">Total System Purge?</h3>
                <p className="text-[10px] font-black text-white/30 mb-10 leading-relaxed uppercase tracking-[0.2em] italic">
                  Requested core reset. All neural fragments and xp loads will be permanently deleted from the interface.
                </p>
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                <button
                  onClick={() => { resetUser(); setShowResetConfirm(false); }}
                  className="w-full py-5 rounded-2xl bg-red-500 text-black font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-red-400 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                >
                  CONFIRM PURGE
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-5 rounded-2xl border border-white/10 bg-white/[0.05] text-white/60 font-black text-[11px] uppercase tracking-[0.3em] italic hover:text-white transition-all shadow-2xl mt-2"
                >
                  ABORT SEQUENCE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
