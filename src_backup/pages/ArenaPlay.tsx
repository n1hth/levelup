import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, X, Flame } from 'lucide-react';
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
    const currentCard = shuffledCards[currentCardIndex];
    if (!currentCard) return;

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
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* ═══ Countdown ═══ */}
      <AnimatePresence mode="wait">
        {phase === 'countdown' ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="flex-1 flex items-center justify-center"
          >
            <motion.span
              key={countdownValue}
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-8xl font-black text-white"
              style={{ textShadow: '0 0 60px rgba(0,210,255,0.6)' }}
            >
              {countdownValue > 0 ? countdownValue : 'GO!'}
            </motion.span>
          </motion.div>
        ) : (phase === 'question' || phase === 'reveal') && currentCard ? (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <button onClick={() => navigate('/battle')} className="text-white/40 hover:text-white/80 transition-colors">
                <X size={24} />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">
                  {currentCardIndex + 1}/{shuffledCards.length}
                </span>
                {currentStreak >= 2 && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full border border-orange-500/20"
                  >
                    <Flame size={12} className="text-orange-400" />
                    <span className="text-[9px] font-black text-orange-400">{currentStreak}×</span>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <Zap size={14} className="text-cyan-400 fill-cyan-400/20" />
                <span className="text-sm font-black text-white tabular-nums tracking-tight">{totalXpEarned}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 mb-6">
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  animate={{ width: `${((currentCardIndex + 1) / shuffledCards.length) * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Card area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
              {/* Combo flash */}
              <AnimatePresence>
                {showCombo && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    className="absolute top-4 z-20"
                  >
                    <div className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-2xl shadow-orange-500/40">
                      <span className="text-sm font-black text-white uppercase tracking-widest">
                        {currentStreak}× Combo!
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timer ring + Card */}
              <div className="relative mb-8 flex items-center justify-center w-full">
                {/* Card */}
                <motion.div
                  key={`${currentCardIndex}-${phase}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-sm min-h-[180px] p-6 sm:p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-2xl relative z-10"
                >
                  {phase === 'question' ? (
                    <>
                      <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4">Question</span>
                      <p className="text-xl font-black text-white leading-relaxed">{currentCard.front}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">Question</span>
                      <p className="text-sm font-bold text-blue-300 mb-4">{currentCard.front}</p>
                      <div className="w-full h-px bg-white/10 my-3" />
                      <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.4em] mb-2">Answer</span>
                      <p className="text-xl font-black text-white leading-relaxed">{currentCard.back}</p>
                    </>
                  )}
                </motion.div>

                {/* Timer ring (Overlaying) */}
                {phase === 'question' && (
                  <div className="absolute -inset-6 flex items-center justify-center pointer-events-none z-0">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-[110%] h-[110%] max-w-[400px] transform -rotate-90 opacity-20 sm:opacity-40">
                      <circle cx="50" cy="50" r={timerRadius} fill="none" stroke="white" strokeWidth="1" opacity="0.1" />
                      <motion.circle
                        cx="50" cy="50" r={timerRadius}
                        fill="none"
                        stroke={cardTimeLeft <= 5 ? '#ef4444' : cardTimeLeft <= 10 ? '#f59e0b' : '#00d2ff'}
                        strokeWidth="2" strokeLinecap="round"
                        strokeDasharray={timerCircumference}
                        strokeDashoffset={timerOffset}
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                      />
                    </svg>
                    <div className="absolute top-0 right-0 p-8">
                       <span className={cn(
                        "text-2xl font-black tabular-nums drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                        cardTimeLeft <= 5 ? "text-red-400" : cardTimeLeft <= 10 ? "text-amber-400" : "text-cyan-400"
                      )}>
                        {cardTimeLeft}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {phase === 'question' ? (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReveal}
                  className="px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:brightness-110 transition-all"
                >
                  Reveal Answer
                </motion.button>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex gap-4 w-full max-w-sm pb-8 sm:pb-0"
                >
                  <button
                    onClick={() => handleGrade(false)}
                    className="flex-1 py-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-400 font-black text-sm uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Wrong
                  </button>
                  <button
                    onClick={() => handleGrade(true)}
                    className="flex-1 py-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 font-black text-sm uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>✓</span> Correct
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
