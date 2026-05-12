import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Timer, Trophy, Shield, AlertCircle, Send, Loader2, Search } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type DuelPhase = 'SEARCHING' | 'EXCHANGE' | 'TRIAL' | 'REVIEW' | 'FINISHED';

export function ArenaDuel() {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { state, addXp, getDuel, updateDuel } = useApp();
  
  const [duel, setDuel] = useState<any>(null);
  const [phase, setPhase] = useState<DuelPhase>('SEARCHING');
  const [timeLeft, setTimeLeft] = useState(90);
  const [localTopic, setLocalTopic] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const isPlayer1 = duel?.player1_id === state.user?.id;
  const opponent = isPlayer1 ? duel?.p2 : duel?.p1;

  const fetchDuel = useCallback(async () => {
    if (!duelId) return;
    const d = await getDuel(duelId);
    setDuel(d);
    
    // Phase calculation
    if (!d) return;
    if (d.player2_id === 'searching') {
      setPhase('SEARCHING');
    } else if (d.status === 'setup') {
      setPhase('EXCHANGE');
    } else if (d.status === 'active') {
      setPhase('TRIAL');
    } else if (d.status === 'review') {
      setPhase('REVIEW');
    } else if (d.status === 'finished') {
      setPhase('FINISHED');
    }
  }, [duelId, getDuel]);

  // Real-time listener
  useEffect(() => {
    if (!duelId) return;
    const channel = supabase
      .channel(`arena-duel-${duelId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` }, () => {
        fetchDuel();
      })
      .subscribe();
    
    fetchDuel();
    return () => { channel.unsubscribe(); };
  }, [duelId, fetchDuel]);

  // Random Matchmaking Worker (If searching)
  useEffect(() => {
    if (phase !== 'SEARCHING' || !duelId) return;
    
    const interval = setInterval(async () => {
      // Look for anyone else searching
      const { data: queue } = await supabase.from('matchmaking_queue').select('*').neq('user_id', state.user?.id).limit(1).maybeSingle();
      if (queue) {
        clearInterval(interval);
        // Link them
        await supabase.from('duels').update({ player2_id: queue.user_id, status: 'setup' }).eq('id', duelId);
        await supabase.from('matchmaking_queue').delete().eq('user_id', queue.user_id);
        fetchDuel();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [phase, duelId, state.user?.id, fetchDuel]);

  // Timer logic (Only in TRIAL)
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
    
    // Check if both ready
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

  if (!duel) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900"><Loader2 className="text-blue-500 animate-spin" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'SEARCHING' ? (
          <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
            <div className="relative w-64 h-64 mb-12">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-dashed border-blue-500/20 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border-2 border-dashed border-cyan-500/10 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search size={48} className="text-blue-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Scanning Neural Network</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Combat Link...</p>
            <button onClick={() => navigate('/battle')} className="mt-12 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">Abort Protocol</button>
          </motion.div>
        ) : (
          <motion.div key="combat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col z-10">
            {/* HUD */}
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
        )}
      </AnimatePresence>
    </div>
  );
}
