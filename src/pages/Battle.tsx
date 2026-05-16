import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Swords, Target, Trophy, Search, ChevronRight, Zap, Crown, MessageCircle, Users, Swords as DuelIcon, Shield } from 'lucide-react';
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
    // Stay here, or could show a "Waiting" state
    alert("Challenge Sent! Waiting for opponent to accept...");
    setDuelOpponent(null);
  };

  useEffect(() => {
    if (!state.user) return;
    
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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && state.user) {
          await lobby.track({
            user_id: state.user.id,
            name: state.user.name,
            status: 'online',
            ts: Date.now()
          });
        }
      });
    
    return () => { 
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
      className="space-y-6 md:space-y-8 pb-32"
    >
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
            <span className="text-[6px] md:text-[8px] font-black tracking-[0.4em] text-white/20 uppercase italic">Neural Battlefront Core</span>
          </div>
          <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-2">
            ARENA <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">ENGAGEMENT</span>
          </h2>
        </div>

        {/* HUD Stats - Streamlined for Mobile */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 bg-white/[0.01] border border-white/5 rounded-lg backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[5px] font-black text-white/10 uppercase tracking-widest leading-none mb-0.5">SESSIONS</span>
              <span className="text-[10px] md:text-sm font-black text-white tabular-nums italic leading-none">{arenaStats.totalArenas}</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[5px] font-black text-white/10 uppercase tracking-widest leading-none mb-0.5">TOTAL XP</span>
              <span className="text-[10px] md:text-sm font-black text-cyan-400 tabular-nums italic leading-none">+{arenaStats.totalArenaXp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="sticky top-4 z-40 px-4">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-3xl shadow-2xl">
          <button
            onClick={() => setActiveTab('practice')}
            className={cn(
              "py-2.5 md:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all relative overflow-hidden group",
              activeTab === 'practice' 
                ? "bg-white/[0.05] text-cyan-400 border border-cyan-400/20" 
                : "text-white/20 hover:text-white/40"
            )}
          >
            {activeTab === 'practice' && <motion.div layoutId="tab-bg" className="absolute inset-0 bg-cyan-400/5 blur-lg" />}
            <Target size={14} className="md:size-[18px]" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] italic relative z-10 transition-all group-active:scale-95">Neural Arenas</span>
          </button>
          <button
            onClick={() => setActiveTab('duels')}
            className={cn(
              "py-2.5 md:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all relative overflow-hidden group",
              activeTab === 'duels' 
                ? "bg-white/[0.05] text-red-500 border border-red-500/20" 
                : "text-white/20 hover:text-white/40"
            )}
          >
            {activeTab === 'duels' && <motion.div layoutId="tab-bg" className="absolute inset-0 bg-red-500/5 blur-lg" />}
            <Swords size={14} className="md:size-[18px]" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] italic relative z-10 transition-all group-active:scale-95">Active Duels</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* practice tab */}
        {activeTab === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 px-4"
          >
            {/* Bento Grid Decks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em] italic flex items-center gap-3">
                  <Trophy size={12} className="text-yellow-500/50" /> Tactical Deployment zones
                </h3>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{eligibleDecks.length} ACTIVE DOMAINS</span>
              </div>

              {eligibleDecks.length === 0 ? (
                <div className="system-panel p-12 md:p-20 text-center border-white/5 bg-white/[0.01] rounded-3xl md:rounded-[3rem]">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                    <Swords size={24} className="md:size-[40px] text-white/5" />
                  </div>
                  <h3 className="text-base md:text-xl font-black text-white mb-2 md:mb-3 italic uppercase tracking-wider">Arsenal Depleted</h3>
                  <p className="text-[8px] md:text-[10px] font-black text-white/10 mb-8 md:mb-10 uppercase tracking-[0.2em] md:tracking-[0.3em] max-w-[200px] md:max-w-xs mx-auto italic leading-relaxed">
                    Minimum requirement: 4 neural fragments.
                  </p>
                  <button onClick={() => navigate('/decks')} className="px-8 md:px-10 py-4 md:py-5 bg-cyan-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] italic rounded-xl md:rounded-2xl hover:bg-cyan-500 transition-all shadow-2xl shadow-cyan-900/20 active:scale-95">REPLENISH ARSENAL</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {eligibleDecks.map((deck, i) => {
                    const cards = getDeckCards(deck.id);
                    const history = getDeckArenaHistory(deck.id);
                    const bestAccuracy = history.length > 0 ? Math.max(...history.map(h => Math.round((h.correctCount / h.totalCards) * 100))) : null;

                    return (
                      <motion.button
                        key={deck.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4, borderColor: 'rgba(34,211,238,0.2)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                        onClick={() => setSelectedDeck(deck)}
                        className="w-full system-panel p-3.5 md:p-6 border-white/5 bg-white/[0.01] flex flex-col gap-3 md:gap-6 text-left transition-all active:scale-[0.98] group relative overflow-hidden rounded-xl md:rounded-[2.5rem]"
                      >
                        <div className="flex items-start justify-between">
                          <div className={cn("w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-2xl flex items-center justify-center text-white text-lg md:text-2xl font-black shrink-0 shadow-2xl relative border border-white/10 overflow-hidden", deck.color)}>
                            <div className="absolute inset-0 bg-black/10" />
                            <span className="relative z-10 italic">{deck.title.charAt(0).toUpperCase()}</span>
                          </div>
                          {bestAccuracy !== null && (
                            <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                               <span className="text-[6px] md:text-[8px] font-black text-cyan-400 italic uppercase tracking-widest">ACC: {bestAccuracy}%</span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-base md:text-xl font-black text-white truncate tracking-tighter italic uppercase group-hover:text-cyan-400 transition-colors">{deck.title}</h4>
                          <div className="flex items-center gap-3 mt-0.5 md:mt-2">
                            <span className="text-[7px] md:text-[9px] font-black text-white/10 uppercase italic tracking-widest flex items-center gap-1.5">
                              <Zap className="size-2 md:size-2.5 text-cyan-400/30" /> {cards.length} FRAGS
                            </span>
                          </div>
                        </div>

                        <div className="pt-2.5 md:pt-4 border-t border-white/5 flex items-center justify-between">
                           <span className="text-[6px] md:text-[8px] font-black text-white/5 uppercase tracking-[0.2em] md:tracking-[0.4em] italic group-hover:text-cyan-400/40 transition-colors">Tactical Deployment Available</span>
                           <ChevronRight className="size-2.5 md:size-3 text-white/10 group-hover:text-cyan-400 transition-all group-hover:translate-x-1" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* duels tab */}
        {activeTab === 'duels' && (
          <motion.div
            key="duels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 px-4 pb-20"
          >
            {/* Mission Terminal Setup */}
            <div className="space-y-4 md:space-y-6">
              <div className="system-panel p-5 md:p-10 border-white/5 bg-white/[0.01] rounded-3xl md:rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                   <Target size={120} className="text-white rotate-12" />
                </div>

                <div className="relative z-10 space-y-6 md:space-y-10">
                  {/* Step 1: Mode */}
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[10px] md:text-xs font-black text-red-500 italic shrink-0">01</div>
                      <h3 className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic mb-0.5">Engagement Protocol</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {[
                        { id: 'writing', label: 'Semantic Sprint', icon: '✍️', desc: '90s linguistic overload', color: 'red' },
                        { id: 'deck', label: 'Fragment Clash', icon: '🃏', desc: 'Neural deck combat', color: 'purple' },
                      ].map(mode => (
                        <button 
                          key={mode.id}
                          onClick={() => { setDuelMode(mode.id as any); setDuelOpponent(null); }}
                          className={cn(
                            "group p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all text-left relative overflow-hidden",
                            duelMode === mode.id 
                              ? `bg-${mode.color}-500/10 border-${mode.color}-500/30 ring-1 ring-${mode.color}-500/20` 
                              : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all",
                              duelMode === mode.id ? `bg-${mode.color}-500/20 text-white` : "bg-white/[0.03] text-white/20"
                            )}>
                              <span className="text-lg md:text-xl">{mode.icon}</span>
                            </div>
                            <div className="min-w-0">
                               <h4 className={cn("text-[11px] md:text-sm font-black uppercase italic tracking-wider truncate", duelMode === mode.id ? "text-white" : "text-white/40")}>{mode.label}</h4>
                               <p className="text-[8px] md:text-[9px] font-black text-white/10 uppercase tracking-widest italic mt-0.5 truncate">{mode.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Opponent - Interactive Inline */}
                  <AnimatePresence>
                    {duelMode && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 md:space-y-6 pt-6 md:pt-10 border-t border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] md:text-xs font-black text-cyan-400 italic shrink-0">02</div>
                          <h3 className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic mb-0.5">Designate Target</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          {[
                            { id: 'random', label: 'Neural Queue', icon: '🎲', desc: 'Scan for global peers' },
                            { id: 'friend', label: 'Direct Strike', icon: '⚔️', desc: 'Target synced contact' },
                          ].map(opp => (
                            <button 
                              key={opp.id}
                              onClick={() => setDuelOpponent(opp.id as any)}
                              className={cn(
                                "group p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all text-left relative overflow-hidden",
                                duelOpponent === opp.id 
                                  ? "bg-cyan-500/10 border-cyan-400/30 ring-1 ring-cyan-500/20" 
                                  : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                              )}
                            >
                               <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all",
                                  duelOpponent === opp.id ? "bg-cyan-400/20 text-cyan-400" : "bg-white/[0.03] text-white/20"
                                )}>
                                  <span className="text-lg md:text-xl">{opp.icon}</span>
                                </div>
                                <div className="min-w-0">
                                   <h4 className={cn("text-[11px] md:text-sm font-black uppercase italic tracking-wider truncate", duelOpponent === opp.id ? "text-white" : "text-white/40")}>{opp.label}</h4>
                                   <p className="text-[8px] md:text-[9px] font-black text-white/10 uppercase tracking-widest italic mt-0.5 truncate">{opp.desc}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Inline Expandable Action Area */}
                        <AnimatePresence mode="wait">
                          {duelOpponent === 'random' && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-cyan-400/5 border border-cyan-400/10 mt-4"
                            >
                               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
                                  <div className="space-y-1 text-center sm:text-left">
                                     <h4 className="text-[9px] md:text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Synchronizing...</h4>
                                     <p className="text-[8px] md:text-[9px] font-black text-white/20 uppercase italic max-w-xs leading-tight">Connecting to Neural Battlefront for peer matching.</p>
                                  </div>
                                  <button 
                                    onClick={handleStartMatchmaking}
                                    className="w-full sm:w-auto px-8 md:px-12 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-cyan-500 text-black font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] italic shadow-2xl hover:bg-cyan-400 transition-all active:scale-95 shrink-0"
                                  >
                                    INITIATE QUEUE
                                  </button>
                               </div>
                            </motion.div>
                          )}

                          {duelOpponent === 'friend' && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-6 mt-6"
                            >
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {friends.filter(f => f.status === 'accepted').map(friend => (
                                    <button 
                                      key={friend.id}
                                      onClick={() => setSelectedFriendId(friend.id)}
                                      className={cn(
                                        "p-4 rounded-2xl border transition-all flex items-center gap-4 group",
                                        selectedFriendId === friend.id 
                                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" 
                                          : "bg-white/[0.01] border-white/5 hover:border-white/10"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] italic shrink-0",
                                        selectedFriendId === friend.id ? "bg-cyan-400 text-black" : "bg-white/[0.03] text-white/40"
                                      )}>
                                        {friend.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="text-left min-w-0">
                                         <div className="text-[10px] font-black uppercase tracking-tight truncate">{friend.name}</div>
                                         <div className={cn("text-[6px] font-black uppercase tracking-widest italic", friend.isOnline ? "text-cyan-400" : "text-white/10")}>
                                            {friend.isOnline ? 'LINK ACTIVE' : 'OFFLINE'}
                                         </div>
                                      </div>
                                    </button>
                                  ))}
                               </div>
                               <button 
                                  disabled={!selectedFriendId || !friends.find(f => f.id === selectedFriendId)?.isOnline}
                                  onClick={() => selectedFriendId && handleInviteFriend(selectedFriendId)}
                                  className={cn(
                                    "w-full py-5 rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl transition-all italic",
                                    selectedFriendId && friends.find(f => f.id === selectedFriendId)?.isOnline
                                      ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20 active:scale-95" 
                                      : "bg-white/5 text-white/10 cursor-not-allowed"
                                  )}
                               >
                                  {isInviting ? "LOCKING NEURAL LINK..." : "STRIKE TARGET"}
                               </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Combat Logs / Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="system-panel p-5 md:p-8 border-white/5 bg-white/[0.01] rounded-[1.5rem] md:rounded-[2.5rem]">
                <h3 className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic mb-6 md:mb-8 flex items-center gap-3">
                   <Target size={12} className="text-cyan-500/50" /> Combat Protocols
                </h3>
                <div className="space-y-4 md:space-y-6">
                  {[
                    { id: '01', title: 'SYNCHRONICITY', text: 'Seal lock before link.' },
                    { id: '02', title: 'HONOUR BOND', text: 'Mutual validation required.' },
                  ].map(p => (
                    <div key={p.id} className="flex gap-3 md:gap-4">
                      <span className="text-[10px] md:text-sm font-black text-cyan-400 italic opacity-40 shrink-0">{p.id}</span>
                      <div className="space-y-0.5 md:space-y-1">
                        <div className="text-[8px] md:text-[10px] font-black text-white/60 italic uppercase tracking-widest">{p.title}</div>
                        <p className="text-[7px] md:text-[9px] font-bold text-white/5 uppercase italic leading-tight tracking-wider">{p.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="system-panel p-5 md:p-8 border-white/5 bg-white/[0.01] rounded-[1.5rem] md:rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(239,68,68,0.03),transparent_60%)]" />
                <h3 className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic mb-6 md:mb-8 flex items-center gap-3">
                   <Swords size={12} className="text-red-500/50" /> Security Advisory
                </h3>
                <div className="p-4 md:p-6 rounded-lg md:rounded-2xl bg-white/[0.01] border border-white/5">
                   <p className="text-[7px] md:text-[9px] font-black text-white/10 uppercase italic leading-tight tracking-widest">
                     Engagement requires neural stability. Protocol abortion leads to penalty.
                   </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Difficulty Picker Modal */}
      <AnimatePresence>
        {selectedDeck && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(20px)' }}
            onClick={e => e.target === e.currentTarget && setSelectedDeck(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg bg-slate-950 border-t border-white/10 rounded-t-[32px] p-6 pb-32 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full mt-3" />
              <div className="flex items-center justify-between mb-8 pt-4">
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedDeck.title}</h3>
                  <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] italic mt-1">Select Combat Difficulty</p>
                </div>
                <button onClick={() => setSelectedDeck(null)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                  <ChevronRight size={24} className="rotate-90" />
                </button>
              </div>

              <div className="space-y-4">
                {DIFFICULTIES.map((d, i) => (
                  <motion.button
                    key={d.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    onClick={() => navigate(`/arenas/${selectedDeck.id}/${d.id}`)}
                    className="w-full p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-5 text-left hover:border-cyan-500/30 transition-all active:scale-[0.98] group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-2xl relative border border-white/10 italic" style={{ background: `${d.color}15` }}>
                      {d.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-white italic tracking-wider uppercase">{d.label}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full italic" style={{ color: d.color, background: `${d.color}15`, border: `1px solid ${d.color}30` }}>
                          {d.time}s
                        </span>
                      </div>
                      <p className="text-[10px] font-black text-white/20 mt-1.5 uppercase italic tracking-widest">{d.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-white/10 group-hover:text-cyan-400 transition-colors shrink-0 group-hover:translate-x-1" />
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
