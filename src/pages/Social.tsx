import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Trophy,  MessageCircle, 
  Send, 
  Search, 
  Plus, 
  Zap, 
  ChevronRight, 
  MessageSquare, 
  Trash2, 
  Check,
  AtSign,
  UserPlus,
  Crown,
  Globe
} from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { getRankColor, getRankTitle } from '@/src/lib/xp.ts';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type Tab = 'friends' | 'guilds' | 'ranks' | 'dms' | 'community';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'guilds', label: 'Guilds', icon: Shield },
  { id: 'community', label: 'Community', icon: Globe },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
  { id: 'dms', label: 'DMs', icon: MessageCircle },
];

export function Social() {
  const { state, getLevel, getRank, searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getLeaderboard, sendMessage, getMessages, voteDuel } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friendSearch, setFriendSearch] = useState('');
  const [guildSearch, setGuildSearch] = useState('');
  const [dmInput, setDmInput] = useState('');
  const [selectedDm, setSelectedDm] = useState<string | null>(null);
  const [communityDuels, setCommunityDuels] = useState<any[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; username?: string; total_xp: number }[]>([]);
  const [friends, setFriends] = useState<{ friendshipId: string; id: string; name: string; username?: string; status: string; total_xp: number; isIncoming: boolean }[]>([]);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; total_xp: number; rank: string }[]>([]);
  const [messages, setMessages] = useState<{ id: string; sender_id: string; content: string; created_at: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const level = getLevel();
  const rank = getRank();
  const rankColor = getRankColor(rank);
  const rankTitle = getRankTitle(rank);

  useEffect(() => {
    if (activeTab === 'friends') {
      getFriends().then(setFriends);
    } else if (activeTab === 'ranks') {
      getLeaderboard().then(setLeaderboard);
    } else if (activeTab === 'community') {
      supabase.from('duels')
        .select('*, p1:profiles!duels_player1_id_fkey(name), p2:profiles!duels_player2_id_fkey(name)')
        .eq('status', 'community')
        .order('created_at', { ascending: false })
        .then(({ data }) => setCommunityDuels(data || []));
    }
  }, [activeTab, getFriends, getLeaderboard]);

  useEffect(() => {
    if (selectedDm) {
      getMessages(selectedDm).then(setMessages);
      
      const channel = supabase
        .channel(`messages:${selectedDm}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, (payload) => {
          const newMsg = payload.new as any;
          if ((newMsg.sender_id === selectedDm && newMsg.receiver_id === state.user?.id) || 
              (newMsg.sender_id === state.user?.id && newMsg.receiver_id === selectedDm)) {
            setMessages(prev => [...prev, newMsg]);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedDm, getMessages, state.user?.id]);

  const handleFriendSearch = async (val: string) => {
    setFriendSearch(val);
    if (val.length > 2) {
      setIsSearching(true);
      const results = await searchUsers(val);
      setSearchResults(results.filter(r => r.id !== state.user?.id));
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = async (id: string) => {
    await sendFriendRequest(id);
    setSearchResults(prev => prev.filter(r => r.id !== id));
    getFriends().then(setFriends);
    alert("Friend request sent!");
  };

  const handleAcceptFriend = async (id: string) => {
    setAcceptingIds(prev => new Set(prev).add(id));
    await acceptFriendRequest(id);
    setTimeout(() => {
      getFriends().then(setFriends);
      setAcceptingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  };

  const handleRemoveFriend = async (id: string) => {
    if (confirm("Sever this syndicate link?")) {
      await removeFriend(id);
      getFriends().then(setFriends);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-8">
      <div className="text-center space-y-1">
         <span className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase">Universal Network</span>
         <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic">The Hall of Kings</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/60 border border-white/80 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl transition-all relative",
                activeTab === tab.id ? "bg-blue-600 text-white shadow-lg" : "text-blue-900/40 hover:text-blue-600 hover:bg-blue-50"
              )}
            >
              <Icon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ FRIENDS ═══ */}
        {activeTab === 'friends' && (
          <motion.div key="friends" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" />
              <input type="text" value={friendSearch} onChange={e => handleFriendSearch(e.target.value)} placeholder="SEARCH OPERATORS..."
                className="w-full bg-white border border-blue-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-400 focus:bg-white transition-all text-blue-900 placeholder:text-blue-300 font-black text-[10px] tracking-widest shadow-sm" />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Global Search Results</h3>
                {searchResults.map(user => (
                  <div key={user.id} className="system-panel p-3 border-blue-100 flex items-center justify-between bg-blue-50/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-black text-blue-900 uppercase">{user.name}</div>
                        <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                          <AtSign size={8} /> {user.username || user.name.toLowerCase().replace(/\s/g, '_')}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleAddFriend(user.id)} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      <UserPlus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest px-1">Active Friends</h3>
              {friends.filter(f => f.status === 'accepted').length > 0 ? (
                <div className="space-y-2">
                  {/* Deduplicate by ID just in case */}
                  {Array.from(new Map(friends.filter(f => f.status === 'accepted').map(f => [f.id, f])).values()).map(friend => (
                    <div key={friend.id} className="system-panel p-3 border-white/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400 font-black">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-black text-blue-900 uppercase">{friend.name}</div>
                          <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                            <AtSign size={8} /> {friend.username || friend.name.toLowerCase().replace(/\s/g, '_')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setSelectedDm(friend.id); setActiveTab('dms'); }}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button 
                            onClick={() => handleRemoveFriend(friend.friendshipId)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center system-panel border-white/60">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-white shadow-lg flex items-center justify-center mb-4"><Users size={28} className="text-blue-200" /></div>
                  <h4 className="text-sm font-black text-blue-900 mb-1">No Contacts Found</h4>
                  <p className="text-[10px] font-bold text-blue-400 max-w-[220px] leading-relaxed">Search for other hunters to build your syndicate.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ GUILDS ═══ */}
        {activeTab === 'guilds' && (
          <motion.div key="guilds" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="system-panel p-6 bg-gradient-to-br from-blue-900 to-blue-950 border-blue-900 text-white relative overflow-hidden">
               <div className="absolute inset-0 aero-gloss opacity-20" />
               <h3 className="text-lg font-black tracking-tighter uppercase mb-1 drop-shadow-lg">Heavenly Guild</h3>
               <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em] mb-6">Unify your strength</p>
               <button className="btn-system bg-white text-blue-900 shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                 Create Alliance
               </button>
            </div>
            
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" />
              <input type="text" value={guildSearch} onChange={e => setGuildSearch(e.target.value)} placeholder="LOCATE GUILDS..."
                className="w-full bg-white border border-blue-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-400 focus:bg-white transition-all text-blue-900 placeholder:text-blue-300 font-black text-[10px] tracking-widest shadow-sm" />
            </div>

            <div className="flex flex-col items-center justify-center py-10 text-center system-panel border-white/60">
              <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-white shadow-lg flex items-center justify-center mb-4"><Shield size={28} className="text-purple-200" /></div>
              <h4 className="text-sm font-black text-blue-900 mb-1">Unaffiliated</h4>
              <p className="text-[10px] font-bold text-blue-400 max-w-[220px] leading-relaxed">Join a guild to participate in guild-wide XP raids.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'community' && (
          <motion.div key="community" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
             <div className="system-panel p-6 bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 text-white relative overflow-hidden text-center">
                <div className="absolute inset-0 aero-gloss opacity-20" />
                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Community Hall</h3>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.2em]">Review duels and ensure fairness</p>
             </div>

             <div className="space-y-4">
                {communityDuels.length > 0 ? communityDuels.map(duel => (
                  <div key={duel.id} className="system-panel p-5 border-white/60 space-y-4 bg-white/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Review Log #{duel.id.slice(0, 4)}</span>
                      <div className="px-2 py-1 rounded-full bg-blue-100 text-[8px] font-black text-blue-600 uppercase tracking-widest">{duel.mode} Mode</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-white/60 border border-white">
                        <div className="text-[8px] font-black text-blue-400 uppercase mb-1">{duel.p1.name}'s Answer</div>
                        <p className="text-[10px] font-bold text-blue-900 line-clamp-3">{duel.p1_answer}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                        <div className="text-[8px] font-black text-purple-400 uppercase mb-1">{duel.p2.name}'s Correction</div>
                        <p className="text-[10px] font-bold text-purple-900">{duel.p2_correction}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => { voteDuel(duel.id, duel.player2_id, true); setVotedIds(prev => new Set(prev).add(duel.id)); }}
                        disabled={votedIds.has(duel.id)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          votedIds.has(duel.id) ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500 text-white hover:bg-emerald-600"
                        )}
                      >
                        {votedIds.has(duel.id) ? 'Voted Fair' : 'Fair Judgment'}
                      </button>
                      <button 
                         onClick={() => { voteDuel(duel.id, duel.player2_id, false); setVotedIds(prev => new Set(prev).add(duel.id)); }}
                         disabled={votedIds.has(duel.id)}
                         className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          votedIds.has(duel.id) ? "bg-red-100 text-red-600" : "bg-red-500 text-white hover:bg-red-600"
                        )}
                      >
                        Unfair
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="system-panel p-10 border-white/60 text-center opacity-40">
                    <Users size={32} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No active cases for review</p>
                  </div>
                )}
             </div>
          </motion.div>
        )}

        {/* ═══ RANKS ═══ */}
        {activeTab === 'ranks' && (
          <motion.div key="ranks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4 items-end">
              {leaderboard.slice(0, 3).map((user, i) => {
                const pos = i === 0 ? 1 : i === 1 ? 0 : 2; // Rank 1 center
                const sortedLeaderboard = [leaderboard[1], leaderboard[0], leaderboard[2]];
                const player = sortedLeaderboard[i];
                if (!player) return null;
                
                const isMain = player.id === leaderboard[0].id;

                return (
                  <div key={player.id} className={cn(
                    "flex flex-col items-center p-3 rounded-2xl bg-white border border-blue-50 shadow-sm transition-all",
                    isMain ? "bg-blue-600 text-white border-blue-700 shadow-xl -translate-y-4 py-6" : "scale-90"
                  )}>
                    {isMain && <Crown size={18} className="text-yellow-400 mb-1" />}
                    <span className={cn("text-[10px] font-black mb-2", isMain ? "text-blue-200" : "text-blue-300")}>#{leaderboard.indexOf(player) + 1}</span>
                    <div className={cn("w-12 h-12 rounded-2xl mb-2 flex items-center justify-center font-black text-lg", isMain ? "bg-white/20" : "bg-blue-50 text-blue-400")}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[9px] font-black uppercase truncate w-full text-center">{player.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              {leaderboard.map((user, index) => (
                <div key={user.id} className={cn(
                  "system-panel p-4 border-blue-200/50 flex items-center gap-3 transition-all",
                  user.id === state.user?.id ? "bg-blue-50 border-blue-400 scale-[1.02] shadow-md" : "bg-white/40"
                )}>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">{index + 1}</div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black shadow-md shrink-0 bg-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-blue-900 uppercase">{user.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black uppercase text-blue-600">{user.rank}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end"><Zap size={10} className="text-purple-500" /><span className="text-sm font-black text-blue-900">{user.total_xp.toLocaleString()}</span></div>
                    <span className="text-[7px] font-bold text-blue-400 uppercase tracking-widest">Total XP</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ DMs ═══ */}
        {activeTab === 'dms' && (
          <motion.div key="dms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 h-[calc(100vh-280px)] flex flex-col">
            {!selectedDm ? (
              <>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" />
                  <input type="text" placeholder="SEARCH COMMS..." className="w-full bg-white border border-blue-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-400 focus:bg-white transition-all text-blue-900 placeholder:text-blue-300 font-black text-[10px] tracking-widest shadow-sm" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {friends.filter(f => f.status === 'accepted').length > 0 ? (
                  Array.from(new Map(friends.filter(f => f.status === 'accepted').map(f => [f.id, f])).values()).map(friend => (
                    <motion.button 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={friend.id} 
                      onClick={() => setSelectedDm(friend.id)} 
                      className="w-full system-panel p-4 border-white/60 flex items-center gap-4 hover:bg-blue-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black">{friend.name.charAt(0).toUpperCase()}</div>
                      <div className="text-left">
                        <div className="text-sm font-black text-blue-900 uppercase">{friend.name}</div>
                        <div className="text-[9px] font-bold text-blue-400 uppercase">Secure Link Active</div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center system-panel border-white/60 h-full">
                      <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-white shadow-lg flex items-center justify-center mb-4"><MessageCircle size={28} className="text-blue-200" /></div>
                      <h4 className="text-sm font-black text-blue-900 mb-1">No Encrypted Comms</h4>
                      <p className="text-[10px] font-bold text-blue-400 max-w-[220px] leading-relaxed">Establish friend links to start secure communications.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full space-y-4">
                <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <button onClick={() => setSelectedDm(null)} className="p-2 hover:bg-blue-100 rounded-xl text-blue-400 transition-colors">
                    <ChevronRight className="rotate-180" size={20} />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                    {friends.find(f => f.id === selectedDm)?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm font-black text-blue-900 uppercase">
                    {friends.find(f => f.id === selectedDm)?.name}
                  </div>
                </div>
                
                <div className="flex-1 bg-white/40 border border-white/60 rounded-3xl p-4 overflow-y-auto space-y-3 shadow-inner">
                  {messages.length > 0 ? messages.map(msg => (
                    <div key={msg.id} className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-[11px] font-bold leading-relaxed",
                      msg.sender_id === state.user?.id ? "bg-blue-600 text-white self-end ml-auto rounded-tr-none" : "bg-white border border-blue-50 text-blue-900 self-start rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  )) : (
                    <div className="h-full flex items-center justify-center text-[10px] font-black text-blue-300 uppercase tracking-widest italic">Channel Initiated...</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={dmInput} 
                    onChange={e => setDmInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && selectedDm && (sendMessage(selectedDm, dmInput), setDmInput(''))}
                    placeholder="ENTER DATA..." 
                    className="flex-1 bg-white border border-blue-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 transition-all text-blue-900 placeholder:text-blue-300 font-black text-[10px] tracking-widest" 
                  />
                  <button 
                    onClick={() => selectedDm && (sendMessage(selectedDm, dmInput), setDmInput(''))}
                    className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-400/30 active:scale-95 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
