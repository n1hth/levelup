import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Swords, Target, Trophy, Search, ChevronRight, Zap, Crown, MessageCircle, Users, Swords as DuelIcon } from 'lucide-react';
import { useApp, type Deck } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

const MIN_CARDS = 4;

export function Battle() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'practice' | 'duels'>('practice');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  // Duel Setup State
  const [duelMode, setDuelMode] = useState<'writing' | 'deck' | null>(null);
  const [duelOpponent, setDuelOpponent] = useState<'random' | 'friend' | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchFound, setMatchFound] = useState<{ id: string; opponent: { id: string; name: string }; topic: string } | null>(null);

  const { state, getDeckCards, getArenaStats, getDeckArenaHistory, joinMatchmaking, leaveMatchmaking, getMatch, getFriends, sendDuelInvite, createDuel } = useApp();
  const [friends, setFriends] = useState<any[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const arenaStats = getArenaStats();
  const eligibleDecks = state.decks.filter(d => getDeckCards(d.id).length >= MIN_CARDS);

  const handleStartMatchmaking = async () => {
    if (!duelMode) return;
    navigate(`/duels/searching?mode=${duelMode}`);
  };

  const handleInviteFriend = async (friendId: string) => {
    setIsInviting(true);
    const mode = duelMode;
    const deckId = mode === 'deck' ? eligibleDecks[0]?.id : undefined;
    
    const duelId = await createDuel(mode as any, friendId, deckId);
    if (!duelId) {
      alert("System Error: Failed to initialize combat link.");
      setIsInviting(false);
      return;
    }

    await sendDuelInvite(friendId, duelId); 
    setIsInviting(false);
    navigate(`/duels/${duelId}`);
    setDuelOpponent(null);
  };

  useEffect(() => {
    if (!state.user) return;
    
    // Listen for incoming friend duels
    const channel = supabase
      .channel('incoming-duels')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'duels', 
        filter: `player2_id=eq.${state.user.id}` 
      }, (payload) => {
        if (payload.new.status === 'setup') {
          // Auto-redirect to the duel
          navigate(`/duels/${payload.new.id}`);
        }
      })
      .subscribe();

    if (activeTab === 'duels') {
      getFriends().then(setFriends);
    }

    // Presence tracking for online friends
    const lobby = supabase.channel('arena-lobby');
    const onSync = () => {
      const state = lobby.presenceState();
      const onlineIds = new Set(Object.values(state).flat().map((p: any) => p.user_id));
      setFriends(prev => prev.map(f => ({ ...f, isOnline: onlineIds.has(f.id) })));
    };

    lobby
      .on('presence', { event: 'sync' }, onSync)
      .subscribe();
    
    return () => { 
      channel.unsubscribe();
      lobby.unsubscribe();
    };
  }, [activeTab, getFriends, state.user, navigate]);

  const DIFFICULTIES = [
    { id: 'blitz', label: 'Blitz', icon: '⚡', time: 15, description: '15s per card — pure instinct', color: '#ef4444' },
    { id: 'standard', label: 'Standard', icon: '🎯', time: 30, description: '30s per card — balanced', color: '#3b82f6' },
    { id: 'marathon', label: 'Marathon', icon: '🏔', time: 60, description: '60s per card — deep recall', color: '#22c55e' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 pb-32"
    >
      {/* Header */}
      <div className="text-center w-full space-y-1">
         <span className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase">Combat Simulation</span>
         <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic">The Battlefront</h2>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-3 system-panel p-1.5 border-white/40">
        <button
          onClick={() => setActiveTab('practice')}
          className={cn(
            "py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all",
            activeTab === 'practice' 
              ? "bg-blue-600 text-white shadow-lg border border-blue-700 aero-gloss" 
              : "text-blue-400 hover:bg-blue-50"
          )}
        >
          <Target size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Arenas</span>
        </button>
        <button
          onClick={() => setActiveTab('duels')}
          className={cn(
            "py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all",
            activeTab === 'duels' 
              ? "bg-red-500 text-white shadow-lg border border-red-600 aero-gloss" 
              : "text-red-400 hover:bg-red-50"
          )}
        >
          <Swords size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Duels</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ ARENA (PRACTICE) ═══ */}
        {activeTab === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Arena Stats */}
            {arenaStats.totalArenas > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { icon: <Swords size={14} className="text-red-500" />, value: arenaStats.totalArenas, label: 'Arenas' },
                  { icon: <Zap size={14} className="text-purple-500" />, value: arenaStats.totalArenaXp, label: 'Arena XP' },
                ].map(s => (
                  <div key={s.label} className="system-panel p-3 flex flex-col items-center justify-center gap-1 border-white/60">
                    {s.icon}
                    <span className="text-sm font-black text-blue-900 leading-none">{s.value}</span>
                    <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Deck Picker */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2 px-1">
                <Trophy size={12} className="text-yellow-500" /> Choose Your Arena
              </h3>

              {eligibleDecks.length === 0 ? (
                <div className="system-panel p-8 text-center border-white/60">
                  <div className="text-4xl mb-3">⚔️</div>
                  <h3 className="text-sm font-black text-blue-900 mb-2">No Eligible Decks</h3>
                  <p className="text-[10px] font-bold text-blue-400 mb-4 leading-relaxed">Create a deck with 4+ cards to enter.</p>
                  <button onClick={() => navigate('/decks')} className="btn-system text-[10px] px-6">Create Deck</button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {eligibleDecks.map((deck, i) => {
                    const cards = getDeckCards(deck.id);
                    const history = getDeckArenaHistory(deck.id);
                    const bestAccuracy = history.length > 0 ? Math.max(...history.map(h => Math.round((h.correctCount / h.totalCards) * 100))) : null;

                    return (
                      <motion.button
                        key={deck.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedDeck(deck)}
                        className="w-full system-panel p-4 border-white/60 flex items-center gap-4 text-left hover:border-blue-300 transition-all active:scale-[0.98] group"
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-lg", deck.color)}>
                          {deck.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-blue-900 truncate tracking-tight">{deck.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-blue-400 uppercase">{cards.length} Cards</span>
                            {bestAccuracy !== null && (
                              <>
                                <span className="text-blue-200">•</span>
                                <span className="text-[9px] font-black text-emerald-500">Best: {bestAccuracy}%</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-blue-200 group-hover:text-blue-400 transition-colors shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ DUELS ═══ */}
        {activeTab === 'duels' && (
          <motion.div
            key="duels"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Duel Setup Flow */}
            <div className="system-panel p-5 border-white/60 shadow-xl bg-white/40">
              <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2"><DuelIcon size={12} className="text-red-500" /> Start a Duel</h3>
              
              <div className="space-y-6">
                {/* 1. Mode Selection */}
                <div>
                  <p className="text-[9px] font-bold text-blue-400 mb-3 uppercase tracking-widest">1. Select Mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { setDuelMode('writing'); setDuelOpponent(null); }}
                      className={cn("p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group", duelMode === 'writing' ? "bg-red-50/50 border-red-500 shadow-lg" : "bg-white border-white hover:border-blue-200 shadow-sm")}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-3 shadow-md"><span className="text-white text-lg">✍️</span></div>
                      <h4 className="text-xs font-black text-blue-900">Writing Duel</h4>
                      <p className="text-[9px] font-bold text-blue-400 mt-1 leading-tight">90s sprint on a random topic</p>
                    </button>
                    <button 
                      onClick={() => { setDuelMode('deck'); setDuelOpponent(null); }}
                      className={cn("p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group", duelMode === 'deck' ? "bg-purple-50/50 border-purple-500 shadow-lg" : "bg-white border-white hover:border-blue-200 shadow-sm")}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-3 shadow-md"><span className="text-white text-lg">🃏</span></div>
                      <h4 className="text-xs font-black text-blue-900">Deck Duel</h4>
                      <p className="text-[9px] font-bold text-blue-400 mt-1 leading-tight">Head-to-head card battle</p>
                    </button>
                  </div>
                </div>

                {/* 2. Opponent Selection */}
                <AnimatePresence>
                  {duelMode && (
                        <div className="pt-2">
                          <p className="text-[9px] font-bold text-blue-400 mb-3 uppercase tracking-widest">2. Select Opponent</p>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <button 
                              onClick={() => setDuelOpponent('random')}
                              className={cn("flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all", duelOpponent === 'random' ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-white border-white hover:border-blue-200")}
                            >
                              <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-xl shrink-0">🎲</div>
                              <span className="text-[10px] font-black uppercase">Random</span>
                            </button>
                            <button 
                              onClick={() => setDuelOpponent('friend')}
                              className={cn("flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all", duelOpponent === 'friend' ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-white border-white hover:border-blue-200")}
                            >
                              <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-xl shrink-0">⚔️</div>
                              <span className="text-[10px] font-black uppercase">Friend</span>
                            </button>
                          </div>

                          {duelOpponent === 'friend' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                              <p className="text-[8px] font-black text-blue-900 uppercase tracking-widest px-1">Select Friend to Challenge</p>
                              <div className="space-y-2">
                                {friends.filter(f => f.status === 'accepted').length > 0 ? (
                                  friends.filter(f => f.status === 'accepted').map(friend => (
                                    <button 
                                      key={friend.id}
                                      onClick={() => setSelectedFriendId(friend.id)}
                                      className={cn(
                                        "w-full p-4 rounded-2xl border transition-all flex items-center justify-between",
                                        selectedFriendId === friend.id ? "bg-blue-600 border-blue-400 text-white shadow-lg" : "bg-white border-blue-50"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs", selectedFriendId === friend.id ? "bg-white/20" : "bg-blue-50 text-blue-600")}>
                                          {friend.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                          <div className="flex items-center gap-2">
                                            <div className={cn("text-xs font-black uppercase", selectedFriendId === friend.id ? "text-white" : "text-blue-900")}>{friend.name}</div>
                                            {friend.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                          </div>
                                          <div className={cn("text-[8px] font-bold uppercase opacity-60")}>
                                            {friend.isOnline ? 'Online' : 'Offline'}
                                          </div>
                                        </div>
                                      </div>
                                      <Zap size={14} className={selectedFriendId === friend.id ? "text-white" : "text-yellow-500"} />
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 opacity-40">
                                    <Users size={32} className="mx-auto mb-2 text-blue-900" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-900">No Friends Found</p>
                                  </div>
                                )}
                              </div>

                              {selectedFriendId && (
                                <motion.button
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  onClick={() => handleInviteFriend(selectedFriendId)}
                                  className={cn(
                                    "w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl transition-all mt-4",
                                    friends.find(f => f.id === selectedFriendId)?.isOnline 
                                      ? "bg-blue-600 text-white shadow-blue-500/20 active:scale-95" 
                                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                  )}
                                >
                                  {isInviting ? "Establishing Link..." : friends.find(f => f.id === selectedFriendId)?.isOnline ? "Initiate Duel" : "Friend Offline"}
                                </motion.button>
                              )}
                            </div>
                          )}
                        </div>
                  )}
                </AnimatePresence>

                {/* 3. Start Button */}
                <AnimatePresence>
                  {duelMode && duelOpponent && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-2">
                      {duelOpponent === 'random' ? (
                        <button 
                          onClick={handleStartMatchmaking}
                          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:brightness-110 transition-all active:scale-[0.97]"
                        >
                          Find Opponent
                        </button>
                      ) : duelOpponent === 'friend' && selectedFriendId ? (
                        <div />
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Duel Rules */}
            <div className="system-panel p-5 border-white/60">
              <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">✍️ <span>Writing Duel Protocol</span></h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { s: '01', t: 'Random Topic', d: 'Both players receive the same prompt' },
                  { s: '02', t: '90s Sprint', d: 'Type your best answer under pressure' },
                  { s: '03', t: 'Peer Review', d: 'Grade each other honestly for XP' },
                  { s: '04', t: 'Consensus', d: 'Community validates final winner' },
                ].map(s => (
                  <div key={s.s} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/40 border border-white">
                    <span className="text-[14px] font-black text-red-500 italic leading-none">{s.s}</span>
                    <span className="text-[10px] font-black text-blue-900 block">{s.t}</span>
                    <span className="text-[8px] font-bold text-blue-400 leading-tight">{s.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty Picker Modal (Same as before but with better mobile logic) */}
      <AnimatePresence>
        {selectedDeck && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center"
            style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)' }}
            onClick={e => e.target === e.currentTarget && setSelectedDeck(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg bg-white rounded-t-[32px] p-6 pb-32 shadow-2xl relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
              <div className="flex items-center justify-between mb-6 pt-2">
                <div>
                  <h3 className="text-lg font-black text-blue-900">{selectedDeck.title}</h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Select Arena Protocol</p>
                </div>
                <button onClick={() => setSelectedDeck(null)} className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors">
                  <ChevronRight size={20} className="rotate-90" />
                </button>
              </div>

              <div className="space-y-3">
                {DIFFICULTIES.map((d, i) => (
                  <motion.button
                    key={d.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    onClick={() => navigate(`/arenas/${selectedDeck.id}/${d.id}`)}
                    className="w-full p-4 rounded-2xl border-2 border-blue-50 bg-blue-50/30 flex items-center gap-4 text-left hover:border-blue-200 transition-all active:scale-[0.98] group shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner" style={{ background: `${d.color}15`, border: `2px solid ${d.color}30` }}>
                      {d.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-blue-900 tracking-tight">{d.label}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: d.color, background: `${d.color}15` }}>
                          {d.time}s
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-blue-400 mt-0.5">{d.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-blue-200 group-hover:text-blue-400 transition-colors shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
