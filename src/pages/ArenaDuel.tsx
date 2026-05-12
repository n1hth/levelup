import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Timer, Trophy, Shield, AlertCircle, Send, BookOpen, Check, X, Users, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { useApp, type Card } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type DuelPhase = 'LOBBY' | 'EXCHANGE' | 'TRIAL' | 'REVIEW' | 'COMMUNITY' | 'RESULTS';

export function ArenaDuel() {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { state, updateDuel, getDuel, getDeckCards } = useApp();
  
  const [duel, setDuel] = useState<any>(null);
  const [phase, setPhase] = useState<DuelPhase>('LOBBY');
  const [localInput, setLocalInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Deck Duel Trial State
  const [trialCards, setTrialCards] = useState<Card[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [cardAnswer, setCardAnswer] = useState('');
  const [deckResults, setDeckResults] = useState<any[]>([]);

  const isPlayer1 = duel?.player1_id === state.user?.id;
  const opponentName = isPlayer1 ? duel?.p2?.name : duel?.p1?.name;

  const fetchDuel = useCallback(async () => {
    if (!duelId) return;
    const d = await getDuel(duelId);
    setDuel(d);
  }, [duelId, getDuel]);

  useEffect(() => {
    if (!duelId) return;
    const channel = supabase
      .channel(`duel-${duelId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` }, () => {
        fetchDuel();
      })
      .subscribe();
    fetchDuel();
    return () => { channel.unsubscribe(); };
  }, [duelId, fetchDuel]);

  useEffect(() => {
    if (!duel) return;
    if (duel.status === 'setup') {
      if (!duel.p1_deck_id && !duel.p2_deck_id && !duel.p1_topic && !duel.p2_topic) setPhase('LOBBY');
      else setPhase('EXCHANGE');
    } else if (duel.status === 'active') {
      setPhase('TRIAL');
      if (duel.mode === 'deck' && trialCards.length === 0) {
        const targetDeckId = isPlayer1 ? duel.p2_deck_id : duel.p1_deck_id;
        if (targetDeckId) {
          supabase.from('cards').select('*').eq('deck_id', targetDeckId).limit(5)
            .then(({ data }) => setTrialCards(data || []));
        }
      }
    } else if (duel.status === 'review') {
      setPhase('REVIEW');
    } else if (duel.status === 'community') {
      setPhase('COMMUNITY');
    } else if (duel.status === 'finished') {
      setPhase('RESULTS');
    }
  }, [duel, trialCards.length, isPlayer1]);

  const handleDeploy = async () => {
    if (!duel) return;
    setIsSyncing(true);
    const updates: any = {};
    if (isPlayer1) {
      if (duel.mode === 'deck') updates.p1_deck_id = localInput;
      else updates.p1_topic = localInput;
    } else {
      if (duel.mode === 'deck') updates.p2_deck_id = localInput;
      else updates.p2_topic = localInput;
    }
    const newDuel = { ...duel, ...updates };
    const p1Ready = duel.mode === 'deck' ? newDuel.p1_deck_id : newDuel.p1_topic;
    const p2Ready = duel.mode === 'deck' ? newDuel.p2_deck_id : newDuel.p2_topic;
    if (p1Ready && p2Ready) updates.status = 'active';
    await updateDuel(duel.id, updates);
    setLocalInput('');
    setIsSyncing(false);
  };

  const handleNextCard = () => {
    const currentCard = trialCards[currentCardIdx];
    const isCorrect = cardAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
    const newResults = [...deckResults, { cardId: currentCard.id, answer: cardAnswer, correct: isCorrect }];
    setDeckResults(newResults);
    if (currentCardIdx < trialCards.length - 1) {
      setCurrentCardIdx(prev => prev + 1);
      setCardAnswer('');
    } else {
      handleSubmitTrial(JSON.stringify(newResults));
    }
  };

  const handleSubmitTrial = async (resultContent?: string) => {
    if (!duel) return;
    setIsSyncing(true);
    const updates: any = {};
    const content = resultContent || localInput;
    if (isPlayer1) updates.p1_answer = content;
    else updates.p2_answer = content;
    const newDuel = { ...duel, ...updates };
    if (newDuel.p1_answer && newDuel.p2_answer) updates.status = 'review';
    await updateDuel(duel.id, updates);
    setLocalInput('');
    setIsSyncing(false);
  };

  const handleSubmitReview = async (isFair: boolean) => {
    if (!duel) return;
    setIsSyncing(true);
    const updates: any = {};
    if (isPlayer1) updates.p1_correction = isFair ? 'fair' : 'unfair';
    else updates.p2_correction = isFair ? 'fair' : 'unfair';
    const newDuel = { ...duel, ...updates };
    if (newDuel.p1_correction && newDuel.p2_correction) updates.status = 'community';
    await updateDuel(duel.id, updates);
    setIsSyncing(false);
  };

  if (!duel) return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-blue-400 font-black uppercase tracking-widest animate-pulse">Establishing Neural Link...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
      <header className="p-6 flex items-center justify-between z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Channel_Duel_{duelId?.slice(0,4)}</div>
            <h1 className="text-lg font-black uppercase italic tracking-tighter text-white">{phase}</h1>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Opponent</div>
          <div className="text-xs font-black uppercase italic">{opponentName || 'WAITING...'}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col z-10 max-w-lg mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {phase === 'LOBBY' && (
            <motion.div key="lobby" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-64 h-64 rounded-full border-2 border-dashed border-blue-500/20 flex items-center justify-center" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-blue-600/10 border-4 border-blue-500 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                    <Loader2 size={48} className="text-blue-500 animate-spin mb-2" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Neural Link</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">Waiting for <br/> <span className="text-blue-500">Opponent...</span></h2>
                <div className="flex items-center justify-center gap-3 bg-white/5 py-3 px-6 rounded-2xl border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connection Stable</span>
                </div>
              </div>
              <button onClick={() => navigate('/battle')} className="w-full py-5 rounded-2xl bg-red-950/30 border-2 border-red-500/50 text-red-500 font-black uppercase text-[10px] tracking-[0.4em]">Abort Combat Link</button>
            </motion.div>
          )}

          {phase === 'EXCHANGE' && (
            <motion.div key="exchange" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col space-y-6">
              <div className="system-panel p-8 bg-blue-600/5 border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter text-white">Deploy <br/> Subject</h2>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{duel.mode === 'deck' ? 'Select Combat Deck' : 'Enter Writing Topic'}</p>
              </div>
              <div className="flex-1 flex flex-col space-y-4">
                {duel.mode === 'deck' ? (
                  <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto no-scrollbar">
                    {state.decks.map(deck => (
                      <button key={deck.id} onClick={() => setLocalInput(deck.id)} className={cn("w-full p-5 rounded-2xl border-2 text-left transition-all", localInput === deck.id ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-slate-900 border-white/5")}>
                        <div className="text-sm font-black uppercase tracking-tight">{deck.title}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea value={localInput} onChange={(e) => setLocalInput(e.target.value)} placeholder="TYPE SUBJECT..." className="flex-1 w-full bg-slate-900 border-2 border-white/5 rounded-[32px] p-8 text-xl font-black uppercase outline-none focus:border-blue-500" />
                )}
              </div>
              <button onClick={handleDeploy} disabled={isSyncing || !localInput || (isPlayer1 ? (duel.p1_deck_id || duel.p1_topic) : (duel.p2_deck_id || duel.p2_topic))} className="w-full py-6 rounded-[32px] bg-blue-600 text-white font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl">
                {(isPlayer1 ? (duel.p1_deck_id || duel.p1_topic) : (duel.p2_deck_id || duel.p2_topic)) ? 'WAITING FOR TARGET...' : 'Confirm Deployment'}
              </button>
            </motion.div>
          )}

          {phase === 'TRIAL' && (
            <motion.div key="trial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col space-y-6">
              <div className="system-panel p-6 border-red-500/40 bg-red-950/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Active Protocol</span>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  {duel.mode === 'deck' ? 'Card Solve Trial' : `Subject: ${isPlayer1 ? duel.p2_topic : duel.p1_topic}`}
                </h3>
              </div>
              {duel.mode === 'deck' ? (
                trialCards.length > 0 ? (
                  <div className="flex-1 flex flex-col space-y-6">
                    <div className="flex-1 system-panel border-white/5 bg-slate-900/40 p-8 flex items-center justify-center text-center relative">
                       <span className="absolute top-4 right-6 text-[8px] font-black text-blue-400">CARD {currentCardIdx + 1} / {trialCards.length}</span>
                       <h4 className="text-3xl font-black uppercase tracking-tighter">{trialCards[currentCardIdx].front}</h4>
                    </div>
                    <input value={cardAnswer} onChange={(e) => setCardAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleNextCard()} placeholder="TYPE ANSWER..." className="w-full py-5 px-8 bg-slate-900 border-2 border-white/10 rounded-2xl text-lg font-black uppercase text-center outline-none focus:border-red-500" />
                    <button onClick={handleNextCard} className="w-full py-4 rounded-xl bg-white text-slate-950 font-black uppercase text-[10px] tracking-widest">Next Card</button>
                  </div>
                ) : <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
              ) : (
                <>
                  <textarea value={localInput} onChange={(e) => setLocalInput(e.target.value)} placeholder="TYPE ANALYSIS..." className="flex-1 w-full bg-slate-900/50 border-2 border-white/5 rounded-[40px] p-10 text-xl font-bold outline-none focus:border-red-500" />
                  <button onClick={() => handleSubmitTrial()} disabled={isSyncing || (isPlayer1 ? duel.p1_answer : duel.p2_answer)} className="w-full py-6 rounded-[32px] bg-red-600 text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl">
                    {(isPlayer1 ? duel.p1_answer : duel.p2_answer) ? 'DATA SENT. WAITING...' : 'Submit Trial'}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {phase === 'REVIEW' && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-6">
              <div className="system-panel p-8 border-purple-500/30 bg-purple-950/20">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4 italic">Opponent's Submission</h3>
                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                  {duel.mode === 'deck' ? (
                    <div className="space-y-2">
                      {JSON.parse(isPlayer1 ? duel.p2_answer : duel.p1_answer).map((res: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                           <span className="text-[10px] font-black">CARD {i+1}</span>
                           <span className={cn("text-[10px] font-black", res.correct ? "text-emerald-400" : "text-red-400")}>{res.correct ? 'SOLVED' : 'FAILED'}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-lg font-bold leading-relaxed text-slate-300 italic">"{isPlayer1 ? duel.p2_answer : duel.p1_answer}"</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleSubmitReview(true)} disabled={isSyncing || (isPlayer1 ? duel.p1_correction : duel.p2_correction)} className="py-5 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-black uppercase text-[10px] tracking-widest">Accept (Fair)</button>
                <button onClick={() => handleSubmitReview(false)} disabled={isSyncing || (isPlayer1 ? duel.p1_correction : duel.p2_correction)} className="py-5 rounded-2xl bg-red-600/20 border border-red-500/50 text-red-400 font-black uppercase text-[10px] tracking-widest">Reject (Unfair)</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
