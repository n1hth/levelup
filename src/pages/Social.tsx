import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
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
  Search,
  Swords,
  ChevronLeft,
  BookOpen,
  Send,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { getRankColor, getRankTitle } from '@/src/lib/xp.ts';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';
import { getOrbGradient, getOrbColors } from '@/src/lib/orb-color';
import { getDuelRetryCardPreview } from '@/src/lib/duel-retry-card';

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

type Tab = 'friends' | 'leaderboard' | 'community';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'friends', label: 'HUNTERS', icon: Users },
  { id: 'leaderboard', label: 'RANKINGS', icon: Trophy },
  { id: 'community', label: 'GUILD', icon: Globe },
];

function SmallOrb({ hue = 200, state = 'idle', size = 36 }: { hue?: number; state?: string; size?: number }) {
  const palette = getOrbColors(hue, 'idle');
  const gradient = getOrbGradient(hue, 'idle', 'E');

  return (
    <div 
      className="rounded-full relative shrink-0 shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        boxShadow: `0 0 15px ${palette.glow}`,
        background: gradient
      }}
    >
      <div className="absolute inset-0 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)] rounded-full pointer-events-none" />
      <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[1px] -rotate-[35deg]" />
    </div>
  );
}

const DUMMY_FRIENDS = [
  { id: 'dummy-1', name: 'Orion Pax', orb_hue: 200, activity: 'In Focus', status: 'accepted', last_message: { content: 'Synchronizing neural link...', created_at: new Date().toISOString(), receiver_id: 'me', is_read: false } },
  { id: 'dummy-2', name: 'Lyra Heart', orb_hue: 320, activity: 'Idle', status: 'accepted', last_message: { content: 'GG on that duel earlier!', created_at: new Date(Date.now() - 3600000).toISOString(), receiver_id: 'me', is_read: true } },
  { id: 'dummy-3', name: 'Nova Prime', orb_hue: 45, activity: 'In Battle', status: 'accepted', last_message: { content: 'Awaiting challenge...', created_at: new Date(Date.now() - 7200000).toISOString(), receiver_id: 'other', is_read: true } },
  { id: 'dummy-4', name: 'Echo 7', orb_hue: 160, activity: 'Idle', status: 'accepted' },
];

