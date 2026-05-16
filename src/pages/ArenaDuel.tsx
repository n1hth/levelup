import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Timer, Trophy, Shield, AlertCircle, Loader2, Search, ArrowLeft } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type DuelPhase = 'SEARCHING' | 'WAITING' | 'LOBBY' | 'EXCHANGE' | 'TRIAL' | 'REVIEW';

function mapDeckFromDb(row: any) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    description: row.description || '',
    tags: row.tags || [],
    color: row.color,
    createdAt: row.created_at || row.createdAt,
    lastStudiedAt: row.last_studied_at || row.lastStudiedAt || null,
  };
}

function mapCardFromDb(row: any) {
  return {
    id: row.id,
    deckId: row.deck_id || row.deckId,
    front: row.front,
    back: row.back,
    createdAt: row.created_at || row.createdAt,
    interval: row.interval,
    repetitions: row.repetitions,
    easeFactor: row.ease_factor || row.easeFactor,
    dueDate: row.due_date || row.dueDate,
    masteryState: row.mastery_state || row.masteryState,
  };
}

export function ArenaDuel() {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { state, isLoading, getDuel, updateDuel, createDuel, getDeckCards } = useApp();
  
  useEffect(() => {
    console.log("ArenaDuel State Check:", {
      decksCount: state.decks.length,
      userId: state.user?.id,
      isLoading,
      duelId
    });
  }, [state.decks, state.user, isLoading, duelId]);
  
  const isSearching = duelId === 'searching';
  
  const [duel, setDuel] = useState<any>(null);
  const [phase, setPhase] = useState<DuelPhase>(isSearching ? 'SEARCHING' : 'LOBBY');
  const [timeLeft, setTimeLeft] = useState(90);
  const [localTopic, setLocalTopic] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [arenaDecks, setArenaDecks] = useState<any[]>([]);

  // Deeply sync decks for the arena independently
  const loadArenaDecks = useCallback(async () => {
    if (!state.user?.id) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('decks').select('*').eq('user_id', state.user.id);
      if (!error && data) {
        const remoteDecks = data.map(mapDeckFromDb);
        // Merge with global state to catch any unsynced local decks just in case
        const merged = [...remoteDecks, ...(state.decks || []).filter(ld => !remoteDecks.find(sd => sd.id === ld.id))];
        setArenaDecks(merged);
      } else {
        setArenaDecks(state.decks || []);
      }
    } catch (e) {
      setArenaDecks(state.decks || []);
    } finally {
      setIsSyncing(false);
    }
  }, [state.user?.id, state.decks]);

  useEffect(() => {
    if (state.user?.id) {
      loadArenaDecks();
    }
  }, [state.user?.id, loadArenaDecks]);
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

    const fetchedIsPlayer1 = d.player1_id === state.user?.id;
    const fetchedIsPlayer2 = d.player2_id === state.user?.id;
    if (!fetchedIsPlayer1 && !fetchedIsPlayer2) {
      console.error("Current user is not a participant in this duel", { duelId: id, userId: state.user?.id });
      return;
    }

    const fetchedMyTopicField = fetchedIsPlayer1 ? 'p1_topic' : 'p2_topic';
    const fetchedMyDeckField = fetchedIsPlayer1 ? 'p1_deck_id' : 'p2_deck_id';
    
    if (d.status === 'invited') {
      setPhase('WAITING');
    }
    else if (d.status === 'setup') {
      if (d.mode === 'deck') {
        setPhase(d[fetchedMyDeckField] ? 'LOBBY' : 'EXCHANGE');
      } else {
        setPhase(d[fetchedMyTopicField] ? 'LOBBY' : 'EXCHANGE');
      }
    }
    else if (d.status === 'active') setPhase('TRIAL');
    else if (d.status === 'review' || d.status === 'finished') setPhase('REVIEW');
  }, [getDuel, state.user?.id]);

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
    setIsSyncing(false);
  };

  const handleSelectDeck = async (deckId: string) => {
    if (!duel) return;
    setIsSyncing(true);
    try {
      const updates: any = { [myDeckField]: deckId };
      const fresh = await getDuel(duel.id);
      if (fresh?.[theirDeckField]) updates.status = 'active';
      
      // Optimistic update to UI so it feels instant
      setDuel((prev: any) => prev ? { ...prev, ...updates } : null);
      if (updates.status === 'active') setPhase('TRIAL');
      else setPhase('LOBBY');
      
      await updateDuel(duel.id, updates);
    } catch (err: any) {
      alert("Failed to lock in armament: " + err.message);
    } finally {
      setIsSyncing(false);
    }
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
    if (fresh?.[theirRatingField]) updates.status = 'community_review';
    
    await updateDuel(duel.id, updates);
    setHasReviewed(true);
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
          if (data) setCards(data.map(mapCardFromDb));
        });
    }
  }, [duel?.mode, phase, duel?.[myDeckField]]);

  // ════════════════════════════════════════
  //  RENDER: SEARCHING
  // ════════════════════════════════════════
  if (isSearching) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center text-center p-8 overflow-hidden z-[200]">
        {/* Neural Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        {/* Orbiting rings */}
        <div className="relative w-80 h-80 mb-16 z-10 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-[1px] border-dashed border-cyan-400/20" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-8 rounded-full border-[1px] border-dashed border-white/10" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-20 rounded-full border-[1px] border-solid border-cyan-400/5" />
          
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 40px rgba(34,211,238,0.1)',
                '0 0 80px rgba(34,211,238,0.2)',
                '0 0 40px rgba(34,211,238,0.1)'
              ] 
            }} 
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-40 h-40 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center relative backdrop-blur-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent" />
            <Search size={56} className="text-cyan-400 relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          </motion.div>

          {/* Pulse Waves */}
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-cyan-400/20"
            />
          ))}
        </div>

        <div className="space-y-4 z-10">
          <span className="text-[10px] font-black tracking-[1em] text-cyan-400/40 uppercase italic">Broadcasting Signal</span>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Neural <span className="text-cyan-400">Scan</span></h2>
          <motion.p 
            animate={{ opacity: [0.3, 1, 0.3] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/40 text-[11px] font-black uppercase tracking-[0.6em] italic"
          >
            {searchStatus}
          </motion.p>
        </div>

        <button 
          onClick={() => navigate('/battle')}
          className="absolute bottom-16 px-10 py-4 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-black text-red-500/50 uppercase tracking-[0.4em] hover:text-red-500 hover:bg-red-500/10 transition-all z-10 italic"
        >
          Abort Protocol
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════
  //  RENDER: WAITING FOR OPPONENT (FRIENDLY)
  // ════════════════════════════════════════
  if (phase === 'WAITING') {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center text-center p-8 overflow-hidden z-[200]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.1),transparent_70%)]" />
        
        <div className="relative w-64 h-64 mb-12 z-10 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-purple-500/20" 
          />
          <div className="w-32 h-32 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center justify-center relative backdrop-blur-3xl rotate-45">
             <div className="rotate-[-45deg]">
                <Shield size={40} className="text-purple-400 animate-pulse" />
             </div>
          </div>
          {[1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 2 }}
              className="absolute inset-0 rounded-full border border-purple-400/10"
            />
          ))}
        </div>

        <div className="space-y-4 z-10">
          <span className="text-[9px] font-black tracking-[0.8em] text-purple-400/60 uppercase italic">Signal Transmitted</span>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Neural <span className="text-purple-400">Await</span></h2>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] italic leading-relaxed max-w-xs mx-auto">
            Tactical challenge issued to <span className="text-white">{opponent?.name || 'Peer Node'}</span>.<br/>Synchronizing combat interface...
          </p>
        </div>

        <button 
          onClick={() => navigate('/battle')}
          className="absolute bottom-16 px-10 py-4 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-red-500 hover:bg-red-500/10 transition-all z-10 italic"
        >
          Retract Challenge
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════
  //  RENDER: LOADING
  // ════════════════════════════════════════
  if (!duel) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200]">
        <div className="relative">
           <Loader2 className="text-cyan-500 animate-spin" size={48} />
           <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse" />
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic mt-8">Reconstructing Combat Link...</span>
      </div>
    );
  }

  // ════════════════════════════════════════
  //  RENDER: ACTIVE DUEL
  // ════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden z-[150] font-sans">
      {/* Background FX */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-all duration-1000 blur-[120px] opacity-20",
        duel.mode === 'deck' 
          ? "bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.4),transparent_60%)]" 
          : "bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.3),transparent_60%)]"
      )} />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

      {/* Header HUD */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/battle')} 
            className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-10 w-[1px] bg-white/10" />
          <div>
            <div className={cn(
              "text-[10px] font-black uppercase tracking-[0.5em] italic mb-1",
              duel.mode === 'deck' ? "text-purple-400" : "text-cyan-400"
            )}>{phase}</div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Circuit: {duelId?.slice(0, 6)}</h1>
          </div>
        </div>

        {phase === 'TRIAL' && (
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            className={cn(
              "w-16 h-16 rounded-full border-[2px] flex items-center justify-center relative bg-black shadow-2xl",
              timeLeft < 20 ? "border-red-500" : (duel.mode === 'deck' ? "border-purple-500" : "border-blue-500")
            )}>
            <span className={cn("text-2xl font-black tabular-nums italic", timeLeft < 20 ? "text-red-500 animate-pulse" : "text-white")}>{timeLeft}</span>
            {/* Countdown Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle 
                cx="32" cy="32" r="30" 
                fill="none" stroke="currentColor" strokeWidth="1" 
                className={cn("opacity-10", timeLeft < 20 ? "text-red-500" : (duel.mode === 'deck' ? "text-purple-500" : "text-blue-500"))} 
              />
            </svg>
          </motion.div>
        )}

        <div className="flex items-center gap-6">
           <div className="text-right hidden sm:block">
              <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic mb-1 pr-1">Target Identity</div>
              <div className="flex items-center gap-3">
                 <div className="text-sm font-black uppercase tracking-tight truncate max-w-[120px] italic">{opponent?.name || 'ANONYMOUS'}</div>
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              </div>
           </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── EXCHANGE: Type your topic ── */}
          {phase === 'EXCHANGE' && (
            <motion.div key="exchange" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: -30 }}
              className="flex flex-col h-full gap-8 py-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-2xl relative group">
                  <div className="absolute inset-0 bg-cyan-400/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Swords size={32} className="text-cyan-400 relative z-10" />
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                  {duel.mode === 'deck' ? 'Select <span className="text-purple-400">Armament</span>' : 'Deploy <span className="text-cyan-400">Subject</span>'}
                </h2>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.3em] leading-relaxed italic max-w-sm mx-auto">
                  {duel.mode === 'deck' 
                    ? 'Synchronize your neural fragments for combat. Interface activates once both nodes are ready.' 
                    : 'Designate the semantic target for your peer. Engagement begins upon mutual confirmation.'}
                </p>
              </div>

              {duel.mode === 'deck' ? (
                <div className="grid gap-4 overflow-y-auto max-h-[500px] pr-2 pb-6 custom-scrollbar">
                  {isLoading ? (
                    <div className="text-center py-24">
                      <Loader2 size={32} className="text-purple-500 animate-spin mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">Extracting Neural Files...</p>
                    </div>
                  ) : arenaDecks && arenaDecks.length > 0 ? arenaDecks.map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck.id)}
                      disabled={isSyncing || !!duel[myDeckField]}
                      className={cn(
                        "w-full p-6 rounded-3xl border-2 transition-all flex items-center gap-6 text-left relative overflow-hidden group",
                        duel[myDeckField] === deck.id 
                          ? "bg-purple-600/20 border-purple-400 text-white shadow-[0_0_50px_rgba(168,85,247,0.2)]" 
                          : "bg-white/[0.02] border-white/5 hover:border-purple-500/40 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white border border-white/10 shrink-0 shadow-2xl relative", deck.color)}>
                        <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                        <span className="text-xl font-black italic relative z-10">{deck.title.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-black uppercase tracking-tight truncate italic group-hover:text-purple-400 transition-colors">{deck.title}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                           <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">{deck.subject || 'GENERAL'}</span>
                           <div className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest italic">{state.cards.filter(c => c.deckId === deck.id).length} SLICES</span>
                        </div>
                      </div>
                      {duel[myDeckField] === deck.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                          <Zap size={14} className="text-white fill-white" />
                        </motion.div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                  )) : (
                    <div className="system-panel p-16 text-center border-white/5 bg-white/[0.01]">
                      <Search size={48} className="mx-auto mb-6 text-white/5" />
                      <p className="text-[12px] font-black uppercase tracking-[0.4em] text-white/20 italic mb-10">No Armaments Detected</p>
                      <button 
                        onClick={loadArenaDecks}
                        className="px-8 py-4 bg-cyan-600/20 text-cyan-400 border border-cyan-400/20 text-[10px] tracking-[0.3em] uppercase italic hover:bg-cyan-500 hover:text-white transition-all underline underline-offset-8"
                      >
                        Force Tactical Sync
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex-1 flex flex-col group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <textarea
                    value={localTopic}
                    onChange={(e) => setLocalTopic(e.target.value)}
                    placeholder="Enter strategic focus here..."
                    className="flex-1 min-h-[220px] w-full bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-lg font-black italic outline-none focus:border-cyan-400/30 transition-all placeholder:text-white/5 resize-none relative z-10 shadow-2xl"
                  />
                  <div className="absolute bottom-6 right-8 text-[10px] font-black text-white/10 uppercase tracking-[0.3em] z-10 italic">Secure Transcript Channel</div>
                </div>
              )}

              {duel.mode !== 'deck' && (
                <button
                  onClick={handleCommitTopic}
                  disabled={isSyncing || !localTopic.trim() || !!duel[myTopicField]}
                  className={cn(
                    "w-full py-6 rounded-3xl font-black uppercase tracking-[0.5em] text-[12px] transition-all active:scale-[0.98] italic relative overflow-hidden group",
                    duel[myTopicField]
                      ? "bg-white/[0.03] text-white/20 border border-white/5"
                      : "bg-cyan-600 text-white shadow-[0_10px_40px_rgba(6,182,212,0.3)] hover:bg-cyan-500"
                  )}>
                  {duel[myTopicField] ? 'TRANSMISSION SENT — AWAITING FEEDBACK...' : 'Lock Strategic Signal'}
                  {!duel[myTopicField] && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                </button>
              )}
              {duel.mode === 'deck' && duel[myDeckField] && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="flex items-center gap-3">
                     {[1, 2, 3].map(i => (
                       <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                     ))}
                  </div>
                  <div className="text-[11px] font-black text-purple-400 uppercase tracking-[0.4em] italic animate-pulse">
                    Armament Locked — Peer Node Syncing
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── LOBBY: Waiting for both to commit ── */}
          {phase === 'LOBBY' && (
            <motion.div key="lobby" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center h-full text-center gap-10 py-24">
              <div className="relative">
                <Loader2 size={64} className="text-cyan-400 animate-spin relative z-10" />
                <div className="absolute inset-0 blur-2xl bg-cyan-400/30 animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Node <span className="text-cyan-400">Sync</span></h2>
                 <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.4em] leading-relaxed italic max-w-sm">
                   Tactical parameters established.<br/>Initializing combat link with peer node.
                 </p>
              </div>
              <div className="h-px w-24 bg-white/10" />
              <div className="text-[10px] font-black text-cyan-400/50 uppercase tracking-[0.5em] italic animate-pulse">Encryption Handshake Active</div>
            </motion.div>
          )}

          {/* ── TRIAL: Write your answer ── */}
          {phase === 'TRIAL' && (
            <motion.div key="trial" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-full gap-8 py-8">
              
              {duel.mode === 'deck' ? (
                <>
                  <div className="flex justify-between items-center px-4">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic mb-1 pr-1">Current Slice</span>
                       <div className="text-sm font-black text-purple-400 italic">#{currentCardIndex + 1} / {cards.length}</div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic mb-1 pr-1">Total Impact</span>
                       <div className="text-sm font-black text-emerald-400 italic">{score} INFLEXION</div>
                    </div>
                  </div>

                  {cards[currentCardIndex] ? (
                    <div className="flex-1 relative cursor-pointer select-none group" style={{ perspective: '2000px' }} onClick={() => setIsFlipped(!isFlipped)}>
                      {/* Glow effect */}
                      <div className="absolute -inset-10 bg-purple-500/5 blur-[80px] rounded-full opacity-50 transition-opacity" />
                      
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                        className="relative w-full h-full"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Front */}
                        <div 
                          className="absolute inset-0 bg-white/[0.02] border border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
                          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                        >
                          <div className="absolute top-10 left-10 text-[9px] font-black text-purple-400 uppercase tracking-[0.5em] italic">Stimulus Output</div>
                          <div className="text-3xl font-black uppercase italic tracking-tighter text-white underline decoration-purple-500/20 underline-offset-8 decoration-4">{cards[currentCardIndex].front}</div>
                          <div className="absolute bottom-10 text-[10px] font-black text-white/10 uppercase tracking-[0.4em] animate-pulse italic">Tap for Response</div>
                        </div>
                        {/* Back */}
                        <div 
                          className="absolute inset-0 bg-white/[0.03] border border-purple-500/30 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-3xl"
                          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                          <div className="absolute top-10 left-10 text-[9px] font-black text-emerald-400 uppercase tracking-[0.5em] italic">Neural Mapping</div>
                          <div className="text-2xl font-black text-white italic tracking-tight underline decoration-emerald-500/20 underline-offset-8 decoration-4">{cards[currentCardIndex].back || 'DATA VOID'}</div>
                          <div className="absolute bottom-10 text-[10px] font-black text-white/10 uppercase tracking-[0.4em] italic leading-tight">Verify response accuracy</div>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                      <Loader2 size={48} className="text-purple-500 animate-spin" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 px-2 pb-4">
                    <button
                      onClick={() => handleAnswerDeck(false)}
                      className="py-6 rounded-3xl bg-white/[0.03] border border-white/10 text-[12px] font-black uppercase tracking-[0.4em] italic text-white/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all active:scale-95 shadow-xl"
                    >
                      Fragmented
                    </button>
                    <button
                      onClick={() => handleAnswerDeck(true)}
                      className="py-6 rounded-3xl bg-purple-600 text-white text-[12px] font-black uppercase tracking-[0.4em] italic shadow-[0_10px_40px_rgba(168,85,247,0.3)] hover:bg-purple-500 active:scale-95 transition-all overflow-hidden relative group"
                    >
                      Synchronized
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Topic card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500" />
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                          <AlertCircle size={14} className="text-cyan-400" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60 italic">COMBAT ANALYSIS TARGET</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">{duel[theirTopicField] || 'SIGNAL LOST'}</h2>
                  </div>

                  <div className="relative flex-1 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl blur opacity-50" />
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Inject analysis transcript..."
                      className="w-full h-full bg-black border border-white/10 rounded-3xl p-10 text-lg font-black italic outline-none focus:border-red-500/40 transition-all placeholder:text-white/5 resize-none relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                    />
                    <div className="absolute bottom-8 right-10 flex items-center gap-2 z-10 opacity-20">
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Encrypted Uplink Active</span>
                       <Zap size={10} fill="currentColor" />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isSyncing || !answer.trim() || !!duel[myAnswerField]}
                    className={cn(
                      "w-full py-7 rounded-3xl font-black uppercase tracking-[0.5em] text-[12px] transition-all active:scale-[0.98] italic relative overflow-hidden group",
                      duel[myAnswerField]
                        ? "bg-white/[0.03] text-white/20 border border-white/5"
                        : "bg-red-600 text-white shadow-[0_10px_50px_rgba(220,38,38,0.3)] hover:bg-red-500"
                    )}>
                    {duel[myAnswerField] ? 'ANALYSIS TRANSMITTED — WAITING FOR PEER' : 'Deploy Combat Analysis'}
                    {!duel[myAnswerField] && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {phase === 'REVIEW' && (
            <motion.div key="review" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center h-full gap-10 py-10">
              
              <div className="text-center relative">
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, delay: 0.3 }}
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_80px_rgba(168,85,247,0.3)] border border-white/20 mx-auto mb-6 relative z-10 overflow-hidden"
                >
                   <div className="absolute inset-0 bg-black/10" />
                   <Trophy size={48} className="text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </motion.div>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">Circuit <span className="text-cyan-400">Terminated</span></h2>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic mt-4">Synchronization Logic Resolved</div>
              </div>

              <div className="w-full space-y-6 flex-1 overflow-y-auto pr-3 custom-scrollbar pb-10">
                {/* Result Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative group overflow-hidden">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] italic mb-6">Neural Node (You)</div>
                    {duel.mode === 'deck' ? (
                      <div className="text-5xl font-black italic tracking-tighter text-white">{duel[myScoreField]} <span className="text-xs font-normal text-white/20 uppercase tracking-widest ml-1">pts</span></div>
                    ) : (
                      <p className="text-xs text-white/40 italic leading-relaxed line-clamp-6">{duel[myAnswerField]}</p>
                    )}
                    <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyan-400/5 blur-[40px] rounded-full" />
                  </div>
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative group overflow-hidden">
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic mb-6">Peer Node ({opponent?.name || 'OPERATOR'})</div>
                    {duel.mode === 'deck' ? (
                      <div className="text-5xl font-black italic tracking-tighter text-white">{duel[theirScoreField] !== null ? duel[theirScoreField] : '...'} <span className="text-xs font-normal text-white/20 uppercase tracking-widest ml-1">pts</span></div>
                    ) : (
                      <p className="text-xs text-white/40 italic leading-relaxed line-clamp-6">{duel[theirAnswerField] || 'Transmitting neural data...'}</p>
                    )}
                    <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-red-500/5 blur-[40px] rounded-full" />
                  </div>
                </div>

                {/* Peer Review Form */}
                {!hasReviewed && !duel[myRatingField] ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-white/[0.03] border border-white/10 rounded-3xl p-10 space-y-8 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                    
                    <div className="text-center">
                      <h3 className="text-sm font-black uppercase tracking-[0.6em] text-cyan-400 italic">Honour Verification</h3>
                      <p className="text-[10px] text-white/20 mt-3 uppercase font-black italic tracking-[0.2em]">Evaluate peer performance for XP release</p>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative group",
                            rating >= star ? "bg-cyan-500 text-black shadow-[0_0_30px_rgba(34,211,238,0.4)]" : "bg-white/[0.03] text-white/10 border border-white/5 hover:border-white/20"
                          )}
                        >
                          <Zap size={22} fill={rating >= star ? "currentColor" : "none"} className={cn("transition-transform group-hover:scale-110", rating >= star && "rotate-12")} />
                          {rating >= star && (
                             <motion.div layoutId="star-glow" className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Neural feedback regarding peer node performance (Optional)..."
                        className="w-full bg-black border border-white/10 rounded-3xl p-6 text-xs font-medium italic outline-none focus:border-cyan-400/30 transition-all placeholder:text-white/5 resize-none h-28"
                      />
                    </div>

                    <button
                      onClick={handleSubmitReview}
                      disabled={isSyncing || rating === 0}
                      className="w-full py-6 rounded-2xl bg-cyan-600 text-white font-black uppercase tracking-[0.5em] text-[11px] shadow-[0_10px_40px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98] hover:bg-cyan-500 italic relative overflow-hidden group"
                    >
                      <span className="relative z-10">{isSyncing ? 'FINALIZING...' : 'Verify Honour & Release Fragments'}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-12 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                       <Shield size={48} className="text-emerald-500 mx-auto mb-6 opacity-80" />
                    </motion.div>
                    <div className="text-xl font-black uppercase italic tracking-widest text-emerald-500">Signal Verified</div>
                    <p className="text-[10px] text-emerald-500/40 mt-4 font-black uppercase italic tracking-[0.3em] leading-relaxed">XP tokens are being released across the network.<br/>Combat cycle complete.</p>
                  </div>
                )}
              </div>

              <button onClick={() => navigate('/battle')}
                className="w-full py-6 rounded-3xl bg-white/[0.02] border border-white/5 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white/[0.1] hover:text-white text-white/40 transition-all italic active:scale-95 mb-8"
              >
                Return to Battlefront Core
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
