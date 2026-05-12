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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8 flex flex-col items-center pb-8"
      >
        {/* Header */}
        <div className="text-center w-full space-y-2">
          <div className="flex justify-center mb-1">
            <div className="px-3 py-1 bg-blue-900 rounded-full flex items-center gap-2 border border-white/10 shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Focus Protocol</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Mana Cultivation</h2>
        </div>

        {/* Timer */}
        <FocusTimer 
          timeLeft={timeLeft} 
          totalTime={totalTime} 
          isActive={isActive && !isPaused}
          isCompleted={timeLeft === 0}
        />

        {/* Controls */}
        <div className="grid grid-cols-4 gap-4 w-full max-w-[320px]">
          <motion.button 
            whileTap={{ scale: 0.9, rotate: -90 }}
            onClick={handleReset}
            disabled={!hasStarted && timeLeft === totalTime}
            className={cn(
              "w-full aspect-square system-panel flex items-center justify-center transition-colors border-white/60",
              (!hasStarted && timeLeft === totalTime) ? "text-blue-200 opacity-50" : "text-blue-400 hover:text-blue-600"
            )}
          >
            <RotateCcw size={24} />
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={isActive && !isPaused ? handlePause : handleStart}
            disabled={noPauseChallenge && isPaused}
            className={cn(
              "col-span-2 btn-system text-base relative overflow-hidden transition-all duration-700",
              isActive && !isPaused
                ? "bg-gradient-to-r from-blue-950 to-blue-900 border-blue-900 shadow-[0_0_40px_rgba(30,58,138,0.5)]" 
                : "shadow-[0_15px_40px_rgba(59,130,246,0.4)]"
            )}
          >
            <div className="absolute inset-0 aero-gloss opacity-20" />
            <AnimatePresence mode="wait">
              {isActive && !isPaused ? (
                <motion.div 
                  key="pause" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-3"
                >
                  <Pause size={18} fill="white" />
                  <span className="tracking-[0.2em] font-black uppercase text-sm">Suspend</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-3"
                >
                  <Play size={18} fill="white" />
                  <span className="tracking-[0.2em] font-black uppercase text-sm">
                    {isPaused ? 'Resume' : 'Initiate'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <button 
            onClick={() => !hasStarted && setNoPauseChallenge(!noPauseChallenge)}
            disabled={hasStarted}
            className={cn(
              "w-full aspect-square system-panel flex items-center justify-center transition-all border-white/60",
              noPauseChallenge ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]" : "text-blue-400 opacity-50"
            )}
          >
            <Shield size={24} className={noPauseChallenge ? "animate-pulse" : ""} />
          </button>
        </div>

        {/* Presets */}
        <div className="w-full max-w-[320px] space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <TimerIcon size={12} /> Time Presets
            </span>
            <button 
              onClick={() => !hasStarted && setShowCustomInput(!showCustomInput)}
              disabled={hasStarted}
              className="text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest transition-colors disabled:opacity-30"
            >
              Custom
            </button>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => handleSelectPreset(mins)}
                disabled={hasStarted}
                className={cn(
                  "py-3 rounded-xl font-black text-[10px] transition-all border",
                  selectedMinutes === mins
                    ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white/40 border-white/60 text-blue-900 hover:bg-white/60"
                )}
              >
                {mins}m
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showCustomInput && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pt-2"
              >
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="5"
                    max="180"
                    placeholder="Enter minutes..."
                    className="flex-1 bg-white/40 border border-white/60 rounded-xl px-4 py-3 text-[10px] font-black text-blue-900 outline-none focus:border-blue-400"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                  />
                  <button
                    onClick={handleCustomSubmit}
                    className="px-6 py-3 bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Set
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ambient Selector */}
        <AmbientSelector 
          selected={soundscape} 
          onSelect={setSoundscape} 
          disabled={isActive && !isPaused}
        />

        {/* Stats Toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] hover:text-blue-600 transition-colors"
        >
          {showStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>

        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
            >
              <FocusStats />
            </motion.div>
          )}
        </AnimatePresence>
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
