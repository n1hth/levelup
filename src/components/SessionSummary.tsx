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
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(20px)' }}
    >
      {/* Background Neural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.1),transparent_70%)] pointer-events-none" />
      
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
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
              className="absolute w-2 h-2 rounded-sm shadow-[0_0_10px_currentColor]"
              style={{
                backgroundColor: ['#00d2ff', '#3b82f6', '#fbbf24', '#a855f7', '#ef4444', '#22c55e'][Math.floor(Math.random() * 6)],
                color: ['#00d2ff', '#3b82f6', '#fbbf24', '#a855f7', '#ef4444', '#22c55e'][Math.floor(Math.random() * 6)]
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-full max-w-sm bg-white/[0.03] border border-white/10 p-8 rounded-[3rem] relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
      >
        {/* Decorative lines */}
        <div className="absolute top-8 left-12 right-12 flex justify-between items-center opacity-30">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-white mx-4" />
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white" />
        </div>

        {/* Title */}
        <div className="text-center mb-8 relative z-10 pt-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 mb-4"
          >
            <Sparkles size={12} className="text-cyan-400" />
            <span className="text-[8px] font-black text-white uppercase tracking-[0.4em] italic">
              {isCompleted ? 'Transmission Received' : 'Partial Sync'}
            </span>
          </motion.div>
          
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-1">
            {isCompleted ? 'SYNCED' : 'RECORDED'}
          </h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Neural Map Updated</p>
        </div>

        {/* XP Display */}
        <motion.div 
          className="text-center mb-10 relative z-10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] italic mb-3">Total Yield</div>
          <div className="text-6xl font-black text-white tabular-nums leading-none tracking-tighter italic">
            +{animatedXp}
          </div>
          <div className="text-[12px] font-black text-white/20 uppercase tracking-[0.6em] mt-3 italic">XP UNLOCKED</div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
          <SummaryStat label="Access" value={formatDuration(actualDuration)} />
          <SummaryStat label="Interr" value={pauseCount.toString()} />
          <SummaryStat label="Depth" value={isCompleted ? 'Full' : 'Part'} />
        </div>

        {/* XP Breakdown */}
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 relative z-10"
            >
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-3">
                {xpCalc.breakdown.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">{item.label}</span>
                    <span className="text-[11px] font-black text-cyan-400 italic">+{item.value} XP</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Up Alert */}
        {levelResult.leveledUp && showBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="mb-10 p-8 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-[2rem] border border-cyan-400/30 text-white text-center relative overflow-hidden z-10 shadow-[0_10px_40px_rgba(34,211,238,0.2)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent)]" />
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-[1px] w-8 bg-cyan-400/40" />
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400 italic">Level Up</span>
              <div className="h-[1px] w-8 bg-cyan-400/40" />
            </div>
            <div className="text-4xl font-black italic tracking-tighter mb-4">
              {levelResult.oldLevel} <span className="text-cyan-400 mx-2">→</span> {levelResult.newLevel}
            </div>
            {levelResult.rankChanged && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic mb-1">Neural Rank Evolved</p>
                <div className="text-xl font-black italic tracking-widest uppercase" style={{ color: getRankColor(levelResult.newRank) }}>
                  {getRankTitle(levelResult.newRank)}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <div className="relative z-10">
          <button
            onClick={onDone}
            className="w-full py-6 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.6em] italic hover:bg-cyan-400 hover:text-white transition-all shadow-2xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              Exit Terminal
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
    <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
      <div className="text-[12px] font-black text-white italic tracking-widest">{value}</div>
      <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mt-1 italic">{label}</div>
    </div>
  );
}
