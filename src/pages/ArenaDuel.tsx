import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Timer, Trophy, Shield, AlertCircle, Loader2, Search, ArrowLeft } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type DuelPhase = 'SEARCHING' | 'LOBBY' | 'EXCHANGE' | 'TRIAL' | 'REVIEW';

export function ArenaDuel() {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { state, isLoading, addXp, getDuel, updateDuel, createDuel } = useApp();
  
  const isSearching = duelId === 'searching';
  
  const [duel, setDuel] = useState<any>(null);
  const [phase, setPhase] = useState<DuelPhase>(isSearching ? 'SEARCHING' : 'LOBBY');
  const [timeLeft, setTimeLeft] = useState(90);
  const [localTopic, setLocalTopic] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchStatus, setSearchStatus] = useState('Initializing...');
  const cleanupRef = useRef<(() => void) | null>(null);

  // Deck mode state
  const [cards, setCards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasFinishedDeck, setHasFinishedDeck] = useState(false);

  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  // Derived state
  const isPlayer1 = duel?.player1_id === state.user?.id;
  const myTopicField = isPlayer1 ? 'p1_topic' : 'p2_topic';
  const theirTopicField = isPlayer1 ? 'p2_topic' : 'p1_topic';
  const myAnswerField = isPlayer1 ? 'p1_answer' : 'p2_answer';
  const theirAnswerField = isPlayer1 ? 'p2_answer' : 'p1_answer';
  const myScoreField = isPlayer1 ? 'p1_score' : 'p2_score';
  const theirScoreField = isPlayer1 ? 'p2_score' : 'p1_score';
  const myRatingField = isPlayer1 ? 'p2_review_rating' : 'p1_review_rating'; // Rating I give to them
  const theirRatingField = isPlayer1 ? 'p1_review_rating' : 'p2_review_rating'; // Rating they give to me
  const myDeckField = isPlayer1 ? 'p1_deck_id' : 'p2_deck_id';
  const theirDeckField = isPlayer1 ? 'p2_deck_id' : 'p1_deck_id';
  const opponent = isPlayer1 ? duel?.p2 : duel?.p1;

  // ── Fetch & phase sync ──
  const syncDuel = useCallback(async (id: string) => {
    if (!id || id === 'searching') return;
    const d = await getDuel(id);
    if (!d) return;
    setDuel(d);
    
    if (d.status === 'setup') {
      if (d.mode === 'deck') {
        setPhase(d[myDeckField] ? 'LOBBY' : 'EXCHANGE');
      } else {
        setPhase(d[myTopicField] ? 'LOBBY' : 'EXCHANGE');
      }
    }
    else if (d.status === 'active') setPhase('TRIAL');
    else if (d.status === 'review' || d.status === 'finished') setPhase('REVIEW');
  }, [getDuel, myTopicField, myDeckField]);

  // ── Realtime listener for active duel ──
  useEffect(() => {
    if (!duelId || isSearching) return;

    syncDuel(duelId);

    const ch = supabase
      .channel(`duel-${duelId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'duels',
        filter: `id=eq.${duelId}`
      }, () => syncDuel(duelId))
      .subscribe();

    return () => { ch.unsubscribe(); };
  }, [duelId, isSearching, syncDuel]);

  // ── Presence matchmaking ──
  useEffect(() => {
    if (!isSearching || !state.user) return;

    setSearchStatus('Broadcasting Hunter Signature...');

    const lobby = supabase.channel('arena-searching', {
      config: { presence: { key: state.user.id } }
    });

    const startTime = new Date().toISOString();

    // Also poll duels table as backup
    const pollInterval = setInterval(async () => {
      const params = new URLSearchParams(window.location.search);
      const myMode = params.get('mode') || 'writing';

      const { data } = await supabase
        .from('duels')
        .select('id')
        .eq('player2_id', state.user!.id)
        .eq('status', 'setup')
        .eq('mode', myMode)
        .gt('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        clearInterval(pollInterval);
        lobby.unsubscribe();
        setSearchStatus('Combat Link Detected!');
        navigate(`/duels/${data.id}`, { replace: true });
      }
    }, 2500);

    let hasCreated = false;

    lobby
      .on('presence', { event: 'sync' }, () => {
        if (hasCreated) return;
        const ps = lobby.presenceState();
        const all = Object.values(ps).flat() as any[];
        const params = new URLSearchParams(window.location.search);
        const myMode = params.get('mode') || 'writing';
        
        const opp = all.find(u => 
          u.user_id !== state.user?.id && 
          u.status === 'searching' && 
          u.mode === myMode
        );

        if (opp && state.user && state.user.id < opp.user_id) {
          hasCreated = true;
          setSearchStatus(`Target Locked: ${opp.name || 'Hunter'}...`);
          
          createDuel(myMode as any, opp.user_id).then(newId => {
            if (!newId) {
              setSearchStatus('Error creating arena. Retrying...');
              hasCreated = false;
              return;
            }
            lobby.send({
              type: 'broadcast', event: 'match_found',
              payload: { duelId: newId, targetId: opp.user_id, mode: myMode }
            });
            clearInterval(pollInterval);
            setTimeout(() => navigate(`/duels/${newId}`, { replace: true }), 600);
          });
        }
      })
      .on('broadcast', { event: 'match_found' }, ({ payload }) => {
        if (payload.targetId === state.user?.id) {
          clearInterval(pollInterval);
          setSearchStatus('Combat Link Received!');
          setTimeout(() => navigate(`/duels/${payload.duelId}`, { replace: true }), 600);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const params = new URLSearchParams(window.location.search);
          const myMode = params.get('mode') || 'writing';

          await lobby.track({
            user_id: state.user?.id,
            name: state.user?.name,
            status: 'searching',
            mode: myMode,
            ts: Date.now()
          });
          setSearchStatus('Scanning Neural Network...');
        }
      });

    cleanupRef.current = () => {
      clearInterval(pollInterval);
      lobby.unsubscribe();
    };

    return () => {
      clearInterval(pollInterval);
      lobby.unsubscribe();
    };
  }, [isSearching, state.user, createDuel, navigate]);

  // Handle mode from query params for searching
  useEffect(() => {
    if (isSearching) {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode') || 'writing';
    }
  }, [isSearching]);

  const refreshDecks = async () => {
    if (!state.user) return;
    setIsSyncing(true);
    // This will trigger a re-fetch in the global store if we had a refresh function,
    // but for now we'll just do a direct fetch to verify
    console.log("Refreshing decks for user:", state.user.id);
    const { data } = await supabase.from('decks').select('*').eq('user_id', state.user.id);
    console.log("Decks found in DB:", data?.length);
    setIsSyncing(false);
  };

  // ── Timer (only in TRIAL) ──
  useEffect(() => {
    if (phase !== 'TRIAL') return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Actions ──
  const handleCommitTopic = async () => {
    if (!duel || !localTopic.trim()) return;
    setIsSyncing(true);
    const updates: any = { [myTopicField]: localTopic.trim() };
    // Re-fetch to check if opponent already committed
    const fresh = await getDuel(duel.id);
    if (fresh?.[theirTopicField]) updates.status = 'active';
    await updateDuel(duel.id, updates);
    setIsSyncing(false);
  };

  const handleSubmitAnswer = async () => {
    if (!duel || !answer.trim()) return;
    setIsSyncing(true);
    const updates: any = { [myAnswerField]: answer.trim() };
    const fresh = await getDuel(duel.id);
    if (fresh?.[theirAnswerField]) updates.status = 'review';
    await updateDuel(duel.id, updates);
    addXp(250);
    setIsSyncing(false);
  };

  const handleSelectDeck = async (deckId: string) => {
    if (!duel) return;
    setIsSyncing(true);
    const updates: any = { [myDeckField]: deckId };
    const fresh = await getDuel(duel.id);
    if (fresh?.[theirDeckField]) updates.status = 'active';
    await updateDuel(duel.id, updates);
    setIsSyncing(false);
  };

  const handleAnswerDeck = async (correct: boolean) => {
    if (!duel || hasFinishedDeck) return;
    
    const newScore = correct ? score + 1 : score;
    setScore(newScore);
    setIsFlipped(false);

    if (currentCardIndex + 1 >= cards.length) {
      setHasFinishedDeck(true);
      setIsSyncing(true);
      const updates: any = { [myScoreField]: newScore };
      const fresh = await getDuel(duel.id);
      if (fresh?.[theirScoreField] !== undefined && fresh?.[theirScoreField] !== null) {
        updates.status = 'review';
      }
      await updateDuel(duel.id, updates);
      addXp(250);
      setIsSyncing(false);
    } else {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handleSubmitReview = async () => {
    if (!duel || rating === 0) return;
    setIsSyncing(true);
    const updates: any = { [myRatingField]: rating };
    if (comment.trim()) updates[`${isPlayer1 ? 'p2' : 'p1'}_review_comment`] = comment.trim();
    
    const fresh = await getDuel(duel.id);
    if (fresh?.[theirRatingField]) updates.status = 'finished';
    
    await updateDuel(duel.id, updates);
    setHasReviewed(true);
    addXp(100);
    setIsSyncing(false);

    // Auto-navigate back to battlefront after review
    setTimeout(() => {
      navigate('/battle');
    }, 2500);
  };

  // Load cards if in deck mode and trial phase
  useEffect(() => {
    if (duel?.mode === 'deck' && phase === 'TRIAL' && duel[myDeckField]) {
      supabase.from('cards').select('*').eq('deck_id', duel[myDeckField]).limit(10)
        .then(({ data }) => {
          if (data) setCards(data);
        });
    }
  }, [duel?.mode, phase, duel?.[myDeckField]]);

  // ════════════════════════════════════════
  //  RENDER: SEARCHING
  // ════════════════════════════════════════
  if (isSearching) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center text-center p-8 overflow-hidden z-50">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)]" />

        {/* Orbiting rings */}
        <div className="relative w-64 h-64 mb-12 z-10">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-[3px] border-dashed border-blue-500/25" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-6 rounded-full border-2 border-dashed border-cyan-400/15" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-12 rounded-full border border-dashed border-blue-300/10" />
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.15)]">
              <Search size={44} className="text-blue-400" />
            </div>
          </motion.div>
        </div>

        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-3 z-10">Neural Network Scan</h2>
        <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
          className="text-blue-400 text-[11px] font-black uppercase tracking-[0.4em] z-10">
          {searchStatus}
        </motion.p>

        <button onClick={() => navigate('/battle')}
          className="mt-14 text-[10px] font-black text-red-500/70 uppercase tracking-widest hover:text-red-400 z-10 transition-colors">
          ← Abort Protocol
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════
  //  RENDER: LOADING
  // ════════════════════════════════════════
  if (!duel) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
        <Loader2 className="text-blue-500 animate-spin" size={40} />
      </div>
    );
  }

  // ════════════════════════════════════════
  //  RENDER: ACTIVE DUEL
  // ════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden z-50">
      {/* Subtle bg */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-colors duration-1000",
        duel.mode === 'deck' 
          ? "bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08),transparent_60%)]" 
          : "bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_60%)]"
      )} />

      {/* Header HUD */}
      <header className="relative z-10 px-5 py-4 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/battle')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className={cn(
              "text-[9px] font-black uppercase tracking-[0.3em]",
              duel.mode === 'deck' ? "text-purple-400" : "text-blue-400"
            )}>{phase}</div>
            <h1 className="text-sm font-black uppercase italic tracking-tight">Arena #{duelId?.slice(0, 6)}</h1>
          </div>
        </div>

        {phase === 'TRIAL' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={cn(
              "w-14 h-14 rounded-full border-[3px] flex items-center justify-center",
              timeLeft < 20 ? "border-red-500" : (duel.mode === 'deck' ? "border-purple-500" : "border-blue-500")
            )}>
            <span className={cn("text-lg font-black tabular-nums", timeLeft < 20 ? "text-red-500" : "text-white")}>{timeLeft}</span>
          </motion.div>
        )}

        <div className="text-right min-w-[80px]">
          <div className="text-[9px] font-black text-red-400/80 uppercase tracking-widest">Target</div>
          <div className="text-xs font-black uppercase tracking-tight truncate">{opponent?.name || '...'}</div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-5 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── EXCHANGE: Type your topic ── */}
          {phase === 'EXCHANGE' && (
            <motion.div key="exchange" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full gap-6 py-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                  <Swords size={28} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                  {duel.mode === 'deck' ? 'Select Armament' : 'Deploy Subject'}
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  {duel.mode === 'deck' 
                    ? 'Choose the deck you will use to fight.\nBattle starts when both select.' 
                    : 'Type the topic your opponent must analyze.\nBattle starts when both commit.'}
                </p>
              </div>

              {duel.mode === 'deck' ? (
                <div className="grid gap-3 overflow-y-auto max-h-[400px] pr-2 pb-4">
                  {isLoading ? (
                    <div className="text-center py-20">
                      <Loader2 size={24} className="text-purple-500 animate-spin mx-auto mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Syncing Armory...</p>
                    </div>
                  ) : state.decks.length > 0 ? state.decks.map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck.id)}
                      disabled={isSyncing || !!duel[myDeckField]}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left",
                        duel[myDeckField] === deck.id 
                          ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20" 
                          : "bg-slate-900 border-white/5 hover:border-purple-500/30"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0", deck.color)}>
                        {deck.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black uppercase tracking-tight truncate">{deck.title}</div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase">{deck.subject}</div>
                      </div>
                      {duel[myDeckField] === deck.id && <Zap size={14} className="text-yellow-400" />}
                    </button>
                  )) : (
                    <div className="text-center py-10 opacity-50">
                      <div className="text-3xl mb-2">📭</div>
                      <p className="text-[10px] font-black uppercase tracking-widest">No Armaments Found</p>
                      <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase mb-4">Create decks in the armory to duel</p>
                      <button 
                        onClick={refreshDecks}
                        className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 underline"
                      >
                        Force Sync Neural Link
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={localTopic}
                  onChange={(e) => setLocalTopic(e.target.value)}
                  placeholder="Enter your topic..."
                  className="flex-1 min-h-[120px] w-full bg-slate-900/80 border border-white/5 rounded-3xl p-6 text-base font-bold outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/10 resize-none"
                />
              )}

              {duel.mode !== 'deck' && (
                <button
                  onClick={handleCommitTopic}
                  disabled={isSyncing || !localTopic.trim() || !!duel[myTopicField]}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all active:scale-[0.97]",
                    duel[myTopicField]
                      ? "bg-slate-800 text-slate-500 border border-white/5"
                      : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  )}>
                  {duel[myTopicField] ? '✓ COMMITTED — WAITING FOR OPPONENT...' : 'Commit Subject'}
                </button>
              )}
              {duel.mode === 'deck' && duel[myDeckField] && (
                <div className="text-center py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                  ✓ Deck Locked — Waiting for Opponent...
                </div>
              )}
            </motion.div>
          )}

          {/* ── LOBBY: Waiting for both to commit ── */}
          {phase === 'LOBBY' && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Waiting for Opponent</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {duel.mode === 'deck' ? 'Your armament has been locked.' : 'Your subject has been committed.'}<br/>Battle begins when both players are ready.
              </p>
            </motion.div>
          )}

          {/* ── TRIAL: Write your answer ── */}
          {phase === 'TRIAL' && (
            <motion.div key="trial" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full gap-5 py-4">
              
              {duel.mode === 'deck' ? (
                <>
                  <div className="flex justify-between items-center mb-2 px-2">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      Card {currentCardIndex + 1} / {cards.length}
                    </div>
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      Score: {score}
                    </div>
                  </div>

                  {cards[currentCardIndex] ? (
                    <div className="flex-1 perspective-1000">
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="relative w-full h-full preserve-3d cursor-pointer"
                      >
                        {/* Front */}
                        <div className={cn(
                          "absolute inset-0 backface-hidden bg-slate-900 border-2 border-blue-500/30 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center",
                          isFlipped ? "opacity-0" : "opacity-100"
                        )}>
                          <div className="text-2xl font-black uppercase tracking-tight">{cards[currentCardIndex].front}</div>
                          <div className="mt-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Tap to reveal</div>
                        </div>
                        {/* Back */}
                        <div className={cn(
                          "absolute inset-0 backface-hidden bg-slate-900 border-2 border-purple-500/30 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)]",
                          isFlipped ? "opacity-100" : "opacity-0"
                        )}>
                          <div className="text-xl font-medium text-slate-300">{cards[currentCardIndex].back}</div>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 size={32} className="text-blue-500 animate-spin" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleAnswerDeck(false)}
                      className="py-5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                    >
                      Need Review
                    </button>
                    <button
                      onClick={() => handleAnswerDeck(true)}
                      className="py-5 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      Got It
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Topic card */}
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={12} className="text-blue-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Combat Intel</span>
                    </div>
                    <h2 className="text-lg font-black tracking-tight uppercase italic">{duel[theirTopicField] || 'Loading...'}</h2>
                  </div>

                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your analysis..."
                    className="flex-1 min-h-[140px] w-full bg-slate-900/80 border border-white/5 rounded-3xl p-6 text-base font-medium outline-none focus:border-red-500/50 transition-colors placeholder:text-white/10 resize-none"
                  />

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isSyncing || !answer.trim() || !!duel[myAnswerField]}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all active:scale-[0.97]",
                      duel[myAnswerField]
                        ? "bg-slate-800 text-slate-500 border border-white/5"
                        : "bg-red-600 text-white shadow-lg shadow-red-500/20"
                    )}>
                    {duel[myAnswerField] ? '✓ SUBMITTED — WAITING...' : 'Submit Analysis'}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {phase === 'REVIEW' && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center h-full gap-6 py-6">
              
              <div className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/20 mx-auto mb-3">
                  <Trophy size={32} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Combat Complete</h2>
              </div>

              <div className="w-full space-y-4 flex-1 overflow-y-auto pr-2">
                {/* Result Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">You</div>
                    {duel.mode === 'deck' ? (
                      <div className="text-3xl font-black italic">{duel[myScoreField]} pts</div>
                    ) : (
                      <p className="text-[10px] text-slate-400 line-clamp-3">{duel[myAnswerField]}</p>
                    )}
                  </div>
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
                    <div className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-2">{opponent?.name || 'Opponent'}</div>
                    {duel.mode === 'deck' ? (
                      <div className="text-3xl font-black italic">{duel[theirScoreField] !== null ? `${duel[theirScoreField]} pts` : '...'}</div>
                    ) : (
                      <p className="text-[10px] text-slate-400 line-clamp-3">{duel[theirAnswerField] || 'Writing...'}</p>
                    )}
                  </div>
                </div>

                {/* Peer Review Form */}
                {!hasReviewed && !duel[myRatingField] ? (
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-5">
                    <div className="text-center">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Rate Opponent</h3>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">How was their performance?</p>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            rating >= star ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "bg-white/5 text-slate-600"
                          )}
                        >
                          <Zap size={18} fill={rating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add honors/feedback (optional)..."
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-medium outline-none focus:border-yellow-500/30 transition-colors placeholder:text-white/10 resize-none h-20"
                    />

                    <button
                      onClick={handleSubmitReview}
                      disabled={isSyncing || rating === 0}
                      className="w-full py-4 rounded-2xl bg-yellow-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-yellow-500/20 transition-all active:scale-95"
                    >
                      {isSyncing ? 'Submitting...' : 'Submit Honors (+100 XP)'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <Shield size={24} className="text-emerald-500 mx-auto mb-2" />
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-500">Review Synchronized</div>
                    <p className="text-[9px] text-emerald-500/60 mt-1 font-bold uppercase">Honors have been awarded.</p>
                  </div>
                )}
              </div>

              <button onClick={() => navigate('/battle')}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-colors">
                Return to Battlefront
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
