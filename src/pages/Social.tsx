import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Users, Trophy, 
  Plus, 
  Zap, 
  ChevronRight, 
  MessageSquare, 
  Trash2, 
  AtSign,
  Crown,
  Globe,
  Flame,
  Search
} from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { getRankColor, getRankTitle } from '@/src/lib/xp.ts';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

type Tab = 'friends' | 'leaderboard' | 'community';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'friends', label: 'HUNTERS', icon: Users },
  { id: 'leaderboard', label: 'RANKINGS', icon: Trophy },
  { id: 'community', label: 'GUILD', icon: Globe },
];

function SmallOrb({ state = 'idle', size = 36 }: { state?: string; size?: number }) {
  const getGlowColor = () => {
    switch(state) {
      case 'active': return 'rgba(34,211,238,0.5)';
      case 'battle': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(34,211,238,0.2)';
    }
  };

  const getOrbGradient = () => {
    switch(state) {
      case 'active': return 'radial-gradient(circle at 30% 30%, #ffffff 0%, #a5f3fc 20%, #06b6d4 50%, #0891b2 100%)';
      case 'battle': return 'radial-gradient(circle at 30% 30%, #ffffff 0%, #fecaca 20%, #ef4444 50%, #b91c1c 100%)';
      default: return 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e2e8f0 20%, #94a3b8 50%, #475569 100%)';
    }
  };

  return (
    <div 
      className="rounded-full relative shrink-0 shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        boxShadow: `0 0 15px ${getGlowColor()}`,
        background: getOrbGradient()
      }}
    >
      <div className="absolute inset-0 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)] rounded-full pointer-events-none" />
      <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[1px] -rotate-[35deg]" />
    </div>
  );
}

