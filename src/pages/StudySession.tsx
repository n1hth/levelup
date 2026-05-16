import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap, X } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { FlashCard } from '@/src/components/FlashCard.tsx';
import { SessionSummary } from '@/src/components/SessionSummary.tsx';
import { cn } from '@/src/lib/utils.ts';
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
    <div className="fixed inset-0 bg-[#020617] text-white flex flex-col font-sans overflow-hidden z-[100]">
      {/* Dungeon Floor Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

      {/* Header HUD */}
      <header className="relative z-10 px-12 py-10 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button 
            onClick={handleExit} 
            className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all group shadow-2xl backdrop-blur-xl"
          >
            <X size={28} className="group-hover:rotate-90 transition-transform" />
          </button>
          
          <div className="h-12 w-[1px] bg-white/10" />

          <div>
             <div className="text-[10px] font-black uppercase tracking-[0.6em] text-cyan-400 italic mb-2 pr-1 text-shadow-glow">Gate Clearing</div>
             <h1 className="text-3xl font-black italic tracking-tighter leading-none uppercase truncate max-w-[300px]">{deck?.title || 'MEMORY GATE'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic mb-3 pr-1">Clearing Progress</div>
             <div className="flex items-center gap-6">
                <div className="w-64 h-2.5 rounded-full bg-white/[0.02] border border-white/5 p-0.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all"
                  />
                </div>
                <span className="text-sm font-black italic text-cyan-400 tabular-nums text-shadow-glow">{ratedCount} <span className="text-white/20">/</span> {queue.length}</span>
             </div>
          </div>

          <div className="h-12 w-[1px] bg-white/10" />

          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 pr-1 text-shadow-glow">Mana Yield</div>
            <div className="text-3xl font-black italic text-white tracking-widest tabular-nums">+{sessionXp} <span className="text-white/20">XP</span></div>
          </div>
        </div>
      </header>

      {/* Main Trial Grounds */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-12 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentCard ? (
            <motion.div
              key={currentCard.id}
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -30, filter: 'blur(20px)' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="w-full flex flex-col items-center gap-12"
            >
              <div className="relative w-full group">
                {/* Background Aura */}
                <div className={cn(
                  "absolute -inset-20 blur-[100px] opacity-20 transition-all duration-1000",
                  isFlipped ? "bg-emerald-400/10" : "bg-cyan-400/10"
                )} />

                <FlashCard
                  card={currentCard}
                  onFlip={() => setIsFlipped(true)}
                />
              </div>

              {/* Interaction Bar */}
              <div className="w-full max-w-2xl h-32 relative">
                <AnimatePresence mode="wait">
                  {!isFlipped ? (
                    <motion.div
                      key="hint-message"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex justify-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                         <div className="flex gap-2">
                           {[...Array(3)].map((_, i) => (
                             <motion.div 
                                key={i}
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                             />
                           ))}
                         </div>
                         <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em] italic animate-pulse">Tap card or space to decode rune</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rating-btn"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="w-full h-full"
                    >
                      <div className="flex flex-col items-center gap-6">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic pr-1">Assess Rune Mastery</span>
                         <RatingBar onRate={handleRate} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-12 py-24">
              <div className="relative">
                 <Zap className="animate-pulse text-cyan-400" size={64} />
                 <div className="absolute inset-0 bg-cyan-400/20 blur-2xl animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">Initializing Mana Stream...</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Session Summary Overlay */}
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

      {/* Decorative HUD Elements */}
      <div className="fixed bottom-12 left-12 opacity-10 pointer-events-none">
        <div className="text-[8px] font-black text-white uppercase tracking-[0.5em] mb-2 italic">NEURAL LOAD</div>
        <div className="flex gap-1 h-4 items-end">
           {[...Array(24)].map((_, i) => (
             <motion.div 
               key={i} 
               animate={{ height: ['20%', `${Math.random() * 80 + 20}%`, '20%'] }}
               transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05 }}
               className="w-[2px] bg-cyan-400" 
             />
           ))}
        </div>
      </div>
      
      <div className="fixed bottom-12 right-12 opacity-10 pointer-events-none text-right">
        <div className="text-[8px] font-black text-white uppercase tracking-[0.5em] mb-2 italic">GATE STATUS</div>
        <div className="text-xs font-black text-white italic tracking-widest">STABLE / CLEARED</div>
      </div>
    </div>
  );
}

function RatingBar({ onRate }: { onRate: (rating: Rating) => void }) {
  const ratings: { value: Rating; label: string; color: string; glow: string }[] = [
    { value: 0, label: 'FAILED', color: 'hover:bg-red-500', glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
    { value: 1, label: 'VAGUE', color: 'hover:bg-orange-500', glow: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]' },
    { value: 2, label: 'STABLE', color: 'hover:bg-cyan-500', glow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]' },
    { value: 3, label: 'FLAWLESS', color: 'hover:bg-emerald-500', glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
  ];

  return (
    <div className="flex gap-4 w-full h-24">
      {ratings.map((r, i) => (
        <motion.button
          key={r.value}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onRate(r.value)}
          className={cn(
            "flex-1 h-full rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center gap-1 transition-all group relative overflow-hidden",
            r.color,
            r.glow
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic group-hover:text-white group-hover:tracking-[0.5em] transition-all">{r.label}</span>
          <span className="text-xl font-black text-white italic group-hover:scale-125 transition-transform">{r.value}</span>
        </motion.button>
      ))}
    </div>
  );
}
