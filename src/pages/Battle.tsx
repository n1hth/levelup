import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Swords, Target, Trophy, ChevronRight, Zap, Users, Swords as DuelIcon } from 'lucide-react';
import { useApp, type Deck } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';

const MIN_CARDS = 4;

export function Battle() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'practice' | 'duels'>('practice');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  // Simplified Duel Setup for UI Walkthrough
  const [duelMode, setDuelMode] = useState<'writing' | 'deck'>('writing');
  const [targetType, setTargetType] = useState<'random' | 'friend'>('random');

  const { state, getDeckCards, getArenaStats, getFriends, createDuel, sendDuelInvite } = useApp();
  const [friends, setFriends] = useState<any[]>([]);

  const eligibleDecks = state.decks.filter(d => getDeckCards(d.id).length >= MIN_CARDS);

  useEffect(() => {
    if (activeTab === 'duels') {
      getFriends().then(setFriends);
    }
  }, [activeTab, getFriends]);

  const handleInitiateDuel = async (friendId?: string) => {
    // For UI walkthrough, we navigate directly to the new ArenaDuel page
    // In production, this would create the record and notify
    const mockDuelId = "ui-test-session";
    navigate(`/duels/${mockDuelId}`);
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
                <DuelIcon size={12} className="text-red-500" /> Duel Configuration
              </h3>
              
              <div className="space-y-8">
                {/* 1. Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setDuelMode('writing')} className={cn("p-4 rounded-2xl border-2 transition-all text-left", duelMode === 'writing' ? "bg-red-50/50 border-red-500 shadow-lg" : "bg-white border-white")}>
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center mb-3 shadow-md">✍️</div>
                    <h4 className="text-xs font-black text-blue-900">Writing</h4>
                  </button>
                  <button onClick={() => setDuelMode('deck')} className={cn("p-4 rounded-2xl border-2 transition-all text-left", duelMode === 'deck' ? "bg-purple-50/50 border-purple-500 shadow-lg" : "bg-white border-white")}>
                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center mb-3 shadow-md">🃏</div>
                    <h4 className="text-xs font-black text-blue-900">Deck</h4>
                  </button>
                </div>

                {/* 2. Target */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button onClick={() => setTargetType('random')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", targetType === 'random' ? "bg-blue-600 text-white shadow-lg" : "text-blue-400")}>
                    Random Hunter
                  </button>
                  <button onClick={() => setTargetType('friend')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", targetType === 'friend' ? "bg-blue-600 text-white shadow-lg" : "text-blue-400")}>
                    Syndicate Member
                  </button>
                </div>

                {/* 3. Action */}
                {targetType === 'random' ? (
                  <button onClick={() => handleInitiateDuel()} className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[12px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                    Find Match
                  </button>
                ) : (
                  <div className="space-y-3">
                    {friends.filter(f => f.status === 'accepted').length > 0 ? (
                      friends.filter(f => f.status === 'accepted').map(friend => (
                        <button key={friend.id} onClick={() => handleInitiateDuel(friend.id)} className="w-full p-4 rounded-2xl bg-white border border-blue-50 flex items-center justify-between hover:border-blue-500 transition-all shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">{friend.name.charAt(0)}</div>
                            <span className="text-[10px] font-black text-blue-900 uppercase">{friend.name}</span>
                          </div>
                          <Swords size={16} className="text-blue-400" />
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