export function Social() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state, getLevel, getRank, searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getLeaderboard, getPublicDuels, submitCommunityHonourVote, createDuel, getDeckCards } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as any) || 'friends');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'friends' || tab === 'leaderboard' || tab === 'community') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; username?: string; total_xp: number; orb_hue?: number }[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; total_xp: number; rank: string; orb_hue?: number }[]>([]);
  const [publicDuels, setPublicDuels] = useState<any[]>([]);
  const [votingKey, setVotingKey] = useState<string | null>(null);
  const [flippedDuels, setFlippedDuels] = useState<Record<string, 'p1' | 'p2'>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [orbRect, setOrbRect] = useState<DOMRect | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [duelView, setDuelView] = useState<'actions' | 'modes'>('actions');
  const [selectedMode, setSelectedMode] = useState<'deck' | 'writing' | null>(null);
  const [isSendingDuel, setIsSendingDuel] = useState(false);
  const [isDuelSent, setIsDuelSent] = useState(false);
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
    console.log("[Social] useEffect RUNNING. activeTab:", activeTab);
    if (activeTab === 'friends') {
      console.log("[Social] Calling getFriends()...");
      getFriends().then((data) => {
        console.log("[Social] getFriends resolved with data:", data);
        const baseData = (data && data.length > 0) ? data : DUMMY_FRIENDS;
        console.log("[Social] baseData used (after empty check fallback):", baseData);
        let enriched = baseData.map((f: any) => ({
          ...f,
          activity: f.activity || 'Idle',
          streak: f.streak || 0
        }));
        console.log("[Social] setting friends state with:", enriched);
        setFriends(enriched);
      });
    } else if (activeTab === 'leaderboard') {
      console.log("[Social] Calling getLeaderboard()...");
      getLeaderboard().then((data) => {
        console.log("[Social] getLeaderboard resolved with:", data);
        setLeaderboard(data);
      });
    } else if (activeTab === 'community') {
      console.log("[Social] Calling getPublicDuels()...");
      getPublicDuels().then((data) => {
        console.log("[Social] getPublicDuels resolved with:", data);
        setPublicDuels(data);
      });
    }
  }, [activeTab, getFriends, getLeaderboard, getPublicDuels]);

  // Real-time listener for friends list updates (messages, etc)
  useEffect(() => {
    if (activeTab !== 'friends' || !state.user) return;

    const channel = supabase
      .channel('social-friends-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friends',
        filter: `friend_id=eq.${state.user.id}` 
      }, (payload) => {
        // Refresh friends list to update previews and unread dots
        getFriends().then((data) => {
          const baseData = (data && data.length > 0) ? data : [];
          let enriched = baseData.map((f: any) => ({
            ...f,
            activity: 'Idle',
            streak: f.streak || 0
          }));
          setFriends(enriched);
        });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friends',
        filter: `user_id=eq.${state.user.id}` 
      }, (payload) => {
        getFriends().then((data) => {
          const baseData = (data && data.length > 0) ? data : [];
          let enriched = baseData.map((f: any) => ({
            ...f,
            activity: 'Idle',
            streak: f.streak || 0
          }));
          setFriends(enriched);
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        // Refresh friends list to update previews and unread dots
        getFriends().then((data) => {
          const baseData = (data && data.length > 0) ? data : [];
          let enriched = baseData.map((f: any) => ({
            ...f,
            activity: 'Idle',
            streak: f.streak || 0
          }));
          setFriends(enriched);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, state.user, getFriends]);

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
    getFriends().then(setFriends);
    // Replace alert with premium toast triggers if present, else default
    try {
      const el = document.getElementById('system-toast-container');
      if (el) {
        const customEvent = new CustomEvent('show-toast', {
          detail: { message: 'Friend request sent successfully!', type: 'success' }
        });
        window.dispatchEvent(customEvent);
      } else {
        alert("Friend request sent!");
      }
    } catch {
      alert("Friend request sent!");
    }
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
    if (confirm("Remove this friend?")) {
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
      <AnimatePresence>
        {selectedFriend && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedFriend(null);
                setOrbRect(null);
                setDuelView('actions');
                setSelectedMode(null);
              }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ 
                opacity: 0, 
                y: 100,
                scale: 0.8,
                x: '-50%',
                rotateX: -15
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1,
                x: '-50%',
                rotateX: 0
              }}
              exit={{ 
                opacity: 0, 
                y: 60,
                scale: 0.9,
                x: '-50%',
                rotateX: -10
              }}
              style={{
                position: 'fixed',
                left: '50%',
                bottom: '140px',
                perspective: '1000px',
                transformOrigin: 'bottom center'
              }}
              transition={{ 
                type: 'spring', 
                damping: 25, 
                stiffness: 400,
                mass: 0.8
              }}
              className="z-[101] w-[280px] bg-[#080A0E]/98 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)]"
            >
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-3 w-full">
                  <div className="relative shrink-0">
                    <SmallOrb hue={selectedFriend.orb_hue} state="active" size={48} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0A0C10] shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white italic uppercase tracking-widest line-clamp-1">
                      {selectedFriend.name}
                    </span>
                    <span className="text-[8px] font-bold text-cyan-400/60 uppercase italic tracking-tighter">
                      {duelView === 'actions' ? 'Active Hunter' : 'Select Challenge'}
                    </span>
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {isDuelSent ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center py-8 gap-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                        className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                      >
                        <Check size={32} strokeWidth={4} />
                      </motion.div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-black text-white italic uppercase tracking-wider">Duel Sent!</span>
                        <span className="text-[9px] font-bold text-white/40 uppercase italic">Awaiting Response...</span>
                      </div>
                    </motion.div>
                  ) : duelView === 'actions' ? (
                    <motion.div 
                      key="actions"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-2 w-full"
                    >
                      <button 
                        onClick={() => setDuelView('modes')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white h-12 rounded-2xl font-black italic uppercase tracking-widest text-[9px] hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-600/20"
                      >
                        <Swords size={12} />
                        Duel
                      </button>
                      <button 
                        onClick={() => {
                          navigate(`/social/chat/${selectedFriend.id}`);
                          setSelectedFriend(null);
                          setOrbRect(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-500 text-black h-12 rounded-2xl font-black italic uppercase tracking-widest text-[9px] hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                      >
                        <MessageSquare size={12} />
                        Chat
                      </button>
                      <button 
                        onClick={() => {
                          navigate(`/profile/${selectedFriend.id}`);
                          setSelectedFriend(null);
                          setOrbRect(null);
                        }}
                        className="w-12 h-12 shrink-0 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/80 rounded-2xl transition-all active:scale-95 shadow-lg"
                        title="View Profile"
                      >
                        <Users size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="modes"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-3 w-full"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setSelectedMode('deck')}
                          className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
                            selectedMode === 'deck' 
                              ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                              : 'bg-white/5 border-white/10 text-white/60'
                          }`}
                        >
                          <BookOpen size={16} />
                          <span className="text-[8px] font-black uppercase italic tracking-tighter">Deck Duel</span>
                        </button>
                        <button 
                          onClick={() => setSelectedMode('writing')}
                          className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
                            selectedMode === 'writing' 
                              ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                              : 'bg-white/5 border-white/10 text-white/60'
                          }`}
                        >
                          <Zap size={16} />
                          <span className="text-[8px] font-black uppercase italic tracking-tighter">Writing Duel</span>
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setDuelView('actions');
                            setSelectedMode(null);
                          }}
                          className="flex-1 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white h-12 rounded-2xl transition-all font-black italic uppercase tracking-widest text-[9px]"
                        >
                          <ChevronLeft size={16} className="mr-1" />
                          Back
                        </button>
                      </div>

                      <AnimatePresence>
                        {selectedMode && !isSendingDuel && (
                          <motion.button 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            onClick={async () => {
                              setIsSendingDuel(true);
                              try {
                                const eligibleDecks = state.decks.filter((d: any) => getDeckCards(d.id).length >= 5);
                                const deckId = selectedMode === 'deck' ? eligibleDecks[0]?.id : undefined;

                                if (selectedMode === 'deck' && !deckId) {
                                  alert("Create a deck with at least 5 cards before initiating a Deck Duel.");
                                  setIsSendingDuel(false);
                                  return;
                                }

                                const duelId = await createDuel(selectedMode as any, selectedFriend.id, deckId);
                                if (!duelId) {
                                  alert("System Error: Failed to initialize combat link.");
                                  setIsSendingDuel(false);
                                  return;
                                }

                                setIsSendingDuel(false);
                                setIsDuelSent(true);
                                // Show success state briefly before transitioning
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                
                                navigate(`/duels/${duelId}`);
                                setSelectedFriend(null);
                                setOrbRect(null);
                                setDuelView('actions');
                                setIsDuelSent(false);
                              } catch (err: any) {
                                alert(err.message || "Failed to initialize combat link.");
                                setIsSendingDuel(false);
                              }
                            }}
                            className="flex items-center justify-center gap-3 bg-white text-black h-14 rounded-2xl font-black italic uppercase tracking-widest text-[10px] w-full shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-95"
                          >
                            <Send size={14} />
                            Send Duel Challenge
                          </motion.button>
                        )}
                        {isSendingDuel && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center py-4 gap-3"
                          >
                            <Loader2 className="animate-spin text-white/40" size={20} />
                            <span className="text-[8px] font-black text-white/20 uppercase italic tracking-widest">Encrypting Challenge...</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showRequestsModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRequestsModal(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ 
                opacity: 0, 
                y: 100,
                scale: 0.8,
                x: '-50%',
                rotateX: -15
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1,
                x: '-50%',
                rotateX: 0
              }}
              exit={{ 
                opacity: 0, 
                y: 60,
                scale: 0.9,
                x: '-50%',
                rotateX: -10
              }}
              style={{
                position: 'fixed',
                left: '50%',
                bottom: '140px',
                perspective: '1000px',
                transformOrigin: 'bottom center'
              }}
              transition={{ 
                type: 'spring', 
                damping: 25, 
                stiffness: 400,
                mass: 0.8
              }}
              className="z-[101] w-[300px] bg-[#080A0E]/98 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] flex flex-col gap-4 animate-modal"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">Friend Requests</span>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[8px] font-black italic">
                  {friends.filter(f => f.status === 'pending' && f.isIncoming).length} INCOMING
                </span>
              </div>
              
              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {friends.filter(f => f.status === 'pending' && f.isIncoming).length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2">
                    <Users size={20} className="text-white/10 animate-pulse" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">No pending requests</span>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {friends.filter(f => f.status === 'pending' && f.isIncoming).map((req) => {
                      const isAccepting = acceptingIds.has(req.friendshipId);
                      return (
                        <motion.div 
                          key={req.friendshipId}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            borderColor: isAccepting ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.05)',
                            backgroundColor: isAccepting ? 'rgba(20,83,45,0.2)' : 'rgba(255,255,255,0.02)',
                            boxShadow: isAccepting ? '0 0 20px rgba(34,197,94,0.15)' : 'none'
                          }}
                          exit={{ opacity: 0, scale: 0.8, x: 50, transition: { duration: 0.3 } }}
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                          className="flex items-center justify-between border rounded-2xl p-3 gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <SmallOrb hue={req.orb_hue || 200} state={isAccepting ? "syncing" : "active"} size={28} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-black text-white italic uppercase tracking-wider truncate">
                                {req.name}
                              </span>
                              <span className={cn(
                                "text-[7px] font-bold uppercase italic tracking-tighter transition-colors",
                                isAccepting ? "text-green-400 animate-pulse" : "text-white/30"
                              )}>
                                {isAccepting ? 'Syncing Link...' : 'Awaiting Link'}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAcceptFriend(req.friendshipId)}
                            disabled={isAccepting}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center justify-center min-w-[54px] h-6",
                              isAccepting 
                                ? "bg-green-500 text-black border border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                                : "bg-cyan-500 text-black hover:bg-cyan-400"
                            )}
                          >
                            {isAccepting ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-3 h-3 border-2 border-black border-t-transparent rounded-full shrink-0"
                              />
                            ) : 'ACCEPT'}
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
              
              <button
                onClick={() => setShowRequestsModal(false)}
                className="w-full py-2 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-[0.98] mt-1"
              >
                Close Portal
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
               <div className="px-2 mb-2 flex items-center justify-between">
                 <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">Friends</span>
                 
                 {/* Requests Button */}
                 <button
                   onClick={() => setShowRequestsModal(true)}
                   className="px-3 py-1 bg-cyan-400/10 hover:bg-cyan-400/25 border border-cyan-400/20 rounded-lg text-[8px] font-black uppercase tracking-widest text-cyan-400 transition-all active:scale-95 flex items-center gap-1.5 relative"
                 >
                   REQUESTS
                   {friends.filter(f => f.status === 'pending' && f.isIncoming).length > 0 && (
                     <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
                   )}
                 </button>
               </div>
               <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
                 {friends.filter(f => f.status === 'accepted').slice(0, 10).map((friend) => (
                   <div key={friend.id} className="relative flex flex-col items-center gap-2 shrink-0">
                     <button 
                       onClick={(e) => {
                         setOrbRect(e.currentTarget.getBoundingClientRect());
                         setSelectedFriend(friend);
                       }}
                       className="group"
                     >
                       <div className="relative group-hover:scale-110 transition-transform duration-300">
                         <SmallOrb hue={friend.orb_hue} state={friend.activity === 'In Battle' ? 'battle' : friend.activity === 'In Focus' ? 'active' : 'idle'} size={56} />
                         {(friend.activity === 'In Focus' || friend.activity === 'In Battle') && (
                           <div className={cn(
                             "absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#030406]",
                             friend.activity === 'In Battle' ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                           )} />
                         )}
                       </div>
                     </button>
                     <span className="text-[9px] font-black text-white/40 uppercase italic tracking-tighter max-w-[64px] truncate pb-1">
                       {friend.name.split(' ')[0]}
                     </span>
                   </div>
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
                  {searchResults.map(user => {
                    const relationship = friends.find(f => f.id === user.id);
                    return (
                      <div key={user.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div 
                          onClick={() => navigate(`/profile/${user.id}`)}
                          className="flex items-center gap-3 cursor-pointer group/card flex-1"
                        >
                          <div className="group-hover/card:scale-105 transition-transform duration-300">
                            <SmallOrb hue={user.orb_hue} state="active" size={32} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-white uppercase italic leading-none group-hover/card:text-cyan-400 transition-colors">{user.name}</div>
                            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1 italic">
                              @{user.username || user.name.toLowerCase().replace(/\s/g, '_')}
                            </div>
                          </div>
                        </div>
                        {relationship ? (
                          relationship.status === 'accepted' ? (
                            <button 
                              onClick={() => navigate(`/social/chat/${user.id}`)}
                              className="w-10 h-10 rounded-xl bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center hover:scale-105 transition-transform"
                            >
                              <MessageSquare size={16} />
                            </button>
                          ) : relationship.isIncoming ? (
                            <button 
                              onClick={() => handleAcceptFriend(relationship.friendshipId)}
                              className="px-3 h-10 rounded-xl bg-cyan-400 text-black font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 hover:scale-105 transition-transform animate-pulse"
                            >
                              <Check size={12} className="stroke-[3]" />
                              Accept
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center cursor-not-allowed">
                              <Check size={16} className="stroke-[3]" />
                            </div>
                          )
                        ) : (
                          <button 
                            onClick={() => handleAddFriend(user.id)} 
                            className="w-10 h-10 rounded-xl bg-cyan-400 text-black flex items-center justify-center hover:scale-105 transition-transform"
                          >
                            <Plus size={16} className="stroke-[3]" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Direct Messaging / Friends List */}
            <div className="px-6 space-y-4">
              <h3 className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] italic">Direct Messages</h3>
              {friends.filter(f => f.status === 'accepted').length > 0 ? (
                <div className="space-y-1">
                  {friends.filter(f => f.status === 'accepted').map((friend) => {
                    const isUnread = friend.last_message && friend.last_message.receiver_id === state.user?.id && !friend.last_message.is_read;
                    
                    return (
                    <div key={friend.id} className="relative">
                      <motion.button 
                        onClick={() => {
                          navigate(`/social/chat/${friend.id}`);
                        }}
                        className="w-full group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5"
                      >
                        <div className="relative shrink-0">
                          <SmallOrb hue={friend.orb_hue} state={friend.activity === 'In Battle' ? 'battle' : friend.activity === 'In Focus' ? 'active' : 'idle'} size={44} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors">
                              {friend.name}
                            </span>
                            {friend.last_message && (
                              <span className="text-[9px] font-black text-white/40 uppercase italic">
                                {formatTimeAgo(friend.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={cn("text-[10px] font-black uppercase italic truncate pr-4", isUnread ? "text-white" : "text-white/30")}>
                              {friend.last_message ? getDuelRetryCardPreview(friend.last_message.content) : "Tap to start conversation..."}
                            </p>
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  )})}
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
                    const activeSide = flippedDuels[duel.id] || 'p1';
                    const opponentSide = activeSide === 'p1' ? 'p2' : 'p1';
                    
                    const p1Votes = getHonourVotes(duel, 'p1');
                    const p2Votes = getHonourVotes(duel, 'p2');
                    
                    const votes = activeSide === 'p1' ? p1Votes : p2Votes;
                    const targetName = activeSide === 'p1' ? duel.p1?.name : duel.p2?.name;
                    const reviewerName = activeSide === 'p1' ? duel.p2?.name : duel.p1?.name;
                    const rating = duel[`${activeSide}_review_rating`];
                    const finalized = duel[`${activeSide}_honour_finalized`];
                    const approved = duel[`${activeSide}_honour_approved`];
                    const voteKey = `${duel.id}:${activeSide}`;
                    
                    const topicText = duel.mode === 'deck' 
                      ? 'ARMAMENT DECK SYNC' 
                      : (duel.p1_topic || duel.p2_topic || 'DECK CHALLENGE ACTIVE');

                    const answerText = duel.mode === 'deck'
                      ? (activeSide === 'p1'
                          ? `${duel.p1?.name || 'Player 1'} score locked: ${duel.p1_score} out of 10 fragments successfully synchronized.`
                          : `${duel.p2?.name || 'Player 2'} score locked: ${duel.p2_score !== null ? duel.p2_score : '...'} out of 10 fragments successfully synchronized.`
                        )
                      : (activeSide === 'p1' ? duel.p1_answer : duel.p2_answer);

                    const toggleFlip = (duelId: string) => {
                      setFlippedDuels(prev => ({
                        ...prev,
                        [duelId]: prev[duelId] === 'p2' ? 'p1' : 'p2'
                      }));
                    };

                    return (
                      <motion.div 
                        key={duel.id}
                        variants={itemVariants}
                        className="bg-[#0A0C10] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] group/duel"
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                        
                        {/* Header Panel */}
                        <div className="flex items-center justify-between mb-8">
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

                          {/* Flip Log Trigger */}
                          <button
                            onClick={() => toggleFlip(duel.id)}
                            className="px-4 py-2.5 bg-white/5 hover:bg-cyan-500 hover:text-black border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-cyan-400 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <RefreshCw size={10} />
                            FLIP TO {activeSide === 'p1' ? (duel.p2?.name || 'PEER') : (duel.p1?.name || 'OPERATOR')}
                          </button>
                        </div>

                        {/* 3D Rotational Container */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${duel.id}-${activeSide}`}
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="w-full"
                            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                          >
                            {/* Unified Question & Answer Card */}
                            <div className="bg-[#08090C]/80 border border-white/10 rounded-[2rem] p-6 space-y-5 shadow-3xl backdrop-blur-3xl relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300 mb-6">
                              <div className="absolute top-0 left-0 w-full h-[3px] bg-cyan-500/20" />
                              
                              {/* Question Compartment */}
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400/40 mb-1.5 block italic">
                                  {activeSide === 'p1' ? `${duel.p1?.name || 'Player 1'}'s Question` : `${duel.p2?.name || 'Player 2'}'s Question`}
                                </span>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">
                                  {topicText}
                                </h3>
                              </div>

                              {/* Neon custom divider line */}
                              <div className="h-px w-full bg-gradient-to-r from-cyan-500/20 via-white/5 to-transparent" />

                              {/* Answer Compartment */}
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400/40 mb-2 block italic">
                                  {activeSide === 'p1' ? `${duel.p1?.name || 'Player 1'}'s Answer` : `${duel.p2?.name || 'Player 2'}'s Answer`}
                                </span>
                                <div className="text-xs text-white/80 font-medium italic leading-relaxed max-h-[200px] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap select-text">
                                  {answerText || 'No transcript deployed across this conflict sector.'}
                                </div>
                              </div>

                              {/* Integrated Bottom telemetry indicator */}
                              <div className="flex items-center gap-2 opacity-20 pt-1">
                                 <span className="text-[8px] font-black uppercase tracking-widest italic">Neural Log Transcript</span>
                                 <Zap size={10} fill="currentColor" className="text-cyan-400" />
                              </div>
                            </div>

                            {/* Honour Ratings & Feedback */}
                            {rating ? (
                              <div className="rounded-[1.75rem] bg-[#05070A] border border-white/5 p-6 hover:border-cyan-400/20 transition-all shadow-inner">
                                <div className="flex items-start justify-between gap-6">
                                  <div>
                                    <div className="text-[9px] font-black text-cyan-400/30 uppercase tracking-[0.4em] italic mb-2">Honour Verification Details</div>
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
                                    {finalized ? (approved ? `+${duel[`${activeSide}_honour_xp_awarded`] || 0} XP` : 'PENALIZED') : `${votes.total} / 3 LOGS`}
                                  </div>
                                </div>

                                {duel[`${activeSide}_review_comment`] && (
                                  <div className="mt-5 p-5 bg-black rounded-2xl border border-white/5 text-[10px] font-black text-white/40 italic leading-relaxed uppercase tracking-widest leading-none">
                                    "{duel[`${activeSide}_review_comment`]}"
                                  </div>
                                )}
                                
                                {/* Upvotes & Downvotes (Verify / Void) */}
                                {!finalized && canVoteOnHonour(duel, activeSide) && !votes.hasVoted && (
                                  <div className="flex gap-3 mt-6">
                                    <button 
                                      disabled={votingKey === voteKey}
                                      onClick={() => handleHonourVote(duel, activeSide, true)}
                                      className="flex-1 py-4 bg-white/[0.03] hover:bg-emerald-500 hover:text-black border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all disabled:opacity-30 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                    >
                                      <Zap size={12} className="text-emerald-500" />
                                      UPVOTE ({votes.fair})
                                    </button>
                                    <button 
                                      disabled={votingKey === voteKey}
                                      onClick={() => handleHonourVote(duel, activeSide, false)}
                                      className="flex-1 py-4 bg-white/[0.03] hover:bg-red-500 hover:text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all disabled:opacity-30 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                    >
                                      <AlertCircle size={12} className="text-red-500" />
                                      DOWNVOTE ({votes.unfair})
                                    </button>
                                  </div>
                                )}

                                {!finalized && votes.hasVoted && (
                                  <div className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 italic animate-pulse">Signature Authenticated</div>
                                )}
                                
                                <div className="mt-6 pt-6 border-t border-white/[0.03] flex items-center justify-between">
                                  <div className="flex -space-x-2">
                                    {[...Array(3)].map((_, i) => (
                                      <div 
                                        key={i} 
                                        className={cn(
                                          "w-6 h-6 rounded-lg border flex items-center justify-center text-[8px] font-black italic",
                                          i < votes.total ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400" : "bg-black border-white/10 text-white/20"
                                        )}
                                      >
                                        {i + 1}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-[9px] font-black text-white/10 uppercase italic tracking-widest">
                                    {votes.total} Community Consensus Signals detected
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-[1.75rem] bg-white/[0.01] border border-white/5 p-8 text-center text-[10px] font-black uppercase tracking-widest text-white/20 italic">
                                Honour verification pending from reviewer node
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
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
                      hue={player.orb_hue}
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
                      <SmallOrb hue={user.orb_hue} size={40} />
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
        <Outlet />
      </AnimatePresence>
    </motion.div>
  );
}
