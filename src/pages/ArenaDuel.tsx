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
  const { state, addXp, getDuel, updateDuel, createDuel } = useApp();
  
  const isSearching = duelId === 'searching';
  
  const [duel, setDuel] = useState<any>(null);
  const [phase, setPhase] = useState<DuelPhase>(isSearching ? 'SEARCHING' : 'LOBBY');
  const [timeLeft, setTimeLeft] = useState(90);
  const [localTopic, setLocalTopic] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchStatus, setSearchStatus] = useState('Initializing...');
  const cleanupRef = useRef<(() => void) | null>(null);

  // Derived state
  const isPlayer1 = duel?.player1_id === state.user?.id;
  const myTopicField = isPlayer1 ? 'p1_topic' : 'p2_topic';
  const theirTopicField = isPlayer1 ? 'p2_topic' : 'p1_topic';
  const myAnswerField = isPlayer1 ? 'p1_answer' : 'p2_answer';
  const theirAnswerField = isPlayer1 ? 'p2_answer' : 'p1_answer';
  const opponent = isPlayer1 ? duel?.p2 : duel?.p1;

  // ── Fetch & phase sync ──
  const syncDuel = useCallback(async (id: string) => {
    if (!id || id === 'searching') return;
    const d = await getDuel(id);
    if (!d) return;
    setDuel(d);
    if (d.status === 'setup') {
      setPhase(d[myTopicField] ? 'LOBBY' : 'EXCHANGE');
    }
    else if (d.status === 'active') setPhase('TRIAL');
    else if (d.status === 'review' || d.status === 'finished') setPhase('REVIEW');
  }, [getDuel, myTopicField]);

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

    const lobby = supabase.channel('arena-lobby', {
      config: { presence: { key: state.user.id } }
    });

    // Also poll duels table as backup
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('duels')
        .select('id')
        .eq('player2_id', state.user!.id)
        .eq('status', 'setup')
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
        const opp = all.find(u => u.user_id !== state.user?.id);
        if (opp && state.user && state.user.id < opp.user_id) {
          hasCreated = true;
          setSearchStatus(`Target Locked: ${opp.name || 'Hunter'}...`);
          createDuel('writing', opp.user_id).then(newId => {
            if (!newId) {
              setSearchStatus('Error creating arena. Retrying...');
              hasCreated = false;
              return;
            }
            lobby.send({
              type: 'broadcast', event: 'match_found',
              payload: { duelId: newId, targetId: opp.user_id }
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
          await lobby.track({
            user_id: state.user?.id,
            name: state.user?.name,
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />

      {/* Header HUD */}
      <header className="relative z-10 px-5 py-4 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/battle')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">{phase}</div>
            <h1 className="text-sm font-black uppercase italic tracking-tight">Arena #{duelId?.slice(0, 6)}</h1>
          </div>
        </div>

        {phase === 'TRIAL' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={cn(
              "w-14 h-14 rounded-full border-[3px] flex items-center justify-center",
              timeLeft < 20 ? "border-red-500" : "border-blue-500"
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
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Deploy Subject</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  Type the topic your opponent must analyze.<br/>Battle starts when both commit.
                </p>
              </div>

              <textarea
                value={localTopic}
                onChange={(e) => setLocalTopic(e.target.value)}
                placeholder="Enter your topic..."
                className="flex-1 min-h-[120px] w-full bg-slate-900/80 border border-white/5 rounded-3xl p-6 text-base font-bold outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/10 resize-none"
              />

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
            </motion.div>
          )}

          {/* ── LOBBY: Waiting for both to commit ── */}
          {phase === 'LOBBY' && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Waiting for Opponent</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Your subject has been committed.<br/>Battle begins when both players are ready.
              </p>
            </motion.div>
          )}

          {/* ── TRIAL: Write your answer ── */}
          {phase === 'TRIAL' && (
            <motion.div key="trial" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full gap-5 py-4">
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
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {phase === 'REVIEW' && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/20">
                <Trophy size={36} className="text-white" />
              </motion.div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Combat Complete</h2>
              <p className="text-slate-400 text-xs font-medium max-w-[260px] leading-relaxed">
                Both analyses submitted. Results sent to the Community Syndicate for peer review.
              </p>
              <div className="w-full space-y-3 mt-4">
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 text-left">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Your Answer</div>
                  <p className="text-sm text-slate-300">{duel[myAnswerField] || '—'}</p>
                </div>
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 text-left">
                  <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Opponent's Answer</div>
                  <p className="text-sm text-slate-300">{duel[theirAnswerField] || '—'}</p>
                </div>
              </div>
              <button onClick={() => navigate('/battle')}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] mt-4 hover:bg-white/10 transition-colors">
                Return to Battlefront
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
