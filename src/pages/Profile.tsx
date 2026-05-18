import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Flame, BookOpen, Clock, ChevronRight, AlertTriangle, 
  Trophy, Lock, Shield, Activity, Orbit, MessageSquare, 
  Swords, UserMinus, UserPlus, ArrowLeft, Loader2, Link2, Check 
} from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { getRankColor, getRankTitle, getLevelFromXp, getXpProgress } from '@/src/lib/xp.ts';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

// ═══════════════════════════════════════════════
// RANK LADDER DATA
// ═══════════════════════════════════════════════

const RANKS = [
  { letter: 'E', title: 'Novice Learner', minLevel: 1, maxLevel: 5, color: '#94a3b8' },
  { letter: 'D', title: 'Card Apprentice', minLevel: 6, maxLevel: 10, color: '#22c55e' },
  { letter: 'C', title: 'Knowledge Seeker', minLevel: 11, maxLevel: 20, color: '#3b82f6' },
  { letter: 'B', title: 'Focus Hunter', minLevel: 21, maxLevel: 35, color: '#a855f7' },
  { letter: 'A', title: 'Arena Master', minLevel: 36, maxLevel: 50, color: '#ef4444' },
  { letter: 'S', title: 'Sovereign Scholar', minLevel: 51, maxLevel: 99, color: '#fbbf24' },
];

function SmallOrb({ hue = 200, state = 'idle', size = 36 }: { hue?: number; state?: string; size?: number }) {
  // Simple glass orb styling
  const glowColor = `hsla(${hue}, 100%, 50%, 0.3)`;
  const activeGradient = `radial-gradient(circle at 35% 35%, hsla(${hue}, 100%, 75%, 0.8), hsla(${hue}, 90%, 40%, 0.9) 50%, hsla(${hue}, 100%, 15%, 1) 100%)`;

  return (
    <div 
      className="rounded-full relative shrink-0 shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        boxShadow: `0 0 15px ${glowColor}`,
        background: activeGradient
      }}
    >
      <div className="absolute inset-0 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.5)] rounded-full pointer-events-none" />
      <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[1.5px] -rotate-[35deg]" />
    </div>
  );
}

// Helper to generate Achievements dynamically
function getAchievementsForStats(focusSessions: any[], decksCount: number, cards: any[], streak: number, totalXp: number) {
  const longestSess = focusSessions.length > 0 
    ? Math.max(...focusSessions.map(s => s.actual_duration || s.actualDuration || 0)) 
    : 0;
  const hasNoPause = focusSessions.some(s => 
    (s.no_pause_challenge || s.noPauseChallenge) && 
    (s.pause_count === 0 || s.pauseCount === 0) && 
    (s.is_completed || s.isCompleted)
  );
  const masteredCards = cards.filter(c => (c.mastery_state || c.masteryState) === 'mastered').length;
  const level = getLevelFromXp(totalXp);

  return [
    { id: 'first_focus', title: 'First Focus', description: 'Complete your first focus session', icon: '⏱', unlocked: focusSessions.length > 0 },
    { id: 'deck_creator', title: 'Deck Creator', description: 'Create your first deck', icon: '📚', unlocked: decksCount > 0 },
    { id: 'card_scholar', title: 'Card Scholar', description: 'Master 10 cards', icon: '🎓', unlocked: masteredCards >= 10 },
    { id: 'focus_warrior', title: 'Focus Warrior', description: 'Reach a 3-day streak', icon: '🔥', unlocked: streak >= 3 },
    { id: 'marathon', title: 'Marathon', description: 'Complete a 60+ minute session', icon: '🏃', unlocked: longestSess >= 3600 },
    { id: 'no_pause', title: 'No-Pause Legend', description: 'Complete a no-pause challenge', icon: '🛡', unlocked: hasNoPause },
    { id: 'centurion', title: 'Centurion', description: 'Reach Level 10', icon: '⚔', unlocked: level >= 10 },
    { id: 'vault', title: 'Knowledge Vault', description: 'Create 50+ flashcards', icon: '🏛', unlocked: cards.length >= 50 },
  ];
}

// ═══════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════

