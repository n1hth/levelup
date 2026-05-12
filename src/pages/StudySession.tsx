import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap, X } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { FlashCard } from '@/src/components/FlashCard.tsx';
import { RatingBar } from '@/src/components/RatingBar.tsx';
import { SessionSummary } from '@/src/components/SessionSummary.tsx';
import { calculateFocusXp } from '@/src/lib/xp.ts';
import { RATING_XP, type Rating } from '@/src/lib/sm2.ts';
import { type Card } from '@/src/lib/store.tsx';

export function StudySession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, getDueCards, reviewCard, addXp, addDeckStudySession } = useApp();

  const deck = state.decks.find(d => d.id === id);
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [ratedCount, setRatedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [levelResult, setLevelResult] = useState<any | null>(null);
  const [sessionStartTime] = useState(Date.now());

  // Build queue from due cards
  useEffect(() => {
    if (!id) return;
    const due = getDueCards(id);
    if (due.length === 0) { navigate(`/decks/${id}`); return; }
    setQueue([...due].sort(() => Math.random() - 0.5));
  }, [id]);

  const currentCard = queue[currentIndex];
  const progress = ratedCount / Math.max(queue.length, 1);
  const isLastCard = currentIndex >= queue.length - 1;

  const handleRate = useCallback(async (rating: Rating) => {
    if (!currentCard) return;

    const xp = reviewCard(currentCard.id, rating);
    setSessionXp(prev => prev + xp);
    setRatedCount(prev => prev + 1);
    if (rating >= 2) setCorrectCount(prev => prev + 1);
    setIsFlipped(false);

    if (isLastCard) {
      // Session complete
      const totalXp = sessionXp + xp;
      const bonus = ratedCount + 1 >= 5 ? 25 : 0;
      const finalXp = totalXp + bonus;
      const result = await addXp(finalXp);
      setLevelResult(result);
      await addDeckStudySession({
        deckId: id!,
        cardsReviewed: ratedCount + 1,
        xpEarned: finalXp,
        accuracy: Math.round(((correctCount + (rating >= 2 ? 1 : 0)) / (ratedCount + 1)) * 100),
        completedAt: new Date().toISOString(),
      });
      setShowSummary(true);
    } else {
      setTimeout(() => setCurrentIndex(i => i + 1), 300);
    }
  }, [currentCard, isLastCard, sessionXp, ratedCount, correctCount, id, reviewCard, addXp, addDeckStudySession]);

  const handleExit = () => navigate(`/decks/${id}`);

  if (!deck || queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-blue-400 font-black text-sm">Loading session...</p>
      </div>
    );
  }

  // Build a fake xpCalc object for the summary screen
  const finalXp = sessionXp + (ratedCount >= 5 ? 25 : 0);
  const xpCalc = {
    baseXp: sessionXp,
    completionBonus: ratedCount >= 5 ? 25 : 0,
    noPauseBonus: 0,
    momentumMultiplier: 1,
    totalXp: finalXp,
    breakdown: [
      { label: `${ratedCount} cards reviewed`, value: sessionXp },
      ...(ratedCount >= 5 ? [{ label: 'Session Bonus (5+ cards)', value: 25 }] : []),
    ],
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 pb-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={handleExit} className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] hover:text-blue-600 transition-colors">
            <ArrowLeft size={14} /> Exit
          </button>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-cyan-400" />
            <span className="text-sm font-black text-blue-900">+{sessionXp} XP</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">
              {ratedCount} / {queue.length} cards
            </span>
            <span className="text-[9px] font-black text-blue-400">{deck.title}</span>
          </div>
          <div className="hud-progress">
            <motion.div
              className="hud-progress-fill"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <FlashCard
                card={currentCard}
                onFlip={() => setIsFlipped(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating Bar — only shown after flip */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <RatingBar onRate={handleRate} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card counter dots */}
        {queue.length <= 12 && (
          <div className="flex justify-center gap-1.5">
            {queue.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i < ratedCount ? 'bg-blue-500' : i === currentIndex ? 'bg-blue-300 scale-125' : 'bg-blue-100'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Session Summary */}
      <AnimatePresence>
        {showSummary && levelResult && (
          <SessionSummary
            xpCalc={xpCalc}
            actualDuration={Math.round((Date.now() - sessionStartTime) / 1000)}
            pauseCount={0}
            isCompleted={true}
            noPauseChallenge={false}
            levelResult={levelResult}
            onDone={() => navigate(`/decks/${id}`)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
