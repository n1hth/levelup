import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, X, Flame, ChevronRight } from 'lucide-react';
import { useApp, type ArenaDifficulty } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { ArenaResults } from '@/src/components/ArenaResults.tsx';

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const TIME_LIMITS: Record<ArenaDifficulty, number> = {
  blitz: 15,
  standard: 30,
  marathon: 60,
};

const BASE_CORRECT_XP = 15;
const SPEED_BONUS_XP = 5;

function getComboMultiplier(streak: number): number {
  if (streak >= 8) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

type Phase = 'countdown' | 'question' | 'reveal' | 'results';

// ═══════════════════════════════════════════════
// ARENA SESSION PAGE
// ═══════════════════════════════════════════════

export function ArenaPlay() {
  const navigate = useNavigate();
  const { deckId, difficulty } = useParams<{ deckId: string; difficulty: string }>();
  const { state, getDeckCards, addXp, reviewCard, addArenaSession, getDeckArenaHistory } = useApp();

  const diff = (difficulty || 'standard') as ArenaDifficulty;
  const timeLimit = TIME_LIMITS[diff] || 30;

  // Get and shuffle cards
  const allCards = getDeckCards(deckId || '');
  const [shuffledCards] = useState(() => [...allCards].sort(() => Math.random() - 0.5));

  const deck = state.decks.find(d => d.id === deckId);

  // Game state
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdownValue, setCountdownValue] = useState(3);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardTimeLeft, setCardTimeLeft] = useState(timeLimit);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // Results state
  const [levelResult, setLevelResult] = useState<any | null>(null);
  const [finalArenaXp, setFinalArenaXp] = useState(0);

  const cardStartTimeRef = useRef(Date.now());
  const isProcessingRef = useRef(false);

  // ── Countdown ──
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownValue <= 0) {
      setPhase('question');
      cardStartTimeRef.current = Date.now();
      return;
    }
    const t = setTimeout(() => setCountdownValue(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownValue]);

  // ── Card Timer ──
  useEffect(() => {
    if (phase !== 'question') return;
    if (cardTimeLeft <= 0) {
      // Time's up — auto wrong
      handleGrade(false);
      return;
    }
    const t = setTimeout(() => setCardTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, cardTimeLeft]);

  const handleReveal = useCallback(() => {
    if (phase === 'question') {
      setPhase('reveal');
    }
  }, [phase]);

  const handleGrade = useCallback(async (correct: boolean) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const currentCard = shuffledCards[currentCardIndex];
    if (!currentCard) {
      isProcessingRef.current = false;
      return;
    }

    const responseTime = (Date.now() - cardStartTimeRef.current) / 1000;
    setResponseTimes(prev => [...prev, responseTime]);

    // Apply SM-2
    reviewCard(currentCard.id, correct ? 2 : 0); // Good or Again

    let xpGain = 0;
    let newStreak = currentStreak;

    if (correct) {
      newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setCorrectCount(prev => prev + 1);

      // Calculate XP
      const multiplier = getComboMultiplier(newStreak);
      xpGain = Math.round(BASE_CORRECT_XP * multiplier);
      const halfTime = timeLimit / 2;
      if (responseTime < halfTime) xpGain += SPEED_BONUS_XP;

      setTotalXpEarned(prev => prev + xpGain);
      setLastXpGain(xpGain);

      // Show combo notification
      if (newStreak >= 3) {
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 800);
      }
    } else {
      newStreak = 0;
      setCurrentStreak(0);
      setWrongCount(prev => prev + 1);
      setLastXpGain(0);
    }

    // Next card or end
    if (currentCardIndex + 1 >= shuffledCards.length) {
      // Arena complete
      const finalCorrect = correct ? correctCount + 1 : correctCount;
      const finalWrong = correct ? wrongCount : wrongCount + 1;
      const finalBestStreak = correct && newStreak > bestStreak ? newStreak : bestStreak;
      const finalXp = totalXpEarned + xpGain;
      const allTimes = [...responseTimes, responseTime];
      const avgTime = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;

      // Award XP
      const result = await addXp(finalXp);
      setLevelResult(result);
      setFinalArenaXp(finalXp);

      // Save session
      await addArenaSession({
        deckId: deckId || '',
        difficulty: diff,
        totalCards: shuffledCards.length,
        correctCount: finalCorrect,
        wrongCount: finalWrong,
        avgResponseTime: Math.round(avgTime * 10) / 10,
        bestStreak: finalBestStreak,
        xpEarned: finalXp,
        completedAt: new Date().toISOString(),
      });

      setPhase('results');
    } else {
      // Next card
      setCurrentCardIndex(prev => prev + 1);
      setCardTimeLeft(timeLimit);
      setPhase('question');
      cardStartTimeRef.current = Date.now();
      isProcessingRef.current = false;
    }
  }, [currentCardIndex, shuffledCards, currentStreak, bestStreak, correctCount, wrongCount, totalXpEarned, responseTimes, timeLimit, diff, deckId, reviewCard, addXp, addArenaSession]);

  const currentCard = shuffledCards[currentCardIndex];

  // Check personal best
  const history = getDeckArenaHistory(deckId || '');
  const previousBest = history.length > 0
    ? Math.max(...history.filter(h => h.difficulty === diff).map(h => h.xpEarned))
    : 0;

  // Timer ring
  const timerProgress = cardTimeLeft / timeLimit;
  const timerRadius = 44;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerOffset = timerCircumference * (1 - timerProgress);

  // ── No cards guard ──
  if (shuffledCards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-blue-400 font-bold">This deck has no cards.</p>
        <button onClick={() => navigate('/arenas')} className="mt-4 btn-system text-xs">Back to Arenas</button>
      </div>
    );
  }

  const handleResetGame = useCallback(() => {
    setPhase('countdown');
    setCountdownValue(3);
    setCurrentCardIndex(0);
    setCardTimeLeft(timeLimit);
    setCurrentStreak(0);
    setBestStreak(0);
    setTotalXpEarned(0);
    setCorrectCount(0);
    setWrongCount(0);
    setResponseTimes([]);
    setLastXpGain(0);
    setShowCombo(false);
    setLevelResult(null);
    setFinalArenaXp(0);
    cardStartTimeRef.current = Date.now();
  }, [timeLimit]);

  // ── Results ──
  if (phase === 'results' && levelResult) {
    const allTimes = responseTimes;
    const avgTime = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
    return (
      <ArenaResults
        totalCards={shuffledCards.length}
        correctCount={correctCount}
        wrongCount={wrongCount}
        bestStreak={bestStreak}
        avgResponseTime={avgTime}
        xpEarned={finalArenaXp}
        difficulty={diff}
        isPersonalBest={finalArenaXp > previousBest && previousBest > 0}
        levelResult={levelResult}
        onPlayAgain={handleResetGame}
        onExit={() => navigate('/battle')}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[140] flex flex-col bg-[#020617] overflow-hidden font-sans">
      {/* Background Neural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
      
      {/* ═══ Countdown ═══ */}
      <AnimatePresence mode="wait">
        {phase === 'countdown' ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
            className="flex-1 flex flex-col items-center justify-center relative z-10"
          >
            <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 mb-8 backdrop-blur-xl">
               <span className="text-[9px] font-black tracking-[0.5em] text-cyan-400 uppercase italic">Preparing Session...</span>
            </div>
            <motion.span
              key={countdownValue}
              initial={{ scale: 3, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-[12rem] font-black text-white italic leading-none"
              style={{ textShadow: '0 0 100px rgba(34,211,238,0.5)' }}
            >
              {countdownValue > 0 ? countdownValue : 'START'}
            </motion.span>
          </motion.div>
        ) : (phase === 'question' || phase === 'reveal') && currentCard ? (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col relative z-10"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-10 pt-10 pb-6">
              <button 
                onClick={() => navigate('/battle')} 
                className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all group shadow-2xl backdrop-blur-xl"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform" />
              </button>

              <div className="flex flex-col items-center">
                 <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 mb-3">
                    <span className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.4em] italic text-shadow-glow">
                      CARD {currentCardIndex + 1} <span className="text-white/20">/</span> {shuffledCards.length}
                    </span>
                 </div>
                <div className="flex items-center gap-6">
                  {currentStreak >= 2 && (
                    <motion.div
                      initial={{ scale: 0, x: -20 }} animate={{ scale: 1, x: 0 }}
                      className="flex items-center gap-3 px-4 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-lg shadow-orange-500/5"
                    >
                      <Flame size={14} className="text-orange-400 animate-pulse" />
                      <span className="text-[11px] font-black text-orange-400 italic tracking-widest">{currentStreak} STREAK</span>
                    </motion.div>
                  )}
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-cyan-400 fill-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                    <span className="text-2xl font-black text-white italic tabular-nums tracking-widest">+{totalXpEarned} <span className="text-white/20">XP</span></span>
                  </div>
                </div>
              </div>

              <div className="w-16 h-16" /> {/* Spacer */}
            </div>

            {/* Progress bar */}
            <div className="px-10 mb-10">
              <div className="w-full h-1.5 rounded-full bg-white/[0.02] overflow-hidden border border-white/5 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentCardIndex + 1) / shuffledCards.length) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                  transition={{ duration: 0.5, ease: "circOut" }}
                />
              </div>
            </div>

            {/* Card area */}
            <div className="flex-1 flex flex-col items-center justify-center px-10 relative pb-16">
              {/* Combo flash */}
              <AnimatePresence>
                {showCombo && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, y: 0 }}
                    animate={{ scale: 1, opacity: 1, y: -120 }}
                    exit={{ scale: 1.5, opacity: 0, y: -240 }}
                    className="absolute z-20"
                  >
                    <div className="px-10 py-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-[2rem] shadow-[0_15px_60px_rgba(234,88,12,0.5)] border border-orange-400/40">
                      <span className="text-2xl font-black text-white italic uppercase tracking-tighter">
                        COMBO STREAK: {currentStreak}×
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timer ring + Card */}
              <div className="relative mb-16 flex items-center justify-center w-full max-w-2xl group">
                {/* Card Background Glow */}
                <div className={cn(
                  "absolute -inset-20 blur-[120px] transition-all duration-1000",
                  phase === 'question' ? "bg-cyan-400/10" : "bg-emerald-400/10"
                )} />

                {/* Card */}
                <motion.div
                  key={`${currentCardIndex}-${phase}`}
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="w-full min-h-[380px] p-12  modular-card backdrop-blur-3xl flex flex-col items-center justify-center text-center relative z-10 transition-all bg-white/[0.01]"
                >
                  <div className="absolute top-10 left-12 right-12 flex justify-between items-center opacity-30">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white" />
                    <div className="w-2 h-2 rounded-full bg-white mx-4 shadow-[0_0_10px_rgba(255,255,255,1)]" />
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white" />
                  </div>

                  {phase === 'question' ? (
                    <>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] mb-10 italic">Card Question</span>
                      <p className="text-4xl  font-black text-white italic tracking-tighter leading-tight uppercase text-shadow-glow">{currentCard.front}</p>
                    </>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="w-full space-y-12"
                    >
                      <div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-5 italic">Question</span>
                        <p className="text-xl font-black text-white/30 italic uppercase tracking-widest">{currentCard.front}</p>
                      </div>
                      
                      <div className="h-[1px] w-32 bg-white/10 mx-auto" />

                      <div>
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.6em] mb-6 italic text-shadow-glow">Answer</span>
                        <p className="text-4xl  font-black text-white italic tracking-tighter leading-tight uppercase">{currentCard.back}</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="absolute bottom-10 left-16 right-16 flex justify-between items-center opacity-10">
                     <div className="text-[9px] font-black tracking-[0.4em] text-white italic uppercase">Study Mode</div>
                     <div className="text-[9px] font-black tracking-[0.4em] text-white italic uppercase">Active Session</div>
                  </div>
                </motion.div>

                {/* Timer ring (Overlaying) */}
                {phase === 'question' && (
                  <div className="absolute -inset-12 flex items-center justify-center pointer-events-none z-0">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-[115%] h-[115%] max-w-[600px] transform -rotate-90 opacity-20 group-hover:opacity-40 transition-opacity">
                      <circle cx="50" cy="50" r={timerRadius} fill="none" stroke="white" strokeWidth="0.5" opacity="0.05" />
                      <motion.circle
                        cx="50" cy="50" r={timerRadius}
                        fill="none"
                        stroke={cardTimeLeft <= 5 ? '#ef4444' : cardTimeLeft <= 10 ? '#f59e0b' : '#22d3ee'}
                        strokeWidth="1.5" strokeLinecap="round"
                        strokeDasharray={timerCircumference}
                        strokeDashoffset={timerOffset}
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', filter: 'drop-shadow(0 0 8px currentColor)' }}
                      />
                    </svg>
                    <div className="absolute top-0 right-0 p-12">
                       <span className={cn(
                        "text-6xl font-black tabular-nums italic text-shadow-glow",
                        cardTimeLeft <= 5 ? "text-red-500 animate-pulse" : cardTimeLeft <= 10 ? "text-amber-500" : "text-cyan-400"
                      )}>
                        {cardTimeLeft}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            {/* Action buttons */}
            <div className="mt-auto pb-12 w-full flex flex-col items-center gap-8">
              {phase === 'question' ? (
                <div className="relative group">
                  <div className="absolute -inset-4 bg-cyan-400/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReveal}
                    className="relative px-12 py-6 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.6em] italic shadow-2xl transition-all overflow-hidden flex items-center gap-6 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 group-hover:text-white transition-colors">Reveal Answer</span>
                    <ChevronRight size={14} className="relative z-10 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex gap-6 w-full max-w-sm"
                >
                  <button
                    onClick={() => handleGrade(false)}
                    className="flex-1 py-5 rounded-xl bg-white/[0.03] border border-white/10 text-white/40 font-black text-[9px] uppercase tracking-[0.4em] italic hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <X size={14} strokeWidth={3} /> Try Again
                  </button>
                  <button
                    onClick={() => handleGrade(true)}
                    className="flex-1 py-5 rounded-xl bg-cyan-500 text-black font-black text-[9px] uppercase tracking-[0.4em] italic hover:bg-cyan-400 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(34,211,238,0.2)]"
                  >
                    <Zap size={14} className="fill-current" /> Remembered
                  </button>
                </motion.div>
              )}
            </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
