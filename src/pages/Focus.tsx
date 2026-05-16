import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';
import { useApp } from '@/src/lib/store.tsx';
import { calculateFocusXp } from '@/src/lib/xp.ts';
import { FocusTimer } from '@/src/components/FocusTimer.tsx';
import { AmbientSelector, type SoundId } from '@/src/components/AmbientSelector.tsx';
import { FocusStats } from '@/src/components/FocusStats.tsx';
import { SessionSummary } from '@/src/components/SessionSummary.tsx';

const PRESETS = [15, 25, 45, 60, 90];

export function Focus() {
  const { state, addXp, addFocusSession } = useApp();
  
  // Timer state
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [soundscape, setSoundscape] = useState<SoundId>('none');
  const [noPauseChallenge, setNoPauseChallenge] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showStats, setShowStats] = useState(false);
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const pauseStartRef = useRef<number | null>(null);
  
  // Summary state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    xpCalc: ReturnType<typeof calculateFocusXp>;
    actualDuration: number;
    pauseCount: number;
    isCompleted: boolean;
    noPauseChallenge: boolean;
    levelResult: any;
  } | null>(null);

  const totalTime = selectedMinutes * 60;
  const hasStarted = isActive || isPaused;

  const handleSessionEnd = useCallback(async (completed: boolean) => {
    setIsActive(false);
    setIsPaused(false);
    
    const now = Date.now();
    let actualFocusTime: number;
    
    if (sessionStartTime) {
      const elapsed = (now - sessionStartTime) / 1000;
      const paused = totalPausedTime / 1000 + (pauseStartRef.current ? (now - pauseStartRef.current) / 1000 : 0);
      actualFocusTime = Math.round(elapsed - paused);
    } else {
      actualFocusTime = totalTime - timeLeft;
    }

    // Minimum 60 seconds to get XP
    if (actualFocusTime < 60) {
      setTimeLeft(selectedMinutes * 60);
      setPauseCount(0);
      setTotalPausedTime(0);
      setSessionStartTime(null);
      return;
    }

    const xpCalc = calculateFocusXp(
      totalTime,
      actualFocusTime,
      pauseCount,
      completed,
      state.momentum,
      noPauseChallenge
    );

    const levelResult = await addXp(xpCalc.totalXp);

    await addFocusSession({
      plannedDuration: totalTime,
      actualDuration: actualFocusTime,
      pauseCount,
      xpEarned: xpCalc.totalXp,
      completedAt: new Date().toISOString(),
      isCompleted: completed,
      noPauseChallenge,
    });

    setSummaryData({
      xpCalc,
      actualDuration: actualFocusTime,
      pauseCount,
      isCompleted: completed,
      noPauseChallenge,
      levelResult,
    });
    setShowSummary(true);
  }, [sessionStartTime, totalPausedTime, pauseCount, totalTime, timeLeft, selectedMinutes, state.momentum, noPauseChallenge, addXp, addFocusSession]);

  const handleStart = useCallback(() => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      if (pauseStartRef.current) {
        setTotalPausedTime(prev => prev + (Date.now() - pauseStartRef.current!));
        pauseStartRef.current = null;
      }
      return;
    }
    
    setIsActive(true);
    setIsPaused(false);
    setPauseCount(0);
    setTotalPausedTime(0);
    setSessionStartTime(Date.now());
    pauseStartRef.current = null;
  }, [isPaused]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    setPauseCount(prev => prev + 1);
    pauseStartRef.current = Date.now();
  }, []);

  const handleReset = useCallback(() => {
    if (hasStarted && timeLeft < totalTime) {
      // End partial session
      handleSessionEnd(false);
    } else {
      setTimeLeft(selectedMinutes * 60);
      setIsActive(false);
      setIsPaused(false);
      setPauseCount(0);
      setTotalPausedTime(0);
      setSessionStartTime(null);
    }
  }, [hasStarted, timeLeft, totalTime, selectedMinutes, handleSessionEnd]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  // Handle auto-end when timer hits zero
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      handleSessionEnd(true);
    }
  }, [timeLeft, isActive, handleSessionEnd]);

  const handleSummaryDone = useCallback(() => {
    setShowSummary(false);
    setSummaryData(null);
    setTimeLeft(selectedMinutes * 60);
    setPauseCount(0);
    setTotalPausedTime(0);
    setSessionStartTime(null);
  }, [selectedMinutes]);

  const handleSelectPreset = useCallback((mins: number) => {
    if (!hasStarted) {
      setSelectedMinutes(mins);
      setTimeLeft(mins * 60);
      setShowCustomInput(false);
    }
  }, [hasStarted]);

  const handleCustomSubmit = useCallback(() => {
    const mins = parseInt(customMinutes);
    if (mins >= 5 && mins <= 180) {
      setSelectedMinutes(mins);
      setTimeLeft(mins * 60);
      setShowCustomInput(false);
      setCustomMinutes('');
    }
  }, [customMinutes]);

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
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <>
      {/* Scanline & HUD Overlay when active */}
      <AnimatePresence>
        {isActive && !isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[60] overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(34,211,238,0.02),rgba(34,211,238,0.01),rgba(34,211,238,0.02))] bg-[length:100%_4px,3px_100%] opacity-30" />
            <motion.div 
              animate={{ y: ["-10%", "110%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-12 flex flex-col items-center pb-20 relative max-w-lg mx-auto"
      >
        {/* Header HUD - More Minimal */}
        <motion.div variants={itemVariants} className="w-full pt-4">
           <div className="flex flex-col items-center">
              <span className="text-[7px]  font-black text-cyan-400/30 uppercase tracking-[0.6em]  italic mb-1">CORTEX PROTOCOL v4.2</span>
              <h2 className="text-3xl  font-black text-white tracking-widest uppercase italic leading-none flex items-center gap-1">
                DEEP<span className="text-cyan-400">PULSE</span>
              </h2>
           </div>
        </motion.div>

        {/* Main Interface Area */}
        <div className="flex flex-col items-center gap-12 w-full px-4">
          
          {/* Central focus zone - Removed outer panel for airier feel */}
          <motion.div 
            variants={itemVariants} 
            className="relative flex items-center justify-center py-4"
          >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)] pointer-events-none" />
            <FocusTimer 
              timeLeft={timeLeft} 
              totalTime={totalTime} 
              isActive={isActive && !isPaused}
              isCompleted={timeLeft === 0}
            />
          </motion.div>

          {/* Unified Control Cluster */}
          <div className="w-full space-y-6">
            
            {/* Selection HUD */}
            <motion.div variants={itemVariants} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] italic">Configuration</span>
                 </div>
                 <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <span className="text-[8px] font-black text-cyan-400 tabular-nums uppercase tracking-widest">{selectedMinutes}:00 TARGET</span>
                 </div>
              </div>

              {/* Presets - More elegant pill shape */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                {PRESETS.map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSelectPreset(mins)}
                    disabled={hasStarted}
                    className={cn(
                      "flex-1 min-w-[60px] py-2.5 rounded-full font-black text-[10px] transition-all border italic tracking-tighter uppercase shrink-0",
                      selectedMinutes === mins
                        ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                        : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40 hover:bg-white/[0.05]"
                    )}
                  >
                    {mins}M
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Primary Action Zone */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 w-full">
              {/* Security Toggle - Integrated into action bar */}
              <button 
                onClick={() => !hasStarted && setNoPauseChallenge(!noPauseChallenge)}
                disabled={hasStarted}
                className={cn(
                  "h-14  px-6 rounded-2xl  flex flex-col items-center justify-center transition-all border gap-1 min-w-[70px] active:scale-95",
                  noPauseChallenge 
                    ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400" 
                    : "bg-white/[0.01] border-white/5 text-white/10 hover:text-white/20"
                )}
              >
                <Shield size={16} className={noPauseChallenge ? "animate-pulse" : "opacity-30"} />
                <span className="text-[6px] font-black uppercase tracking-widest">{noPauseChallenge ? "LOCKED" : "GUARD"}</span>
              </button>

              <div className="flex-1 flex gap-2 h-14 ">
                <button 
                  onClick={isActive && !isPaused ? handlePause : handleStart}
                  disabled={noPauseChallenge && isPaused}
                  className={cn(
                    "flex-1 rounded-2xl  border transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden active:scale-95 group",
                    isActive && !isPaused
                      ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.15)]" 
                      : "bg-white text-black border-transparent hover:bg-cyan-400 transition-colors"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isActive && !isPaused ? (
                      <motion.div 
                        key="pause" 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                      >
                        <Pause size={18} fill="currentColor" />
                        <span className="tracking-[0.4em] font-black uppercase text-[10px] italic">Abort Sync</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="start"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                      >
                        <Play size={18} fill={isPaused ? "none" : "currentColor"} className="transition-transform group-hover:scale-110" />
                        <span className="tracking-[0.4em] font-black uppercase text-[10px] italic">
                          {isPaused ? 'Resume Link' : 'Engage'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <button 
                  onClick={handleReset}
                  disabled={!hasStarted && timeLeft === totalTime}
                  className={cn(
                    "w-14  rounded-2xl  flex items-center justify-center transition-all border bg-white/[0.02] active:scale-95",
                    (!hasStarted && timeLeft === totalTime) ? "text-white/5 border-white/5" : "text-white/30 border-white/10 hover:text-cyan-400 hover:border-cyan-400/20"
                  )}
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ambient & Stats Secondary Area */}
        <div className="w-full flex flex-col gap-10 mt-4 px-4">
          <motion.div variants={itemVariants} className="space-y-4">
             <div className="flex items-center justify-center gap-4 px-4 opacity-30">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <span className="text-[8px] font-black uppercase tracking-[0.5em] italic">Peripheral Systems</span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
             </div>
             
             <div className="grid grid-cols-1 gap-6">
                <AmbientSelector 
                  selected={soundscape} 
                  onSelect={setSoundscape} 
                  disabled={isActive && !isPaused}
                />
                <FocusStats />
             </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Session Summary Overlay */}
      <AnimatePresence>
        {showSummary && summaryData && (
          <SessionSummary
            xpCalc={summaryData.xpCalc}
            actualDuration={summaryData.actualDuration}
            pauseCount={summaryData.pauseCount}
            isCompleted={summaryData.isCompleted}
            noPauseChallenge={summaryData.noPauseChallenge}
            levelResult={summaryData.levelResult}
            onDone={handleSummaryDone}
          />
        )}
      </AnimatePresence>
    </>
  );
}