export function Social() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, getLevel, getRank, searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getLeaderboard, getPublicDuels, submitCommunityHonourVote } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; username?: string; total_xp: number }[]>([]);
  const [friends, setFriends] = useState<{ friendshipId: string; id: string; name: string; username?: string; status: string; total_xp: number; isIncoming: boolean; activity?: string; streak?: number }[]>([]);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; total_xp: number; rank: string }[]>([]);
  const [publicDuels, setPublicDuels] = useState<any[]>([]);
  const [votingKey, setVotingKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const level = getLevel();
  const rank = getRank();
  const rankColor = getRankColor(rank);
  const rankTitle = getRankTitle(rank);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    if (activeTab === 'friends') {
      getFriends().then((data) => {
        // Enforce mock activities for now as requested by user
        let enriched = data.map((f: any) => ({
          ...f,
          activity: Math.random() > 0.7 ? 'In Combat' : Math.random() > 0.4 ? 'In Gate Run' : 'Idle',
          streak: Math.floor(Math.random() * 15)
        }));

        // Add fake users if the list is small for demo
        if (enriched.length < 5) {
          const fakeUsers = [
            { friendshipId: 'f1', id: 'u1', name: 'Nikku', activity: 'In Gate Run', streak: 5, status: 'accepted' },
            { friendshipId: 'f2', id: 'u2', name: 'Kishore Varma', activity: 'Idle', streak: 3, status: 'accepted' },
            { friendshipId: 'f3', id: 'u3', name: 'Gopi Krishna', activity: 'In Battle', streak: 8, status: 'accepted' },
            { friendshipId: 'f4', id: 'u4', name: 'Ice Mel', activity: 'In Focus', streak: 1, status: 'accepted' },
          ];
          enriched = [...enriched, ...fakeUsers];
        }
        setFriends(enriched);
      });
    } else if (activeTab === 'leaderboard') {
      getLeaderboard().then(setLeaderboard);
    } else if (activeTab === 'community') {
      getPublicDuels().then(setPublicDuels);
    }
  }, [activeTab, getFriends, getLeaderboard, getPublicDuels]);

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

  const getHonourVotes = (duel: any, targetPlayer: 'p1' | 'p2') => {
    const votes = (duel.community_duel_votes || []).filter((vote: any) => vote.target_player === targetPlayer);
    return {
      fair: votes.filter((vote: any) => vote.is_reasonable).length,
      unfair: votes.filter((vote: any) => !vote.is_reasonable).length,
      total: votes.length,
      hasVoted: votes.some((vote: any) => vote.voter_id === state.user?.id),
    };
  };

  const canVoteOnHonour = (duel: any, targetPlayer: 'p1' | 'p2') => {
    const targetUserId = targetPlayer === 'p1' ? duel.player1_id : duel.player2_id;
    const reviewerId = targetPlayer === 'p1' ? duel.player2_id : duel.player1_id;
    return state.user?.id && state.user.id !== targetUserId && state.user.id !== reviewerId && !duel[`${targetPlayer}_honour_finalized`];
  };

  const handleHonourVote = async (duel: any, targetPlayer: 'p1' | 'p2', isReasonable: boolean) => {
    const key = `${duel.id}:${targetPlayer}`;
    setVotingKey(key);
    try {
      await submitCommunityHonourVote(duel, targetPlayer, isReasonable);
      setPublicDuels(await getPublicDuels());
    } catch (err: any) {
      alert(err.message || 'Unable to register community vote.');
    } finally {
      setVotingKey(null);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-2xl space-y-4 pb-24 overflow-x-hidden"
    >
      <div className="pt-8 px-6 flex items-center justify-between">
         <div className="text-left">
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
             Social
           </h2>
           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1.5 italic">Neural Network Active</p>
         </div>
         <div className="flex gap-2">
           {TABS.map((tab) => {
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as Tab)}
                 className={cn(
                   "p-2.5 rounded-xl transition-all border",
                   isActive 
                     ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
                     : "bg-white/[0.03] text-white/20 hover:text-white/40 border-white/5"
                 )}
               >
                 <Icon size={14} className="stroke-[2.5]" />
               </button>
             );
           })}
         </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ FRIENDS ═══ */}
        {activeTab === 'friends' && (
          <motion.div 
            key="friends" 
            variants={containerVariants}
            initial="hidden" 
            animate="show" 
            exit={{ opacity: 0 }} 
            className="space-y-6"
          >
            {/* Minimal Search */}
            <div className="px-6">
              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type="text" 
                  value={friendSearch} 
                  onChange={e => handleFriendSearch(e.target.value)} 
                  placeholder="Search Hunters..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-cyan-400/20 focus:bg-white/[0.04] transition-all text-white placeholder:text-white/5 font-black text-[11px] tracking-widest uppercase italic shadow-inner" 
                />
              </div>
            </div>

            {/* Instagram style Orbs Row */}
            <div className="px-4 overflow-hidden">
               <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
                 {/* Your Story */}
                 <div className="flex flex-col items-center gap-2 shrink-0">
                   <div className="relative p-1 rounded-full border-2 border-white/5">
                     <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                        <Plus size={20} className="text-white/20" />
                     </div>
                   </div>
                   <span className="text-[9px] font-black text-white/20 uppercase italic pb-1">Your Link</span>
                 </div>

                 {friends.filter(f => f.status === 'accepted').slice(0, 10).map((friend) => (
                   <button 
                     key={friend.id} 
                     onClick={() => navigate(`/social/chat/${friend.id}`)}
                     className="flex flex-col items-center gap-2 shrink-0 group"
                   >
                     <div className={cn(
                       "relative p-1 rounded-full border-2 transition-colors",
                       friend.activity === 'In Focus' ? 'border-cyan-400' : 'border-white/5'
                     )}>
                       <SmallOrb state={friend.activity === 'In Battle' ? 'battle' : friend.activity === 'In Focus' ? 'active' : 'idle'} size={56} />
                       {(friend.activity === 'In Focus' || friend.activity === 'In Battle') && (
                         <div className={cn(
                           "absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#030406]",
                           friend.activity === 'In Battle' ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                         )} />
                       )}
                     </div>
                     <span className="text-[9px] font-black text-white/40 uppercase italic tracking-tighter max-w-[64px] truncate pb-1">
                       {friend.name.split(' ')[0]}
                     </span>
                   </button>
                 ))}
               </div>
            </div>
            
            {/* Global Search Results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-6 space-y-3"
                >
                  {searchResults.map(user => (
                    <div key={user.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SmallOrb state="active" size={32} />
                        <div>
                          <div className="text-sm font-black text-white uppercase italic leading-none">{user.name}</div>
                          <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1 italic">
                            @{user.username || user.name.toLowerCase().replace(/\s/g, '_')}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddFriend(user.id)} 
                        className="w-10 h-10 rounded-xl bg-cyan-400 text-black flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Plus size={16} className="stroke-[3]" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Direct Messaging / Friends List */}
            <div className="px-6 space-y-4">
              <h3 className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] italic">Direct Signals</h3>
              {friends.filter(f => f.status === 'accepted').length > 0 ? (
                <div className="space-y-1">
                  {friends.filter(f => f.status === 'accepted').map((friend) => (
                    <motion.button 
                      key={friend.id}
                      onClick={() => navigate(`/social/chat/${friend.id}`)}
                      className="w-full group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5"
                    >
                      <div className="relative shrink-0">
                        <SmallOrb state={friend.activity === 'In Battle' ? 'battle' : friend.activity === 'In Focus' ? 'active' : 'idle'} size={44} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors">
                            {friend.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-white/30 uppercase italic truncate pr-4">
                            SECURE CONNECTION
                          </p>
                          {friend.streak && friend.streak > 0 && (
                            <div className="flex items-center gap-1 text-orange-500/50">
                              <Flame size={10} fill="currentColor" />
                              <span className="text-[9px] font-black">{friend.streak}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                  <MessageSquare size={32} className="mb-4 text-white/20" />
                  <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Signal void detected</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ COMMUNITY ═══ */}
        {activeTab === 'community' && (
          <motion.div 
            key="community" 
            variants={containerVariants}
            initial="hidden" 
            animate="show" 
            exit={{ opacity: 0, scale: 0.98 }} 
            className="space-y-8"
          >
             <motion.div 
               variants={itemVariants}
               className="relative rounded-[2.5rem] p-10 bg-[#0A0C10] border border-white/5 overflow-hidden group shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-center"
             >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-black border border-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:border-cyan-400/30 transition-all duration-500"
                  >
                    <Globe size={44} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  </motion.div>
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-3">Community Hall</h3>
                  <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] mb-10 italic">Review active conflicts & enforce link morality</p>
                  <button 
                    className="px-12 py-5 bg-white/[0.03] text-white border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all font-black italic tracking-widest text-xs shadow-2xl active:scale-95" 
                    onClick={() => getPublicDuels().then(setPublicDuels)}
                  >
                    REFRESH ARENA FEED
                  </button>
                </div>
             </motion.div>

             {publicDuels.length > 0 ? (
               <div className="grid gap-4">
                 {publicDuels.map((duel) => {
                  const p1Votes = getHonourVotes(duel, 'p1');
                  const p2Votes = getHonourVotes(duel, 'p2');

                  return (
                   <motion.div 
                     key={duel.id}
                     variants={itemVariants}
                     className="bg-[#0A0C10] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] group/duel"
                   >
                     <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                     
                     <div className="flex items-center justify-between mb-10">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-[1.25rem] bg-black border border-white/10 flex items-center justify-center text-cyan-400 font-black italic shadow-inner group-hover/duel:border-cyan-400/30 transition-colors">
                           {duel.mode === 'deck' ? <Trophy size={18} /> : <AtSign size={18} />}
                         </div>
                         <div>
                           <span className="text-sm font-black uppercase text-white tracking-widest italic block leading-none mb-1.5">
                             {duel.mode === 'deck' ? 'Fragment Duel' : 'Lexical Conflict'}
                           </span>
                           <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic opacity-50">Active Observation Required</span>
                         </div>
                       </div>
                       <div className={cn(
                         "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border italic shadow-inner",
                         duel.status === 'finished' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" : "bg-cyan-500/5 border-cyan-400/20 text-cyan-400"
                       )}>
                         {duel.status === 'community_review' ? 'Honour Review' : duel.status}
                       </div>
                     </div>

                     <div className="flex items-center justify-between gap-10 py-10 border-y border-white/[0.03]">
                       <div className="flex-1 text-center">
                         <div className="text-[10px] font-black text-white/15 uppercase mb-3 italic tracking-[0.3em] truncate">{duel.p1?.name}</div>
                         <div className="text-4xl font-black italic text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                           {duel.mode === 'deck' ? duel.p1_score : duel.p1_review_rating ? `${duel.p1_review_rating}` : '—'}
                           {duel.mode !== 'deck' && <span className="text-lg opacity-20 ml-1.5">★</span>}
                         </div>
                       </div>
                       <div className="text-white/5 font-black italic text-2xl tracking-[0.6em] select-none scale-90">VS</div>
                       <div className="flex-1 text-center">
                         <div className="text-[10px] font-black text-white/15 uppercase mb-3 italic tracking-[0.3em] truncate">{duel.p2?.name}</div>
                         <div className="text-4xl font-black italic text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                           {duel.mode === 'deck' ? duel.p2_score : duel.p2_review_rating ? `${duel.p2_review_rating}` : '—'}
                           {duel.mode !== 'deck' && <span className="text-lg opacity-20 ml-1.5">★</span>}
                         </div>
                       </div>
                     </div>

                     {duel.mode === 'writing' && (duel.p1_topic || duel.p2_topic) && (
                       <div className="mt-8 p-6 bg-black rounded-[1.75rem] border border-white/5 shadow-inner">
                         <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-3 text-center italic">Neural Prompt Objective</div>
                         <p className="text-[12px] font-black text-cyan-400/70 text-center italic uppercase tracking-tighter leading-relaxed">"{duel.p1_topic || duel.p2_topic}"</p>
                       </div>
                     )}

                     <div className="mt-10 space-y-4">
                       {(['p1', 'p2'] as const).map(targetPlayer => {
                         const targetName = targetPlayer === 'p1' ? duel.p1?.name : duel.p2?.name;
                         const reviewerName = targetPlayer === 'p1' ? duel.p2?.name : duel.p1?.name;
                         const votes = targetPlayer === 'p1' ? p1Votes : p2Votes;
                         const rating = duel[`${targetPlayer}_review_rating`];
                         const finalized = duel[`${targetPlayer}_honour_finalized`];
                         const approved = duel[`${targetPlayer}_honour_approved`];
                         const voteKey = `${duel.id}:${targetPlayer}`;

                         if (!rating) return null;

                         return (
                           <div key={targetPlayer} className="rounded-[1.75rem] bg-[#05070A] border border-white/5 p-6 hover:border-cyan-400/20 transition-all shadow-inner">
                             <div className="flex items-start justify-between gap-6">
                               <div>
                                 <div className="text-[9px] font-black text-cyan-400/30 uppercase tracking-[0.4em] italic mb-2">Honour Verification Needed</div>
                                 <div className="text-sm font-black text-white/80 uppercase italic tracking-tighter leading-tight">
                                   {reviewerName} <span className="text-white/20 mx-1">rated</span> {targetName} <span className="text-cyan-400">{rating}★</span>
                                 </div>
                               </div>
                               <div className={cn(
                                 "text-[9px] font-black uppercase px-4 py-2 rounded-xl border shrink-0 italic tracking-widest leading-none",
                                 finalized
                                   ? approved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                   : "bg-white/[0.02] border-white/10 text-white/30"
                               )}>
                                 {finalized ? (approved ? `+${duel[`${targetPlayer}_honour_xp_awarded`] || 0} XP` : 'PENALIZED') : `${votes.total} / 3 LOGS`}
                               </div>
                             </div>

                             {duel[`${targetPlayer}_review_comment`] && (
                               <div className="mt-5 p-5 bg-black rounded-2xl border border-white/5 text-[10px] font-black text-white/40 italic leading-relaxed uppercase tracking-widest leading-none">
                                 "{duel[`${targetPlayer}_review_comment`]}"
                               </div>
                             )}
                             
                             {!finalized && canVoteOnHonour(duel, targetPlayer) && !votes.hasVoted && (
                               <div className="flex gap-3 mt-6">
                                 <button 
                                   disabled={votingKey === voteKey}
                                   onClick={() => handleHonourVote(duel, targetPlayer, true)}
                                   className="flex-1 py-4 bg-white/[0.03] hover:bg-emerald-500 hover:text-black border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all disabled:opacity-30 active:scale-95 shadow-lg"
                                 >
                                   VERIFY
                                 </button>
                                 <button 
                                   disabled={votingKey === voteKey}
                                   onClick={() => handleHonourVote(duel, targetPlayer, false)}
                                   className="flex-1 py-4 bg-white/[0.03] hover:bg-red-500 hover:text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all disabled:opacity-30 active:scale-95 shadow-lg"
                                 >
                                   VOID
                                 </button>
                               </div>
                             )}

                             {!finalized && votes.hasVoted && (
                               <div className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 italic animate-pulse">Signature Authenticated</div>
                             )}
                             
                             <div className="mt-6 pt-6 border-t border-white/[0.03] flex items-center justify-between">
                               <div className="flex -space-x-2">
                                 {[...Array(3)].map((_, i) => (
                                   <div key={i} className="w-6 h-6 rounded-lg bg-black border border-white/10 flex items-center justify-center text-[8px] font-black text-white/20 italic">
                                     {i + 1}
                                   </div>
                                 ))}
                               </div>
                               <div className="text-[9px] font-black text-white/10 uppercase italic tracking-widest">
                                 {votes.total} Community Consensus Signals detected
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </motion.div>
                  );
                 })}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-24 text-center bg-[#07090D] border border-white/5 rounded-[2.5rem] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
                 <div className="w-24 h-24 rounded-[3rem] bg-black border border-white/5 flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Globe size={40} className="text-white/5 relative z-10" />
                 </div>
                 <h4 className="text-[14px] font-black text-white/30 uppercase italic tracking-[0.5em] mb-4">Arena Quiescent</h4>
                 <p className="text-[11px] font-black text-white/10 px-24 leading-relaxed uppercase tracking-widest italic opacity-60">Neural transmissions are currently synchronized. Awaiting next conflict signal.</p>
               </div>
             )}
          </motion.div>
        )}

        {/* ═══ LEADERBOARD ═══ */}
        {activeTab === 'leaderboard' && (
          <motion.div 
            key="leaderboard" 
            variants={containerVariants}
            initial="hidden" 
            animate="show" 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="space-y-6 px-6"
          >
            {/* Podium Bento Grid */}
            <div className="grid grid-cols-3 gap-3">
              {leaderboard.slice(0, 3).map((player, i) => (
                <motion.div
                  key={player.id}
                  variants={itemVariants}
                  className={cn(
                    "relative overflow-hidden rounded-[1.5rem] bg-white/[0.02] border border-white/5 p-4 flex flex-col items-center gap-3 text-center transition-all",
                    i === 0 && "bg-cyan-500/5 border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.05)]"
                  )}
                >
                  <div className="relative">
                    <SmallOrb 
                      state={i === 0 ? "active" : "idle"} 
                      size={48} 
                    />
                    <div className={cn(
                      "absolute -top-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black",
                      i === 0 ? "bg-cyan-400 text-black shadow-lg" : "bg-white/10 text-white/40"
                    )}>
                      {i + 1}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate w-full max-w-[60px]">
                      {player.name.split(' ')[0]}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[8px] font-black text-cyan-400/50 uppercase tracking-widest italic">
                      <Zap size={8} className="fill-current" />
                      {player.total_xp.toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Horizontal Data Stream */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Neural Stream</h3>
                <div className="w-1 h-1 rounded-full bg-cyan-400/30 animate-pulse" />
              </div>
              
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
                {leaderboard.slice(3).map((user, index) => (
                  <motion.div 
                    key={user.id}
                    variants={itemVariants}
                    className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform"
                  >
                    <div className="relative bg-white/[0.02] border border-white/5 p-2 rounded-2xl group-hover:border-white/10 transition-colors">
                      <SmallOrb size={40} />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-black border border-white/10 flex items-center justify-center text-[8px] font-black text-white/20 italic">
                        #{index + 4}
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-white/40 uppercase italic tracking-tighter max-w-[56px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Global Efficiency Module */}
            <motion.div variants={itemVariants} className="p-5 rounded-[2rem] bg-black border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                  <Zap size={16} className="fill-current" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-white uppercase italic tracking-tight leading-none mb-1.5">Efficiency Rating</div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-cyan-400" />
                    </div>
                    <span className="text-[8px] font-black text-cyan-400/40 uppercase italic">98.4%</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-black text-white italic tracking-tighter leading-none mb-1">NODE ARCHIVE</div>
                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">{leaderboard.length} UNITS</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nested slide-over views (e.g. Chat) */}
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
    </motion.div>
  );
}
