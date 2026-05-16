import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Zap, Target, Clock, Flame, ChevronRight, RotateCcw, Star } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';

interface ArenaResultsProps {
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  bestStreak: number;
  avgResponseTime: number;
  xpEarned: number;
  difficulty: string;
  isPersonalBest: boolean;
  levelResult: { oldLevel: number; newLevel: number; leveledUp: boolean; oldRank: string; newRank: string; rankChanged: boolean };
  onPlayAgain: () => void;
  onExit: () => void;
}

export function ArenaResults({
  totalCards, correctCount, wrongCount, bestStreak, avgResponseTime,
  xpEarned, difficulty, isPersonalBest, levelResult,
  onPlayAgain, onExit,
}: ArenaResultsProps) {
  const [animatedXp, setAnimatedXp] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;

  // Animated XP counter
  useEffect(() => {
    if (xpEarned === 0) return;
    const step = Math.max(1, Math.ceil(xpEarned / 40));
    intervalRef.current = setInterval(() => {
      setAnimatedXp(prev => {
        const next = prev + step;
        if (next >= xpEarned) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return xpEarned;
        }
        return next;
      });
    }, 30);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [xpEarned]);

  // Accuracy ring
  const ringRadius = 55;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - accuracy / 100);

  // Grade
  let grade = 'F';
  let gradeColor = '#ef4444';
  if (accuracy >= 95) { grade = 'S'; gradeColor = '#fbbf24'; }
  else if (accuracy >= 85) { grade = 'A'; gradeColor = '#ef4444'; }
  else if (accuracy >= 70) { grade = 'B'; gradeColor = '#a855f7'; }
  else if (accuracy >= 50) { grade = 'C'; gradeColor = '#3b82f6'; }
  else if (accuracy >= 30) { grade = 'D'; gradeColor = '#22c55e'; }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
    >
      <div className="w-full max-w-md px-6 space-y-6 overflow-y-auto max-h-screen py-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-3">
            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.4em]">Arena Complete</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Challenge Over</h2>
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">{difficulty} Mode</p>
        </motion.div>

        {/* XP + Accuracy Ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="flex items-center justify-center gap-8"
        >
          {/* Accuracy Ring */}
          <div className="relative">
            <svg width="130" height="130" viewBox="0 0 130 130" className="transform -rotate-90">
              <circle cx="65" cy="65" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle
                cx="65" cy="65" r={ringRadius}
                fill="none" stroke={gradeColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.6 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 1 }}
                className="text-4xl font-black text-white"
                style={{ color: gradeColor }}
              >
                {grade}
              </motion.span>
              <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">{accuracy}%</span>
            </div>
          </div>

          {/* XP */}
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
              <Zap size={20} className="text-cyan-400 fill-cyan-400/20" />
              <span className="text-4xl font-black text-white tabular-nums">{animatedXp}</span>
            </div>
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">XP Earned</span>
            {isPersonalBest && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 1.5 }}
                className="mt-2 flex items-center gap-1 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full"
              >
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">New Best!</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { icon: <Target size={16} className="text-emerald-400" />, value: `${correctCount}/${totalCards}`, label: 'Correct' },
            { icon: <Flame size={16} className="text-orange-400" />, value: `${bestStreak}×`, label: 'Best Combo' },
            { icon: <Clock size={16} className="text-cyan-400" />, value: `${avgResponseTime.toFixed(1)}s`, label: 'Avg Speed' },
            { icon: <Trophy size={16} className="text-yellow-400" />, value: `${wrongCount}`, label: 'Missed' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"
            >
              <div className="flex justify-center mb-2">{s.icon}</div>
              <span className="text-lg font-black text-white block">{s.value}</span>
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Level Up */}
        {levelResult.leveledUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 1.2 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-center"
          >
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Level Up! {levelResult.oldLevel} → {levelResult.newLevel}</span>
            {levelResult.rankChanged && (
              <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mt-1">
                Rank {levelResult.oldRank} → {levelResult.newRank}
              </p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-3"
        >
          <button
            onClick={onExit}
            className="flex-1 py-4 rounded-2xl border border-white/10 bg-white/5 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <ChevronRight size={16} className="rotate-180" />
            Exit
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Again
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
