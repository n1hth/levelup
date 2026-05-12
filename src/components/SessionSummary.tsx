import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Star, ArrowUp, Trophy } from 'lucide-react';
import { cn, formatDuration } from '@/src/lib/utils.ts';
import { getRankColor, getRankTitle, type XpCalculation } from '@/src/lib/xp.ts';

interface SessionSummaryProps {
  xpCalc: XpCalculation;
  actualDuration: number;
  pauseCount: number;
  isCompleted: boolean;
  noPauseChallenge: boolean;
  levelResult: { newLevel: number; oldLevel: number; leveledUp: boolean; newRank: string; oldRank: string; rankChanged: boolean };
  onDone: () => void;
}

export function SessionSummary({ 
  xpCalc, 
  actualDuration, 
  pauseCount, 
  isCompleted,
  noPauseChallenge,
  levelResult,
  onDone 
}: SessionSummaryProps) {
  const [animatedXp, setAnimatedXp] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    // Animate XP counter
    const duration = 1500;
    const steps = 60;
    const increment = xpCalc.totalXp / steps;
    let current = 0;
    
    animRef.current = setInterval(() => {
      current += increment;
      if (current >= xpCalc.totalXp) {
        setAnimatedXp(xpCalc.totalXp);
        clearInterval(animRef.current);
        setShowBreakdown(true);
        
        if (levelResult.leveledUp) {
          setTimeout(() => setShowConfetti(true), 300);
        }
      } else {
        setAnimatedXp(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(animRef.current);
  }, [xpCalc.totalXp, levelResult.leveledUp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(20px)' }}
    >
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: `${50 + (Math.random() - 0.5) * 20}%`, 
                y: '-5%', 
                rotate: 0,
                opacity: 1 
              }}
              animate={{ 
                x: `${50 + (Math.random() - 0.5) * 100}%`, 
                y: '110%', 
                rotate: Math.random() * 720,
                opacity: 0 
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                delay: Math.random() * 0.5,
                ease: 'easeOut' 
              }}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                backgroundColor: ['#00d2ff', '#3b82f6', '#fbbf24', '#a855f7', '#ef4444', '#22c55e'][Math.floor(Math.random() * 6)]
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-full max-w-sm system-panel p-8 relative overflow-hidden border-white/30 shadow-[0_0_60px_rgba(0,210,255,0.2)]"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60" />
        <div className="absolute inset-0 aero-gloss opacity-30 pointer-events-none" />

        {/* Title */}
        <div className="text-center mb-6 relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900 rounded-full mb-3"
          >
            <Sparkles size={12} className="text-cyan-400" />
            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">
              {isCompleted ? 'Session Complete' : 'Session Ended'}
            </span>
          </motion.div>
          
          <h2 className="text-lg font-black text-blue-900 tracking-tighter uppercase mb-1">
            {isCompleted ? 'Synchronization Complete' : 'Session Recorded'}
          </h2>
        </div>

        {/* XP Display */}
        <motion.div 
          className="text-center mb-6 relative z-10"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Experience Gained</div>
          <div className="text-5xl font-black text-gradient-system tabular-nums leading-none">
            +{animatedXp}
          </div>
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">XP</div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
          <SummaryStat label="Time" value={formatDuration(actualDuration)} />
          <SummaryStat label="Pauses" value={pauseCount.toString()} />
          <SummaryStat label="Status" value={isCompleted ? '✓ Full' : 'Partial'} />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-5 relative z-10">
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full"
            >
              <Star size={12} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Completed</span>
            </motion.div>
          )}
          {noPauseChallenge && pauseCount === 0 && isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full"
            >
              <Trophy size={12} className="text-purple-500" />
              <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">No-Pause</span>
            </motion.div>
          )}
        </div>

        {/* XP Breakdown */}
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 relative z-10"
            >
              <div className="bg-blue-50/50 rounded-2xl p-4 space-y-2 border border-blue-100/50">
                {xpCalc.breakdown.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[10px] font-bold text-blue-500">{item.label}</span>
                    <span className="text-[10px] font-black text-blue-900">+{item.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Up Alert */}
        {levelResult.leveledUp && showBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-5 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white text-center relative overflow-hidden z-10"
          >
            <div className="absolute inset-0 aero-gloss opacity-20" />
            <div className="flex items-center justify-center gap-2 mb-1">
              <ArrowUp size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Level Up!</span>
            </div>
            <div className="text-2xl font-black">
              Level {levelResult.oldLevel} → Level {levelResult.newLevel}
            </div>
            {levelResult.rankChanged && (
              <div className="mt-2 text-[10px] font-black uppercase tracking-widest">
                <span className="opacity-60">Rank {levelResult.oldRank}</span>
                <span className="mx-2">→</span>
                <span style={{ color: getRankColor(levelResult.newRank) }}>
                  Rank {levelResult.newRank}
                </span>
                <div className="text-[9px] mt-1 opacity-80">{getRankTitle(levelResult.newRank)}</div>
              </div>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <div className="relative z-10">
          <button
            onClick={onDone}
            className="btn-system w-full py-4 text-sm group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Done
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 bg-white/40 rounded-xl border border-white/60">
      <div className="text-xs font-black text-blue-900">{value}</div>
      <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
