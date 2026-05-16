import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617] overflow-hidden"
    >
      {/* Background Neural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

      <div className="w-full max-w-lg px-6  space-y-6  overflow-y-auto max-h-screen py-10  relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5   rounded-full border border-white/10 bg-white/5 mb-6  backdrop-blur-xl shadow-2xl"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
            <span className="text-[8px]  font-black text-white/50 uppercase tracking-[0.4em]  italic">Neural Extraction Finalized</span>
          </motion.div>
          <h2 className="text-4xl  font-black text-white tracking-widest uppercase italic leading-none text-shadow-glow">Victory</h2>
          <p className="text-[9px]  font-black text-cyan-400/40 uppercase tracking-[0.3em]  mt-3  italic tabular-nums">{difficulty.toUpperCase()} PROTOCOL COMPLETED</p>
        </motion.div>

        {/* Modular Grid Results */}
        <div className="grid grid-cols-2 gap-4">
           {/* Primary Grade Card */}
           <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="modular-card col-span-2 p-6  flex flex-col  items-center justify-around bg-white/[0.01] gap-8 "
           >
              {/* Accuracy Ring */}
              <div className="relative group">
                <svg width="140" height="140" viewBox="0 0 130 130" className="transform -rotate-90 relative z-10 w-28 h-28  ">
                  <circle cx="65" cy="65" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <motion.circle
                    cx="65" cy="65" r={ringRadius}
                    fill="none" stroke={gradeColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    initial={{ strokeDashoffset: ringCircumference }}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.6 }}
                    style={{ filter: `drop-shadow(0 0 15px ${gradeColor})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 1 }}
                    className="text-4xl  font-black italic tracking-tighter"
                    style={{ color: gradeColor }}
                  >
                    {grade}
                  </motion.span>
                  <span className="text-[8px]  font-black text-white/30 uppercase tracking-widest italic tabular-nums">{accuracy}%</span>
                </div>
              </div>

              <div className="hidden  h-20 w-px bg-white/10" />

              {/* XP Yield */}
              <div className="text-center relative">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic mb-2  block">Neural Yield</span>
                <div className="flex items-center gap-3">
                  <Zap size={24} className=" text-cyan-400 fill-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                  <span className="text-5xl  font-black text-white tabular-nums italic tracking-tighter">+{animatedXp}</span>
                </div>
                {isPersonalBest && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="absolute -bottom-10  left-1/2 -translate-x-1/2 whitespace-nowrap px-3  py-1.5 bg-yellow-400 text-black rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                  >
                    <span className="text-[9px]  font-black uppercase tracking-widest leading-none">NEW RECORD</span>
                  </motion.div>
                )}
              </div>
           </motion.div>

            {/* Detail Cards */}
           {[
            { icon: <Target className="size-3.5  text-emerald-400" />, value: `${correctCount}`, label: 'Fragments' },
            { icon: <Flame className="size-3.5  text-orange-400" />, value: `${bestStreak}×`, label: 'Streak' },
            { icon: <Clock className="size-3.5  text-cyan-400" />, value: `${avgResponseTime.toFixed(1)}s`, label: 'Latency' },
            { icon: <Star className="size-3.5  text-yellow-400" />, value: `${wrongCount}`, label: 'Decay' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="modular-card p-4  bg-white/[0.01]"
            >
              <div className="flex items-center justify-between mb-2 ">
                {s.icon}
                <div className="w-1  h-1  rounded-full bg-white/5 shadow-inner" />
              </div>
              <span className="text-2xl  font-black text-white italic tracking-tighter block mb-0.5  tabular-nums">{s.value}</span>
              <span className="text-[8px]  font-black text-white/20 uppercase tracking-[0.3em]  italic leading-none">{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Level Up */}
        {levelResult.leveledUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 1.2 }}
            className="p-8 rounded-[2rem] bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-400/20 text-center shadow-[0_20px_50px_rgba(34,211,238,0.1)]"
          >
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.6em] italic mb-3 block">Neural Evolution</span>
            <div className="text-4xl font-black italic tracking-tighter text-white">
              Level {levelResult.oldLevel} <span className="text-cyan-400 mx-1">→</span> {levelResult.newLevel}
            </div>
            {levelResult.rankChanged && (
              <p className="text-[11px] font-black text-yellow-400 uppercase tracking-[0.4em] mt-3 italic">
                Rank Evolved: {levelResult.newRank}
              </p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-4 pt-4"
        >
          <button
            onClick={onExit}
            className="flex-1 py-4  rounded-xl  border border-white/10 bg-white/[0.02] text-white/40 font-black text-[9px]  uppercase tracking-[0.4em]  italic hover:bg-white/[0.05] hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Terminal
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4  rounded-xl  bg-white text-black font-black text-[9px]  uppercase tracking-[0.4em]  italic hover:bg-cyan-400 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <RotateCcw className="size-3.5  relative z-10" />
            <span className="relative z-10">Re-Engage</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
