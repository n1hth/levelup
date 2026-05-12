import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Swords, Target, Trophy, ChevronRight, Zap, Users, Swords as DuelIcon } from 'lucide-react';
import { useApp, type Deck } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

const MIN_CARDS = 4;

export function Battle() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'practice' | 'duels'>('practice');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  // Duel Setup
  const [duelMode, setDuelMode] = useState<'writing' | 'deck'>('writing');
  const [targetType, setTargetType] = useState<'random' | 'friend'>('random');
  const [isMatching, setIsMatching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const { state, getDeckCards, getArenaStats, getFriends, joinMatchmaking, leaveMatchmaking, getMatch, createDuel, sendDuelInvite } = useApp();
  const [friends, setFriends] = useState<any[]>([]);

  const arenaStats = getArenaStats();
  const eligibleDecks = state.decks.filter(d => getDeckCards(d.id).length >= MIN_CARDS);

  useEffect(() => {
    if (activeTab === 'duels') {
      getFriends().then(setFriends);
    }
  }, [activeTab, getFriends]);

  const handleStartMatchmaking = async () => {
    setIsMatching(true);
    const mode = duelMode;
    const deckId = mode === 'deck' ? eligibleDecks[0]?.id : 'writing_mode';
    await joinMatchmaking(deckId);
    
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const match = await getMatch();
      if (match) {
        clearInterval(interval);
        let duelId = (match as any).duelId;
        
        if (!duelId) {
          // We found someone, we create the duel and update their entry
          duelId = await createDuel(mode, (match as any).opponentId);
          await supabase.from('matchmaking_queue').update({ matched_duel_id: duelId }).eq('user_id', (match as any).opponentId);
        }

        setIsMatching(false);
        navigate(`/duels/${duelId}`);
        await leaveMatchmaking();
      }
      if (attempts > 40) {
        clearInterval(interval);
        setIsMatching(false);
        await leaveMatchmaking();
        alert("No opponents found. Try again later.");
      }
    }, 1500);
  };

  const handleInviteFriend = async (friendId: string) => {
    setIsInviting(true);
    const mode = duelMode;
    const deckId = mode === 'deck' ? eligibleDecks[0]?.id : undefined;
    
    const duelId = await createDuel(mode, friendId, deckId);
    if (!duelId) {
      alert("System Error: Failed to initialize combat link.");
      setIsInviting(false);
      return;
    }

    await sendDuelInvite(friendId, duelId); 
    setIsInviting(false);
    navigate(`/duels/${duelId}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-32">
      {/* Header */}
      <div className="text-center w-full space-y-1">
         <span className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase">Combat Simulation</span>
         <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic">The Battlefront</h2>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-3 system-panel p-1.5 border-white/40">
        <button onClick={() => setActiveTab('practice')} className={cn("py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all", activeTab === 'practice' ? "bg-blue-600 text-white shadow-lg border border-blue-700" : "text-blue-400")}>
          <Target size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Arenas</span>
        </button>
        <button onClick={() => setActiveTab('duels')} className={cn("py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all", activeTab === 'duels' ? "bg-red-500 text-white shadow-lg border border-red-600" : "text-red-400")}>
          <Swords size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Duels</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'duels' && (
          <motion.div key="duels" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="system-panel p-6 border-white/60 bg-white/40 shadow-xl">
              <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <DuelIcon size={12} className="text-red-500" /> Start a Duel
              </h3>
              
              <div className="space-y-8">
                {/* 1. Mode */}
                <div>
                  <p className="text-[9px] font-bold text-blue-400 mb-3 uppercase tracking-widest italic">1. Select Mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setDuelMode('writing')} className={cn("p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden", duelMode === 'writing' ? "bg-red-50 border-red-500 shadow-md" : "bg-white border-white")}>
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center mb-3 shadow-sm"><span className="text-white text-lg">✍️</span></div>
                      <h4 className="text-[10px] font-black text-blue-900">Writing Duel</h4>
                      <p className="text-[8px] font-bold text-blue-400 mt-1">90s sprint on a random topic</p>
                    </button>
                    <button onClick={() => setDuelMode('deck')} className={cn("p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden", duelMode === 'deck' ? "bg-purple-50 border-purple-500 shadow-md" : "bg-white border-white")}>
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center mb-3 shadow-sm"><span className="text-white text-lg">🃏</span></div>
                      <h4 className="text-[10px] font-black text-blue-900">Deck Duel</h4>
                      <p className="text-[8px] font-bold text-blue-400 mt-1">Head-to-head card battle</p>
                    </button>
                  </div>
                </div>

                {/* 2. Target */}
                <div>
                  <p className="text-[9px] font-bold text-blue-400 mb-3 uppercase tracking-widest italic">2. Select Opponent</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button onClick={() => setTargetType('random')} className={cn("flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all", targetType === 'random' ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-white border-white hover:border-blue-200")}>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🎲</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Random</span>
                    </button>
                    <button onClick={() => setTargetType('friend')} className={cn("flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all", targetType === 'friend' ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-white border-white hover:border-blue-200")}>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">⚔️</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Friend</span>
                    </button>
                  </div>
                </div>

                {/* 3. Action Area */}
                <div className="pt-2">
                  {targetType === 'random' ? (
                    <button 
                      onClick={handleStartMatchmaking}
                      disabled={isMatching}
                      className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      {isMatching ? "Searching Network..." : "Find Match"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[8px] font-black text-blue-900 uppercase tracking-widest px-1">Select Friend to Challenge</p>
                      {friends.filter(f => f.status === 'accepted').length > 0 ? (
                        friends.filter(f => f.status === 'accepted').map(friend => (
                          <button key={friend.id} onClick={() => handleInviteFriend(friend.id)} className="w-full p-4 rounded-2xl bg-white border border-blue-50 flex items-center justify-between hover:border-blue-500 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">{friend.name.charAt(0)}</div>
                              <span className="text-[10px] font-black text-blue-900 uppercase">{friend.name}</span>
                            </div>
                            <Zap size={14} className="text-yellow-500" />
                          </button>
                        ))
                      ) : (
                        <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 opacity-40">
                          <Users size={32} className="mx-auto mb-2" />
                          <p className="text-[9px] font-black uppercase tracking-widest">No Friends Found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