export function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  
  const {
    state, getLevel, getRank, getXpProgress: getMyXpProgress, resetUser, signOut,
    getTotalFocusTime, getTotalCardsStudied, getTotalCardsMastered,
    getStudyHeatmap, getAchievements, sendFriendRequest, acceptFriendRequest, removeFriend
  } = useApp();

  const isMe = !userId || userId === state.user?.id;

  // State for other player profile
  const [loading, setLoading] = useState(false);
  const [playerProfile, setPlayerProfile] = useState<any | null>(null);
  const [friendship, setFriendship] = useState<any | null>(null);
  const [friendshipStats, setFriendshipStats] = useState<any | null>(null);
  const [overallDuelStats, setOverallDuelStats] = useState<any | null>(null);
  
  // Custom fetched stats for other player
  const [playerFocusSessions, setPlayerFocusSessions] = useState<any[]>([]);
  const [playerDecksCount, setPlayerDecksCount] = useState(0);
  const [playerCards, setPlayerCards] = useState<any[]>([]);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fetch player details if not me
  const loadPlayerData = useCallback(async () => {
    if (isMe || !userId) return;
    setLoading(true);
    try {
      // 1. Fetch main profile
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profError) throw profError;
      setPlayerProfile(prof);

      // 2. Fetch friendship status
      const { data: friendData } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${state.user?.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${state.user?.id})`)
        .maybeSingle();
      setFriendship(friendData || null);

      // 3. Fetch direct friendship stats (messages count, duels count)
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`and(sender_id.eq.${state.user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${state.user?.id})`);

      const { count: duelCount } = await supabase
        .from('duels')
        .select('*', { count: 'exact', head: true })
        .or(`and(player1_id.eq.${state.user?.id},player2_id.eq.${userId}),and(player1_id.eq.${userId},player2_id.eq.${state.user?.id})`)
        .eq('status', 'finished');

      setFriendshipStats({
        messagesCount: msgCount || 0,
        duelsCount: duelCount || 0,
      });

      // 4. Fetch overall duel stats
      const { data: duels } = await supabase
        .from('duels')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .in('status', ['finished', 'community_review']);

      let wins = 0;
      let losses = 0;
      let draws = 0;
      let totalRatingSum = 0;
      let ratedDuelsCount = 0;

      if (duels) {
        duels.forEach(d => {
          const isP1 = d.player1_id === userId;
          const myRating = isP1 ? d.p1_review_rating : d.p2_review_rating;
          const opponentRating = isP1 ? d.p2_review_rating : d.p1_review_rating;

          if (myRating > 0) {
            totalRatingSum += myRating;
            ratedDuelsCount++;
          }

          if (myRating > 0 && opponentRating > 0) {
            if (myRating > opponentRating) wins++;
            else if (myRating < opponentRating) losses++;
            else draws++;
          }
        });
      }

      setOverallDuelStats({
        wins,
        losses,
        draws,
        total: duels?.length || 0,
        avgHonour: ratedDuelsCount > 0 ? (totalRatingSum / ratedDuelsCount) : 0,
      });

      // 5. Fetch overall player stats
      const [focusRes, decksRes, cardsRes] = await Promise.all([
        supabase.from('focus_sessions').select('*').eq('user_id', userId),
        supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('cards').select('*').eq('user_id', userId)
      ]);

      setPlayerFocusSessions(focusRes.data || []);
      setPlayerDecksCount(decksRes.count || 0);
      setPlayerCards(cardsRes.data || []);

    } catch (err) {
      console.error("[Profile] Load player data failed:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, isMe, state.user?.id]);

  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  // Friendship Actions
  const handleLinkSyndicate = async () => {
    if (!userId) return;
    setFriendActionLoading(true);
    try {
      await sendFriendRequest(userId);
      await loadPlayerData();
      alert("Syndicate link handshake initiated!");
    } catch (err) {
      alert("Handshake initialization failed.");
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAcceptSequence = async () => {
    if (!userId) return;
    setFriendActionLoading(true);
    try {
      await acceptFriendRequest(userId);
      await loadPlayerData();
      alert("Neural Syndicate Link accepted and established!");
    } catch (err) {
      alert("Acceptance failed.");
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleSeverLink = async () => {
    if (!userId) return;
    if (confirm("Irreversible sequence. Sever this neural Syndicate Link?")) {
      setFriendActionLoading(true);
      try {
        await removeFriend(userId);
        await loadPlayerData();
        alert("Syndicate Link severed successfully.");
      } catch (err) {
        alert("Sever sequence aborted.");
      } finally {
        setFriendActionLoading(false);
      }
    }
  };

  // Profile properties calculation depending on who we are viewing
  const activeName = isMe ? (state.user?.name || 'V-HUNTER') : (playerProfile?.name || 'Hunter');
  const activeXp = isMe ? state.totalXp : (playerProfile?.total_xp || 0);
  const activeStreak = isMe ? state.streak : (playerProfile?.streak || 0);
  const activeMomentum = isMe ? state.momentum : (playerProfile?.momentum || 0);
  
  const level = getLevelFromXp(activeXp);
  const rank = getRankFromLevel(level);
  const xpProgress = getXpProgress(activeXp);
  const rankColor = getRankColor(rank);
  const rankTitle = getRankTitle(rank);

  // Focus and Cards
  const totalFocusTime = isMe 
    ? getTotalFocusTime() 
    : playerFocusSessions.reduce((sum, s) => sum + (s.actual_duration || s.actualDuration || 0), 0);
  const cardsMastered = isMe 
    ? getTotalCardsMastered() 
    : playerCards.filter(c => (c.mastery_state || c.masteryState) === 'mastered').length;

  const memberSince = isMe 
    ? (state.user ? new Date(state.user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')
    : (playerProfile?.created_at ? new Date(playerProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');

  // Heatmap
  const heatmap = isMe ? getStudyHeatmap() : (() => {
    const days: { date: string; minutes: number; sessions: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dateStr = d.toISOString().split('T')[0];
      const focusMin = playerFocusSessions
        .filter(s => new Date(s.completed_at || s.completedAt).toDateString() === dayStr)
        .reduce((sum, s) => sum + (s.actual_duration || s.actualDuration || 0), 0) / 60;
      days.push({ date: dateStr, minutes: Math.round(focusMin), sessions: 0 });
    }
    return days;
  })();

  const maxMin = Math.max(...heatmap.map(d => d.minutes), 1);

  // Achievements
  const achievements = isMe 
    ? getAchievements() 
    : getAchievementsForStats(playerFocusSessions, playerDecksCount, playerCards, activeStreak, activeXp);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Rank Ladder Calculations
  const currentRankData = RANKS.find(r => r.letter === rank) || RANKS[0];
  const currentRankIdx = RANKS.findIndex(r => r.letter === rank);
  const nextRank = currentRankIdx < RANKS.length - 1 ? RANKS[currentRankIdx + 1] : null;

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

  if (loading) {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic animate-pulse">Syncing User profile...</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-24 px-1"
    >
      
      {/* Header bar back arrow if not me */}
      {!isMe && (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] italic">Back to Terminal</span>
        </div>
      )}

      {/* ═══ Player Card ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-6 border-white/5 shadow-2xl relative overflow-hidden bg-white/[0.01]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-5">
          
          {/* Orb Avatar */}
          <div className="relative">
            <motion.div
              animate={{ 
                boxShadow: [`0 0 20px ${rankColor}30`, `0 0 40px ${rankColor}60`, `0 0 20px ${rankColor}30`]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-24 h-24 rounded-[2.2rem] flex items-center justify-center text-4xl font-black text-white border border-white/10"
              style={{ background: `linear-gradient(135deg, ${rankColor}44, #000)` }}
            >
              {activeName.charAt(0).toUpperCase()}
            </motion.div>
            <div
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-black border-[3px] border-black shadow-xl italic"
              style={{ background: rankColor }}
            >
              {rank}
            </div>
          </div>

          {/* Info */}
          <div className="w-full">
            <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">{activeName}</h2>
            
            <div className="flex items-center justify-center gap-2 mt-2">
               <span className="text-[9px] font-black uppercase tracking-[0.4em] italic" style={{ color: rankColor }}>
                 {rankTitle.split(' ')[0]} <span className="text-white opacity-40">{rankTitle.split(' ')[1]}</span>
               </span>
            </div>

            {/* Level + XP Progress */}
            <div className="mt-6 px-4 max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Core Lvl {level}</span>
                <span className="text-[10px] font-black text-white italic tabular-nums">
                  {xpProgress.currentLevelXp} <span className="text-white/10">/</span> {xpProgress.nextLevelXp} <span className="text-[8px] opacity-40 ml-0.5">XP</span>
                </span>
              </div>
              <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.progress * 100}%` }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  className="h-full rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  style={{ background: rankColor }}
                />
              </div>
            </div>

            {/* Meta Tags */}
            <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
              <div className="px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/5">
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-widest italic">Joined <span className="text-cyan-400">{memberSince || 'Neural Node'}</span></span>
              </div>
              <div className="px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/5">
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-widest italic">{activeXp.toLocaleString()} Total XP</span>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ═══ Friendship Management Row (Only if NOT me) ═══ */}
      {!isMe && (
        <motion.div variants={itemVariants} className="system-panel p-5 border-white/5 bg-white/[0.015] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link2 className="text-cyan-400 shrink-0" size={16} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Syndicate Link Connection</span>
              <span className="text-xs font-black text-white uppercase italic mt-0.5">
                {friendship?.status === 'accepted' ? 'ACTIVE ENCRYPTED LINK' : friendship?.status === 'pending' ? 'HANDSHAKE SEQUENCE INITIATED' : 'LINK OFFLINE'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {friendship?.status === 'accepted' ? (
              <>
                <button
                  onClick={() => navigate(`/social/chat/${userId}`)}
                  className="px-4 py-2.5 bg-cyan-500 text-black border border-cyan-400 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-cyan-400 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <MessageSquare size={12} />
                  Open Uplink
                </button>
                <button
                  onClick={handleSeverLink}
                  disabled={friendActionLoading}
                  className="px-4 py-2.5 bg-red-650 hover:bg-red-600 text-white/90 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <UserMinus size={12} />
                  Sever
                </button>
              </>
            ) : friendship?.status === 'pending' ? (
              friendship.friend_id === userId ? (
                // Request sent by us
                <button
                  disabled
                  className="px-4 py-2.5 bg-white/5 text-white/30 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest italic flex items-center gap-1.5"
                >
                  <Orbit size={12} className="animate-spin text-cyan-400" />
                  Awaiting Handshake
                </button>
              ) : (
                // Incoming request
                <button
                  onClick={handleAcceptSequence}
                  disabled={friendActionLoading}
                  className="px-4 py-2.5 bg-green-500 text-black border border-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-green-400 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check size={12} strokeWidth={3} />
                  Accept Handshake
                </button>
              )
            ) : (
              // Not friends
              <button
                onClick={handleLinkSyndicate}
                disabled={friendActionLoading}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all active:scale-95 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
              >
                <UserPlus size={12} />
                Link Syndicate
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ Syndicate Friendship Stats (Only if NOT me & Accepted) ═══ */}
      {!isMe && friendship?.status === 'accepted' && friendshipStats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="system-panel p-4 flex items-center gap-3.5 border-white/5 bg-white/[0.015]">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-cyan-400">
              <MessageSquare size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white italic tracking-tighter tabular-nums">{friendshipStats.messagesCount}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-0.5">DIRECT ENCRYPTED UPLOADS</span>
            </div>
          </div>

          <div className="system-panel p-4 flex items-center gap-3.5 border-white/5 bg-white/[0.015]">
            <div className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500">
              <Swords size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white italic tracking-tighter tabular-nums">{friendshipStats.duelsCount}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-0.5">COMBAT CLASHES CONCLUDED</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Overall Duel stats (Rendered for ALL users) ═══ */}
      {overallDuelStats && (
        <motion.div variants={itemVariants} className="system-panel p-6 border-white/5 bg-white/[0.01]">
          <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-6 flex items-center gap-3.5 italic">
            <Swords size={14} className="text-cyan-400" /> Duel Arena Combat History
          </h3>
          
          <div className="grid grid-cols-3 gap-3 text-center mb-6">
            <div className="py-3 bg-white/[0.01] border border-white/5 rounded-2xl">
              <span className="text-xl font-black text-emerald-400 italic tabular-nums">{overallDuelStats.wins}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1 block">WINS</span>
            </div>
            <div className="py-3 bg-white/[0.01] border border-white/5 rounded-2xl">
              <span className="text-xl font-black text-red-400 italic tabular-nums">{overallDuelStats.losses}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1 block">LOSSES</span>
            </div>
            <div className="py-3 bg-white/[0.01] border border-white/5 rounded-2xl">
              <span className="text-xl font-black text-white/40 italic tabular-nums">{overallDuelStats.draws}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1 block">DRAWS</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Average Peer rating</span>
              <span className="text-xs font-black text-white uppercase italic mt-0.5">HONOUR EVALUATION RATIO</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-cyan-400 font-black italic text-[10px] tabular-nums">
              <Zap size={10} fill="currentColor" />
              {overallDuelStats.avgHonour > 0 ? `${overallDuelStats.avgHonour.toFixed(1)} / 5.0` : 'UNRATED'}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Quick Stats ═══ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {[
          { icon: <Flame size={18} className="text-orange-500" />, value: activeStreak, label: 'Streak', suffix: 'D' },
          { icon: <Zap size={18} className="text-cyan-400" />, value: `×${(1 + activeMomentum * 0.1).toFixed(1)}`, label: 'Momentum', suffix: '' },
          { icon: <BookOpen size={18} className="text-emerald-400" />, value: cardsMastered, label: 'Mastery', suffix: '' },
          { icon: <Clock size={18} className="text-blue-400" />, value: Math.round(totalFocusTime / 3600), label: 'Time Spent', suffix: 'H' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="system-panel p-4 flex items-center gap-3.5 border-white/5 bg-white/[0.015] hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
               {stat.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white leading-none italic tracking-tighter tabular-nums">{stat.value}{stat.suffix}</span>
              <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">{stat.label}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ═══ Rank Progression ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-6 border-white/5 bg-white/[0.01]">
        <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 italic">
          <Shield size={14} className="text-cyan-400" /> Hunter Rankings System
        </h3>
        <div className="space-y-2.5">
          {RANKS.map((r, i) => {
            const isCurrent = r.letter === rank;
            const isPast = i < currentRankIdx;
            const isFuture = i > currentRankIdx;

            return (
              <div
                key={r.letter}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative overflow-hidden group border",
                  isCurrent ? "bg-cyan-500/[0.03] border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.05)] scale-[1.01]" : "bg-white/[0.02] border-white/5",
                  isPast && "opacity-40",
                  isFuture && "opacity-20 translate-x-1.5"
                )}
              >
                {/* Rank Letter */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-black shrink-0 transition-all italic border-[3px] border-black/80",
                    isCurrent && "shadow-xl scale-105"
                  )}
                  style={{
                    background: isCurrent || isPast ? r.color : '#222',
                  }}
                >
                  {r.letter}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-black uppercase italic tracking-tighter", isCurrent ? "text-cyan-400" : "text-white")}>{r.title}</span>
                    {isCurrent && (
                      <span className="text-[7px] font-black text-black bg-cyan-400 px-1.5 py-0.5 rounded-full uppercase tracking-widest italic animate-pulse">Current</span>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-white/30 italic uppercase tracking-widest mt-0.5 block">
                    Lv. {r.minLevel} <span className="mx-1 opacity-20">—</span> {r.maxLevel}
                  </span>
                </div>

                {/* Status Indicator */}
                {isPast && <span className="text-emerald-400 font-black italic text-[10px]">COMPLETE</span>}
                {isCurrent && <ChevronRight size={16} className="text-cyan-400 animate-pulse" />}
                {isFuture && <Lock size={12} className="text-white/10" />}
              </div>
            );
          })}
        </div>

        {nextRank && (
          <div className="mt-8 pt-5 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] italic">Next Rank: {nextRank.letter}</span>
              <span className="text-[8px] font-black text-cyan-400 italic">Lv. {nextRank.minLevel}</span>
            </div>
            <div className="w-full h-[2px] bg-white/[0.03] mt-2.5 overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((level - currentRankData.minLevel) / (nextRank.minLevel - currentRankData.minLevel)) * 100, 100)}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                className="h-full rounded-full"
                style={{ background: nextRank.color }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ Study Activity History heatmap ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-6 border-white/5 bg-white/[0.01]">
        <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-6 flex items-center gap-3.5 italic">
          <Activity size={14} className="text-cyan-400" /> Focus core stability history
        </h3>

        {/* Heatmap Grid */}
        <div className="flex gap-[4px] justify-center overflow-x-auto no-scrollbar pb-2">
          {Array.from({ length: 12 }, (_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[4px] shrink-0">
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const day = heatmap[idx];
                if (!day) return <div key={dayIdx} className="w-[18px] h-[18px] bg-white/[0.02] rounded-[4px]" />;

                const intensity = day.minutes / maxMin;
                let bg = 'bg-white/[0.02]';
                let shadow = 'none';
                if (day.minutes > 0) {
                  if (intensity > 0.75) { bg = 'bg-cyan-400'; shadow = '0 0 10px rgba(34,211,238,0.6)'; }
                  else if (intensity > 0.5) { bg = 'bg-cyan-500'; shadow = '0 0 6px rgba(34,211,238,0.4)'; }
                  else if (intensity > 0.25) { bg = 'bg-cyan-600'; shadow = '0 0 4px rgba(34,211,238,0.2)'; }
                  else { bg = 'bg-cyan-900/50'; }
                }

                return (
                  <motion.div
                    key={dayIdx}
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    className={cn("w-[18px] h-[18px] rounded-[4px] transition-all cursor-crosshair group relative", bg)}
                    style={{ boxShadow: shadow }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-black border border-white/10 text-white text-[8px] font-black rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-xl italic">
                      {day.date}<br/>
                      <span className="text-cyan-400">{day.minutes}M FOCUSED</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Achievements ═══ */}
      <motion.div variants={itemVariants} className="system-panel p-6 border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-3.5 italic">
            <Trophy size={14} className="text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]" /> Hunter Achievements
          </h3>
          <span className="text-[9px] font-black text-white/20 italic tabular-nums">{unlockedCount} <span className="text-white/5 mx-0.5">/</span> {achievements.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "p-4 rounded-2xl border transition-all relative overflow-hidden group",
                a.unlocked
                  ? "bg-white/[0.03] border-cyan-500/20 shadow-2xl"
                  : "bg-white/[0.01] border-white/5 opacity-30 grayscale"
              )}
            >
              {a.unlocked && (
                <div className="absolute top-2 right-2">
                   <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
                </div>
              )}
              <div className="text-2xl mb-2.5 group-hover:scale-125 transition-transform duration-500 inline-block">{a.icon}</div>
              <h4 className={cn("text-[10px] font-black uppercase italic tracking-tighter", a.unlocked ? "text-white" : "text-white/30")}>{a.title}</h4>
              <p className={cn("text-[8px] font-black mt-1 leading-relaxed uppercase tracking-wider italic", a.unlocked ? "text-white/40" : "text-white/10")}>{a.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Help & System support (Only if me) ═══ */}
      {isMe && (
        <>
          <motion.div variants={itemVariants} className="system-panel p-6 border-white/5 bg-white/[0.01]">
            <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-3 flex items-center gap-3.5 italic">
              <Orbit size={14} className="text-cyan-400" /> System Neural Support
            </h3>
            <p className="text-[9px] font-black text-white/20 mb-5 leading-relaxed uppercase tracking-widest italic">
              Re-initialize the neural synchronization tour to understand all system capabilities.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('levelup_tour_seen');
                window.location.href = '/home';
              }}
              className="w-full py-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 font-black text-[9px] uppercase tracking-[0.2em] italic hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-2.5 shadow-2xl"
            >
              <Orbit size={14} />
              START SYSTEM TOUR
            </button>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants} className="system-panel p-6 border-red-500/10 bg-red-500/[0.01]">
            <h3 className="text-[9px] font-black text-red-500 uppercase tracking-[0.4em] mb-3 flex items-center gap-3.5 italic">
              <AlertTriangle size={14} className="animate-pulse" /> Core Purge Zone
            </h3>
            <p className="text-[9px] font-black text-white/20 mb-6 leading-relaxed uppercase tracking-widest italic">
              Irreversible action. All study progress, decks, and level data will be permanently deleted.
            </p>
            
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="py-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-black text-[9px] uppercase tracking-[0.2em] italic hover:bg-red-500/10 hover:border-red-500/40 transition-all shadow-2xl"
              >
                DELETE DATA
              </button>
              <button
                onClick={() => signOut()}
                className="py-3.5 rounded-xl border border-white/5 bg-white/[0.03] text-white/60 font-black text-[9px] uppercase tracking-[0.2em] italic hover:bg-white/[0.05] hover:text-white transition-all shadow-2xl"
              >
                LOGOUT
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* ═══ Reset Confirmation Modal ═══ */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/90 backdrop-blur-2xl"
            onClick={e => e.target === e.currentTarget && setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="system-panel p-8 max-w-sm w-full shadow-2xl border-red-500/30 bg-black relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent pointer-events-none" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 rounded-[1.8rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <AlertTriangle size={32} className="text-red-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-3">Total System Purge?</h3>
                <p className="text-[9px] font-black text-white/30 mb-8 leading-relaxed uppercase tracking-[0.2em] italic">
                  Requested core reset. All neural fragments and xp loads will be permanently deleted from the interface.
                </p>
              </div>
              <div className="flex flex-col gap-2 relative z-10">
                <button
                  onClick={() => { resetUser(); setShowResetConfirm(false); }}
                  className="w-full py-4 rounded-xl bg-red-500 text-black font-black text-[10px] uppercase tracking-[0.3em] italic hover:bg-red-400 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                >
                  CONFIRM PURGE
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 rounded-xl border border-white/10 bg-white/[0.05] text-white/60 font-black text-[10px] uppercase tracking-[0.3em] italic hover:text-white transition-all shadow-2xl mt-1.5"
                >
                  ABORT SEQUENCE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
