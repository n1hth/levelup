import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Timer, Trophy, Shield, AlertCircle, Send, Loader2, Search } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type DuelPhase = 'SEARCHING' | 'EXCHANGE' | 'TRIAL' | 'REVIEW' | 'FINISHED';

export function ArenaDuel({ searching = false }: { searching?: boolean }) {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { state, addXp, getDuel, updateDuel, joinMatchmaking, leaveMatchmaking, getMatch, createDuel, getFriends } = useApp();
  
  const [duel, setDuel] = useState<any>(null);
  const [phase, setPhase] = useState<DuelPhase>(searching ? 'SEARCHING' : 'EXCHANGE');
  const [timeLeft, setTimeLeft] = useState(90);
  const [localTopic, setLocalTopic] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchingStatus, setSearchingStatus] = useState('Initializing Search...');

  const isPlayer1 = duel?.player1_id === state.user?.id;
  const opponent = isPlayer1 ? duel?.p2 : duel?.p1;

  const fetchDuel = useCallback(async (id: string) => {
    const d = await getDuel(id);
    setDuel(d);
    
    if (!d) return;
    if (d.status === 'setup') setPhase('EXCHANGE');
    else if (d.status === 'active') setPhase('TRIAL');
    else if (d.status === 'review') setPhase('REVIEW');
    else if (d.status === 'finished') setPhase('FINISHED');
  }, [getDuel]);

  // Real-time listener for active duels
  useEffect(() => {
    if (!duelId || searching) return;
    const channel = supabase
      .channel(`arena-duel-${duelId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` }, () => {
        fetchDuel(duelId);
      })
      .subscribe();
    
    fetchDuel(duelId);
    return () => { channel.unsubscribe(); };
  }, [duelId, fetchDuel, searching]);

  // Presence-Based Matchmaking Handshake
  useEffect(() => {
    if (!searching || !state.user) return;
    
    const lobbyChannel = supabase.channel('arena-lobby', {
      config: { presence: { key: state.user.id } }
    });

    lobbyChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = lobbyChannel.presenceState();
        const users = Object.values(presenceState).flat() as any[];
        
        // Find someone else in the lobby
        const opponent = users.find(u => u.user_id !== state.user?.id);
        if (opponent && state.user) {
          // Rule: The player with the "smaller" ID is the Master who creates the duel
          if (state.user.id < opponent.user_id) {
            setSearchingStatus(`Matched with ${opponent.name || 'Hunter'}! Creating Arena...`);
            createDuel('writing', opponent.user_id).then(newId => {
              lobbyChannel.send({
                type: 'broadcast',
                event: 'match_found',
                payload: { duelId: newId, targetId: opponent.user_id }
              });
              setTimeout(() => navigate(`/duels/${newId}`, { replace: true }), 1000);
            });
          }
        }
      })
      .on('broadcast', { event: 'match_found' }, ({ payload }) => {
        if (payload.targetId === state.user?.id) {
          setSearchingStatus('Combat Link Received! Initializing...');
          setTimeout(() => navigate(`/duels/${payload.duelId}`, { replace: true }), 1000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await lobbyChannel.track({ user_id: state.user?.id, name: state.user?.name, online_at: new Date().toISOString() });
          setSearchingStatus('Broadcasting Hunter Signature...');
        }
      });

    return () => { lobbyChannel.unsubscribe(); };
  }, [searching, state.user, createDuel, navigate]);

  // Timer logic
  useEffect(() => {
    if (phase !== 'TRIAL') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const handleCommitTopic = async () => {
    if (!duel || !localTopic) return;
    setIsSyncing(true);
    const updates: any = {};
    if (isPlayer1) updates.p1_topic = localTopic;
    else updates.p2_topic = localTopic;
    
    const newDuel = { ...duel, ...updates };
    if (newDuel.p1_topic && newDuel.p2_topic) updates.status = 'active';
    
    await updateDuel(duel.id, updates);
    setIsSyncing(false);
  };

  const handleFinishTrial = async () => {
    if (!duel || !answer) return;
    setIsSyncing(true);
    const updates: any = {};
    if (isPlayer1) updates.p1_answer = answer;
    else updates.p2_answer = answer;
    
    const newDuel = { ...duel, ...updates };
    if (newDuel.p1_answer && newDuel.p2_answer) updates.status = 'review';
    
    await updateDuel(duel.id, updates);
    setIsSyncing(false);
    addXp(250);
  };

  if (searching) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative w-72 h-72 mb-12 z-10 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-dashed border-blue-500/30 rounded-full" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute inset-8 border-2 border-dashed border-cyan-500/20 rounded-full" />
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-40 h-40 rounded-full bg-blue-600/10 border border-blue-500/40 flex items-center justify-center backdrop-blur-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)]">
             <Search size={48} className="text-blue-500" />
          </motion.div>
        </div>
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4 z-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Neural Network Scan</h2>
        <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.5em] animate-pulse z-10">{searchingStatus}</p>
        <button onClick={() => navigate('/battle')} className="mt-16 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 z-10 transition-colors">Abort Protocol</button>
      </div>
    );
  }

  if (!duel) return <div className="h-screen w-screen flex items-center justify-center bg-slate-950"><Loader2 className="text-blue-500 animate-spin" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col z-10">
        <header className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center border border-white/20 shadow-lg shadow-blue-500/20">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{phase}</div>
              <h1 className="text-lg font-black uppercase italic tracking-tighter">Arena Session #{duelId?.slice(0, 4)}</h1>
            </div>
          </div>
          
          {phase === 'TRIAL' && (
            <div className={cn(
              "w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center relative",
              timeLeft < 20 ? "border-red-500 animate-pulse" : "border-blue-500"
            )}>
               <span className={cn("text-xl font-black", timeLeft < 20 ? "text-red-500" : "text-white")}>{timeLeft}s</span>
            </div>
          )}

          <div className="text-right">
            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest italic">Target</div>
            <div className="text-xs font-black uppercase tracking-tight">{opponent?.name || 'SYNCING...'}</div>
          </div>
        </header>

        <main className="flex-1 p-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
          {phase === 'EXCHANGE' && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 flex flex-col space-y-8 py-12">
               <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Deploy Your <br/> <span className="text-blue-500 text-5xl">Subject</span></h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type the topic your opponent must analyze</p>
               </div>
               
               <div className="flex-1 flex flex-col gap-4">
                  <textarea 
                    value={localTopic} 
                    onChange={(e) => setLocalTopic(e.target.value)}
                    placeholder="ENTER TOPIC..."
                    className="flex-1 w-full bg-slate-900 border-2 border-white/5 rounded-[40px] p-10 text-2xl font-black uppercase outline-none focus:border-blue-500 transition-all placeholder:opacity-20"
                  />
               </div>

               <button 
                 onClick={handleCommitTopic}
                 disabled={isSyncing || !!(isPlayer1 ? duel.p1_topic : duel.p2_topic)}
                 className="w-full py-6 rounded-[32px] bg-blue-600 text-white font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
               >
                 {!!(isPlayer1 ? duel.p1_topic : duel.p2_topic) ? "WAITING FOR OPPONENT..." : "Commit Subject"}
               </button>
            </motion.div>
          )}

          {phase === 'TRIAL' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col space-y-6">
               <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Combat Intel</span>
                  </div>
                  <h2 className="text-3xl font-black mb-1 tracking-tight uppercase italic text-white">Subject: {isPlayer1 ? duel.p2_topic : duel.p1_topic}</h2>
               </div>

               <textarea 
                 value={answer}
                 onChange={(e) => setAnswer(e.target.value)}
                 placeholder="TYPE ANALYSIS..."
                 className="flex-1 w-full bg-slate-900 border-2 border-white/5 rounded-[40px] p-10 text-lg font-bold outline-none focus:border-red-500 transition-all placeholder:opacity-20"
               />

               <button 
                 onClick={handleFinishTrial}
                 disabled={isSyncing || !!(isPlayer1 ? duel.p1_answer : duel.p2_answer)}
                 className="w-full py-6 rounded-[32px] bg-red-600 text-white font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-red-500/20 active:scale-95 transition-all"
               >
                 {!!(isPlayer1 ? duel.p1_answer : duel.p2_answer) ? "DATA SECURED. WAITING..." : "Submit Analysis"}
               </button>
            </motion.div>
          )}

          {phase === 'REVIEW' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/20">
                <Trophy size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Combat Logs <br/> Transmitted</h2>
              <p className="text-slate-400 text-xs font-medium max-w-[240px]">Both analyses have been sent to the Community Syndicate for peer review.</p>
              <button onClick={() => navigate('/battle')} className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em]">Return to Battlefront</button>
            </div>
          )}
        </main>
      </motion.div>
    </div>
  );
}
