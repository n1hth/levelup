import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Trophy, MessageCircle, Search, UserPlus, Crown, Swords, ChevronRight, Send, Plus, Zap, Globe } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { getRankColor, getRankTitle } from '@/src/lib/xp.ts';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type Tab = 'friends' | 'guilds' | 'ranks' | 'dms' | 'community';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'requests', label: 'Requests', icon: UserPlus },
  { id: 'guilds', label: 'Guilds', icon: Shield },
  { id: 'community', label: 'Community', icon: Globe },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
  { id: 'dms', label: 'DMs', icon: MessageCircle },
];

export function Social() {
  const { state, getLevel, getRank, searchUsers, sendFriendRequest, acceptFriendRequest, getFriends, getLeaderboard, sendMessage, getMessages } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friendSearch, setFriendSearch] = useState('');
  const [guildSearch, setGuildSearch] = useState('');
  const [dmInput, setDmInput] = useState('');
  const [selectedDm, setSelectedDm] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; total_xp: number }[]>([]);
  const [friends, setFriends] = useState<{ id: string; name: string; status: string; total_xp: number; isIncoming: boolean }[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; total_xp: number; rank: string }[]>([]);
  const [messages, setMessages] = useState<{ id: string; sender_id: string; content: string; created_at: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const level = getLevel();
  const rank = getRank();
  const rankColor = getRankColor(rank);
  const rankTitle = getRankTitle(rank);

  useEffect(() => {
    if (activeTab === 'friends' || activeTab === 'requests') {
      getFriends().then(setFriends);
    } else if (activeTab === 'ranks') {
      getLeaderboard().then(setLeaderboard);
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
    await acceptFriendRequest(id);
    getFriends().then(setFriends);
    alert("Friend request accepted!");
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
          // Deduplicate incoming pending requests
          const incomingPending = Array.from(new Map(
            friends.filter(f => f.status === 'pending' && f.isIncoming).map(f => [f.id, f])
          ).values());
          const incomingPendingCount = incomingPending.length;
          const showBadge = tab.id === 'requests' && incomingPendingCount > 0;

          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all min-w-[56px] relative",
                activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-blue-400 hover:bg-blue-50")}>
              <div className="relative">
                <Icon size={15} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                )}
              </div>
              {tab.label}
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
                        <div className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">{user.total_xp.toLocaleString()} XP</div>
                      </div>
                    </div>
                    <button onClick={() => handleAddFriend(user.id)} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      <UserPlus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="system-panel p-4 border-white/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md" style={{ background: `linear-gradient(135deg, ${rankColor}, ${rankColor}88)` }}>
                {state.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Your Operator ID</span>
                <span className="text-sm font-black text-blue-900 tracking-wider">LVL-{state.user?.name?.slice(0,3).toUpperCase() || 'XXX'}-{String(state.totalXp).padStart(4,'0').slice(-4)}</span>
              </div>
              <button className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-100 transition-colors">Copy</button>
            </div>

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
                        <div>
                          <div className="text-sm font-black text-blue-900 uppercase">{friend.name}</div>
                          <div className="text-[9px] font-bold text-blue-400 uppercase">{friend.total_xp.toLocaleString()} XP</div>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedDm(friend.id); setActiveTab('dms'); }} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-90">
                        <MessageCircle size={16} />
                      </button>
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

        {/* ═══ REQUESTS ═══ */}
        {activeTab === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest px-1">Incoming Requests</h3>
            {friends.filter(f => f.isIncoming && f.status === 'pending').length > 0 ? (
              <div className="space-y-2">
                {friends.filter(f => f.isIncoming && f.status === 'pending').map(friend => (
                  <div key={friend.friendshipId} className="system-panel p-4 border-emerald-100 bg-emerald-50/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xs">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-blue-900 uppercase">{friend.name}</div>
                        <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Wants to join your syndicate</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        alert("Accepting " + friend.name + " (ID: " + friend.friendshipId + ")");
                        handleAcceptFriend(friend.friendshipId);
                      }} 
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center system-panel border-white/60">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest italic">No pending invitations...</p>
              </div>
            )}

            <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest px-1 mt-6">Sent Requests</h3>
            {friends.filter(f => !f.isIncoming && f.status === 'pending').length > 0 ? (
              <div className="space-y-2">
                {friends.filter(f => !f.isIncoming && f.status === 'pending').map(friend => (
                  <div key={friend.id} className="system-panel p-4 border-white/60 opacity-70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-400 font-black text-xs">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-blue-900 uppercase">{friend.name}</div>
                        <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Awaiting Response</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest italic">No outgoing requests...</p>
              </div>
            )}
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

        {/* ═══ COMMUNITY ═══ */}
        {activeTab === 'community' && (
          <motion.div key="community" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
             <div className="system-panel p-6 bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500 text-white relative overflow-hidden text-center">
                <div className="absolute inset-0 aero-gloss opacity-20" />
                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Community Hall</h3>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.2em] mb-6">Review duels and ensure fairness</p>
                <button className="w-full btn-system bg-white text-blue-600 border-white shadow-xl">
                  Browse Active Duels
                </button>
             </div>

             <div className="system-panel p-5 border-white/60 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 text-blue-300 shadow-inner">
                  <Search size={20} />
                </div>
                <h4 className="text-[11px] font-black text-blue-900 uppercase">No Pending Reviews</h4>
                <p className="text-[9px] font-bold text-blue-400 mt-1">Hunters are currently resting. Check back soon.</p>
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
                  {friends.length > 0 ? friends.map(friend => (
                    <button key={friend.id} onClick={() => setSelectedDm(friend.id)} className="w-full system-panel p-4 border-white/60 flex items-center gap-4 hover:bg-blue-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black">{friend.name.charAt(0).toUpperCase()}</div>
                      <div className="text-left">
                        <div className="text-sm font-black text-blue-900 uppercase">{friend.name}</div>
                        <div className="text-[9px] font-bold text-blue-400 uppercase">Secure Link Active</div>
                      </div>
                    </button>
                  )) : (
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
