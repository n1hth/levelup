import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/src/lib/store.tsx';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils.ts';
import { type OrbState, getOrbColors, getOrbGradient, getRankEvolution, getRankBlur, getFacetCount, hasParticleField, getInternalRotationSpeed, getRankStyles } from '@/src/lib/orb-color';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  Clock,
  Book,
  Swords, 
  Users, 
  Plus, 
  Search,
  Timer,
  Activity,
  Flame,
  Zap,
  RotateCcw,
  Bell,
  UserPlus,
  X
} from 'lucide-react';



const ARC_RADIUS = 90; 
const ARC_THICKNESS = 4;
const SEGMENTS = [
  { path: '/decks', label: 'DECKS', icon: <Book size={20} />, angle: 200 },
  { path: '/focus', label: 'FOCUS', icon: <Clock size={20} />, angle: 235 },
  { path: '/home', label: 'HOME', icon: <Home size={20} />, angle: 270 },
  { path: '/battle', label: 'ARENA', icon: <Swords size={20} />, angle: 305 },
  { path: '/social', label: 'SOCIAL', icon: <Users size={20} />, angle: 340 },
];

export interface OrbProps {
  onInteractionChange?: (state: 'none' | 'holding' | 'insight' | 'nav-open') => void;
}

export function Orb({ onInteractionChange }: OrbProps) {
  const { state, getTodayFocusTime, getXpProgress, getRank, getOrbHue, isOrbHidden, getNotifications, acceptFriendRequest, acceptDuelInvite, dismissNotification, clearNotifications, rankUpTrigger } = useApp();
  const [orbState, setOrbState] = useState<OrbState>('dormant');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [pulseType, setPulseType] = useState<'open' | 'close'>('open');
  const [showPulseWave, setShowPulseWave] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [latestDuelNotif, setLatestDuelNotif] = useState<any>(null);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationsRef = useRef<any[]>([]);
  const shownBubblesRef = useRef<Set<string>>(new Set());
  const isHiddenRef = useRef(isOrbHidden);
  
  const location = useLocation();
  const navigate = useNavigate();
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartY = useRef<number | null>(null);

  // Sync interactions with parent
  useEffect(() => {
    if (isHolding) onInteractionChange?.('holding');
    else if (isInsightOpen) onInteractionChange?.('insight');
    else if (isNavOpen) onInteractionChange?.('nav-open');
    else onInteractionChange?.('none');
  }, [isHolding, isInsightOpen, isNavOpen, onInteractionChange]);

  useEffect(() => {
    isHiddenRef.current = isOrbHidden;
    if (isOrbHidden) {
      setIsNavOpen(false);
      setIsInsightOpen(false);
      setShowBubble(false);
      setShowPulseWave(false);
    }
  }, [isOrbHidden]);

  const fetchNotifications = async () => {
    const rawData = await getNotifications();
    
    // Filter out duel_ready notifications if the user is already in that specific duel lobby
    const data = rawData.filter((n: any) => {
      if (n.type === 'duel_ready') {
        const lobbyPath = `/duels/${n.duel_id || n.id.replace(':ready', '')}`;
        if (location.pathname === lobbyPath || location.pathname === lobbyPath + '/') {
          return false;
        }
      }
      return true;
    });

    const prevNotifs = notificationsRef.current;
    
    // Check for new notifications by ID
    const newItems = data.filter((n: any) => !prevNotifs.find(pn => pn.id === n.id));
    
    if (newItems.length > 0 && !isHiddenRef.current) {
      // Bright pulse on any new notification
      setShowPulseWave(true);
      setTimeout(() => setShowPulseWave(false), 1500);

      // Check specifically for duel or friend request events to show bubble
      const newEvent = newItems.find((n: any) => n.type === 'duel' || n.type === 'duel_ready' || n.type === 'duel_cancelled' || n.type === 'friend');
      if (newEvent && !shownBubblesRef.current.has(newEvent.id)) {
        // Only show bubble if notification was created/updated in the last 45 seconds
        const isRecent = Date.now() - new Date(newEvent.timestamp).getTime() < 45 * 1000;
        if (isRecent) {
          shownBubblesRef.current.add(newEvent.id);
          setLatestDuelNotif(newEvent);
          setShowBubble(true);
          setTimeout(() => setShowBubble(false), 8000);
        }
      }
    }
    
    notificationsRef.current = data;
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []); // Poll independently of state changes

  const handleAction = async (notif: any, action: 'accept' | 'decline') => {
    if (notif.type === 'duel_ready') {
      if (action === 'accept') {
        setIsNavOpen(false);
        navigate(`/duels/${notif.duel_id || notif.id.replace(':ready', '')}`);
      } else {
        await dismissNotification(notif);
        fetchNotifications();
      }
      return;
    }

    if (notif.type === 'duel_cancelled') {
      await dismissNotification(notif);
      fetchNotifications();

      if (action === 'accept' && notif.sender_id) {
        setIsNavOpen(false);
        navigate(`/social/chat/${notif.sender_id}`, {
          state: {
            duelRetry: {
              duelId: notif.duel_id,
              senderId: notif.sender_id,
              senderName: notif.sender,
              mode: notif.mode || 'writing'
            }
          }
        });
      }
      return;
    }

    if (action === 'accept') {
      if (notif.type === 'friend') {
        await acceptFriendRequest(notif.id);
      } else if (notif.type === 'duel') {
        const duelId = await acceptDuelInvite(notif.id);
        if (duelId) {
          navigate(`/duels/${duelId}`);
          setIsNavOpen(false);
        } else {
          alert("Duel record not found or already started.");
        }
      } else {
        await dismissNotification(notif);
      }
    } else {
      await dismissNotification(notif);
    }
    fetchNotifications();
  };

  const handleClearAll = async () => {
    setNotifications([]);
    notificationsRef.current = [];
    await clearNotifications();
    fetchNotifications();
  };

  // Global Duel Sync Listener
  useEffect(() => {
    if (!state.user) return;
    
    const channel = supabase
      .channel('global-duel-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'duels'
      }, (payload: any) => {
        if (!payload.new) return;
        const isMyDuel = payload.new.player1_id === state.user?.id || payload.new.player2_id === state.user?.id;
        if (isMyDuel && payload.new.status === 'setup') {
          // If we are already on the duel page, don't re-navigate
          if (!window.location.pathname.startsWith(`/duels/${payload.new.id}`)) {
            navigate(`/duels/${payload.new.id}`);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.user?.id, navigate]);

  // Rank-based details
  const rank = getRank();
  const rankTier = rank.split(' ')[0][0]; 
  
  // Focus tracking
  const todayFocusTime = getTodayFocusTime();
  const focusStreak = state.streak;
  const momentum = 1 + state.momentum * 0.1;
  const xp = getXpProgress();

  // Heavenly Sea Blue nav orb
  const orbHue = 220;
  const evolution = useMemo(() => getRankEvolution(rankTier), [rankTier]);
  const rankStyles = useMemo(() => getRankStyles(evolution, orbHue), [evolution, orbHue]);

  // Track level/rank for animations
  const prevLevelRef = useRef(xp.level);
  const prevRankRef = useRef(rank);
  // Using state for actually triggering the re-render/animation
  const [evolutionTrigger, setEvolutionTrigger] = useState<null | 'level' | 'rank'>(null);
  const [showRankUpCinematic, setShowRankUpCinematic] = useState(false);

  useEffect(() => {
    if (rankUpTrigger > 0) {
      setShowRankUpCinematic(true);
      setOrbState('evolving');
      const timer = setTimeout(() => {
        setOrbState('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [rankUpTrigger]);

  useEffect(() => {
    if (xp.level > prevLevelRef.current) {
      const isRankUp = rank !== prevRankRef.current;
      setEvolutionTrigger(isRankUp ? 'rank' : 'level');
      
      if (isRankUp) {
        setShowRankUpCinematic(true);
      }
      
      setOrbState('evolving');
      setShowPulseWave(true);
      
      // Auto-clear after animation
      const timer = setTimeout(() => {
        setEvolutionTrigger(null);
        setOrbState('idle'); // Fallback, will be recalculated
      }, isRankUp ? 5000 : 2000);
      
      prevLevelRef.current = xp.level;
      prevRankRef.current = rank;
      return () => clearTimeout(timer);
    }
  }, [xp.level, rank]);

  // Heavenly Sea Blue nav orb
  const palette = useMemo(() => getOrbColors(orbHue, orbState), [orbHue, orbState]);
  const orbGradient = useMemo(() => rankStyles.gradient, [rankStyles]);
  const facetCount = useMemo(() => getFacetCount(evolution), [evolution]);
  const rotationSpeed = useMemo(() => rankStyles.rotationSpeed, [rankStyles]);

  useEffect(() => {
    // Session Active Check
    const isSessionActive = state.focusSessions.some(s => !s.completedAt);
    
    if (isSessionActive) {
      setOrbState('active');
    } else if (focusStreak > 5 && momentum > 2.0) {
      setOrbState('peaked');
    } else if (todayFocusTime === 0) {
      setOrbState('dormant');
    } else {
      setOrbState('idle');
    }
  }, [todayFocusTime, focusStreak, momentum, state.focusSessions]);

  const [isTapping, setIsTapping] = useState(false);

  const handleTap = () => {
    if (isHolding) return;
    
    const opening = !isNavOpen;
    setIsNavOpen(opening);
    setPulseType(opening ? 'open' : 'close');
    
    // Trigger Tap Glow Wave + Screen Pulse
    setIsTapping(true);
    setShowPulseWave(true);
    setTimeout(() => {
      setIsTapping(false);
    }, 300);
    setTimeout(() => {
      setShowPulseWave(false);
    }, 2500);
  };

  const handlePointerDown = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => setIsHolding(true), 400);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setIsHolding(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = dragStartY.current - e.touches[0].clientY;
    if (deltaY > 40 && !isInsightOpen) {
      setIsInsightOpen(true);
      dragStartY.current = null;
    }
  };

  const orbVariants = {
    navOpen: { scale: 1, y: 0 },
    dormant: {
      scale: [1, 1.02, 1],
      y: [0, -4, 0],
      transition: { 
        duration: 4, 
        repeat: Infinity, 
        ease: "easeInOut" as const 
      }
    },
    idle: {
      scale: [1, 1.05, 1],
      y: [0, -6, 0],
      transition: { 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut" as const 
      }
    },
    active: {
      scale: [1, 1.08, 1],
      y: 0,
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
    },
    peaked: {
       scale: [1, 1.08, 1],
       y: 0,
       transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
    },
    tapping: {
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.15,
        ease: "easeOut" as const
      }
    },
    holding: {
      scale: 1.1,
      y: 0,
      transition: { duration: 0.2 }
    },
    depleted: { scale: 1 },
    evolving: {
      scale: [1, 2.2, 1],
      rotate: [0, 180, 360],
      filter: ["brightness(1) blur(0px)", "brightness(3) blur(4px)", "brightness(1) blur(0px)"],
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  };

  const glowVariants = {
    evolving: {
      scale: [1, 4, 1],
      opacity: [0.5, 1, 0.5],
      transition: { duration: 1.5, ease: "easeInOut" }
    },
    dormant: { 
      opacity: [0.15, 0.35, 0.15], 
      scale: [0.8, 1.1, 0.8],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
    },
    idle: { 
      opacity: [0.4, 0.7, 0.4], 
      scale: [1, 1.3, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
    },
    active: { opacity: 0.85, scale: 1.5 },
    peaked: { opacity: 1, scale: 1.8 },
    tapping: {
      scale: [1, 1.3, 1], 
      opacity: [1, 1, 1],
      transition: {
        duration: 0.45,
        times: [0, 0.33, 1],
        ease: ["easeOut", "easeIn"] as any[]
      }
    } as any
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════ */}
      {/* FIXED NOTIFICATION BENTO BOX — TOP HALF       */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {isNavOpen && !isOrbHidden && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-[60px] left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[380px] z-[110] pointer-events-auto"
          >
            {/* Outer Glow */}
            <div className="absolute -inset-3 rounded-[3.5rem] blur-[30px] pointer-events-none" style={{ background: `${palette.glow}` }} />
            
            {/* Bento Box */}
            <div className="relative bg-[#0a1520]/80 backdrop-blur-3xl rounded-[2rem] flex flex-col overflow-hidden" style={{ border: `1px solid ${palette.muted}`, boxShadow: `0 0 80px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` }}>
              {/* Gradient shimmer line */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${palette.accent}, transparent)` }} />
              
              {/* Header — always pinned */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${palette.muted}` }}>
                    <Bell size={11} style={{ color: palette.accent }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: palette.accent }}>Neural Alerts</span>
                </div>
                <button 
                  onClick={handleClearAll}
                  className="text-[8px] font-black text-white/40 uppercase tracking-widest hover:text-red-400 transition-colors active:scale-95 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-red-500/20 bg-white/5"
                >
                  Clear All
                </button>
              </div>

              {/* Scrollable notification list */}
              <div className="px-4 pb-4 space-y-2.5 overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(45vh - 80px)' }}>
                <AnimatePresence mode="popLayout">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <motion.div 
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 transition-all hover:bg-white/[0.07] active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            notif.type === 'friend' ? "bg-emerald-500/15 text-emerald-400" : notif.type === 'duel_cancelled' ? "bg-red-500/15 text-red-400" : "bg-cyan-500/15 text-cyan-400"
                          )}>
                            {notif.type === 'friend' ? <UserPlus size={15} /> : <Swords size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-black text-white uppercase tracking-tight truncate">{notif.sender}</div>
                            <div className="text-[8px] font-bold text-cyan-400/40 uppercase tracking-[0.15em] mt-0.5">
                              {notif.type === 'friend' ? 'Friend Request' : (notif.message || 'Duel Challenge Issued')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {notif.type === 'duel_cancelled' ? (
                            <button
                              onClick={() => handleAction(notif, 'accept')}
                              className="flex-1 py-2 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                              Acknowledge
                            </button>
                          ) : notif.type === 'duel_ready' ? (
                            <button
                              onClick={() => handleAction(notif, 'accept')}
                              className="flex-1 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                              Join
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleAction(notif, 'accept')}
                              className="flex-1 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                              Accept
                            </button>
                          )}
                          <button 
                            onClick={() => handleAction(notif, 'decline')}
                            className="px-3 rounded-xl bg-white/[0.04] text-white/30 hover:bg-red-500/15 hover:text-red-400 transition-all flex items-center justify-center active:scale-95"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-8 flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                         <Bell size={14} className="text-white" />
                      </div>
                      <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] italic">All Systems Clear</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Bottom accent line */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* BACKDROP + PULSE + ORB CONTAINER               */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isOrbHidden && (isHolding || isInsightOpen || isNavOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => { setIsNavOpen(false); setIsInsightOpen(false); }}
            className="fixed inset-0 z-[80] bg-black/60 pointer-events-auto backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPulseWave && !isOrbHidden && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, x: '-50%' }}
            animate={{ 
              scale: [0.8, 1.4, 1.8, 3.5], 
              opacity: [0, 0.4, 0.4, 0],
              x: '-50%'
            }}
            exit={{ opacity: 0, x: '-50%' }}
            transition={{ 
              duration: 2.2, 
              times: [0, 0.15, 0.6, 1],
              ease: "linear"
            }}
            className="fixed bottom-[40px] left-1/2 w-[120px] h-[120px] rounded-full z-[85] pointer-events-none blur-[90px]"
            style={{ 
              background: `radial-gradient(circle, ${palette.glow} 0%, transparent 75%)`,
              willChange: 'transform'
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOrbHidden && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, x: '-50%', transition: { duration: 0.5 } }}
            style={{ willChange: 'transform' }}
            className="fixed bottom-[40px] left-1/2 z-[100] flex flex-col items-center pointer-events-none"
          >
            <AnimatePresence>
              {isNavOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none w-[400px] h-[400px] bottom-[-160px]"
                  >
                    <svg width="400" height="400" viewBox="0 0 400 400" className="overflow-visible">
                      <g transform="translate(200, 200)">
                        {/* Global Background Track */}
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.25 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          d={`M ${ARC_RADIUS * Math.cos(185 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(185 * (Math.PI / 180))} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${ARC_RADIUS * Math.cos(355 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(355 * (Math.PI / 180))}`}
                          fill="none"
                          stroke={palette.accent}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeOpacity={0.25}
                        />

                        {SEGMENTS.map((seg, i) => {
                          const isActive = location.pathname === seg.path || (seg.path !== '/home' && location.pathname.startsWith(seg.path));
                          const angleRad = seg.angle * (Math.PI / 180);
                          
                          const startAngle = (seg.angle - 11) * (Math.PI / 180);
                          const endAngle = (seg.angle + 11) * (Math.PI / 180);
                          const x1 = ARC_RADIUS * Math.cos(startAngle);
                          const y1 = ARC_RADIUS * Math.sin(startAngle);
                          const x2 = ARC_RADIUS * Math.cos(endAngle);
                          const y2 = ARC_RADIUS * Math.sin(endAngle);

                          const iconX = (ARC_RADIUS + 38) * Math.cos(angleRad);
                          const iconY = (ARC_RADIUS + 38) * Math.sin(angleRad);

                          return (
                            <g key={seg.path}>
                              {isActive && (
                                <motion.path
                                  initial={{ pathLength: 0, opacity: 0 }}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                  transition={{ duration: 0.3, delay: 0.05 }}
                                  d={`M ${x1} ${y1} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${x2} ${y2}`}
                                  fill="none"
                                  stroke={palette.accent}
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                />
                              )}

                              <foreignObject 
                                x={iconX - 40} 
                                y={iconY - 40} 
                                width="80" 
                                height="80"
                                className="overflow-visible"
                              >
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  transition={{ 
                                    duration: 0.35,
                                    delay: 0.05 + i * 0.03,
                                    ease: [0.22, 1, 0.36, 1]
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(seg.path);
                                    setIsNavOpen(false);
                                    setPulseType('close');
                                  }}
                                  className={cn(
                                    "w-full h-full flex flex-col items-center justify-center pointer-events-auto",
                                    isActive ? "" : "text-[#3d526b] hover:text-[#4d6682]"
                                  )}
                                  style={isActive ? { color: palette.accent } : undefined}
                                >
                                  <div className={cn(
                                    "transition-transform duration-300",
                                    isActive && "scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]"
                                  )}>
                                    {seg.icon}
                                  </div>
                                  <motion.span 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isActive ? 1 : 0 }}
                                    className="text-[9px] font-black tracking-[0.15em] uppercase mt-1.5 leading-none"
                                  >
                                    {seg.label}
                                  </motion.span>
                                </motion.button>
                              </foreignObject>
                            </g>
                          );
                        })}
                      </g>
                    </svg>
                  </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isHolding && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: -120 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="absolute w-[280px] bg-[#0D1A28] border border-[#1A3040] rounded-[20px] p-6 shadow-2xl z-[130]"
                >
                  <div className="space-y-4">
                    {[
                      { label: 'STREAK', value: `${focusStreak}D` },
                      { label: 'MOMENTUM', value: `${momentum.toFixed(1)}×` },
                      { label: 'FRAGMENTS', value: '0 / 8' },
                      { label: 'NEXT RANK', value: `${xp.nextLevelXp - xp.currentLevelXp} XP` }
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-end">
                        <span className="text-[10px] font-black tracking-[0.2em] mb-1" style={{ color: palette.accent }}>{item.label}</span>
                        <span className="text-[22px] font-bold text-white leading-none italic">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isInsightOpen && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: -140, opacity: 1 }}
                  exit={{ y: 200, opacity: 0 }}
                  className="fixed left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#0C1922] border border-[#1A3050] rounded-20 shadow-2xl z-[140] flex flex-col items-center p-8 rounded-[20px]"
                >
                  <Activity size={24} className="opacity-20 mb-4" style={{ color: palette.accent }} />
                  <p className="text-white text-lg text-center font-medium leading-relaxed">
                     Neural stability maintained. {xp.nextLevelXp - xp.currentLevelXp} XP until evolution.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              animate={evolutionTrigger ? "evolving" : (isTapping ? "tapping" : orbState)}
              variants={glowVariants}
              className="absolute inset-0 blur-[20px] rounded-full -z-10"
              style={{ background: palette.primary, scale: evolutionTrigger === 'rank' ? 2 : 1, willChange: 'transform, opacity' }}
            />

            <motion.div
              id="nav-orb"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={handleTap}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              animate={evolutionTrigger ? "evolving" : (isNavOpen ? "navOpen" : (isInsightOpen ? "navOpen" : (isHolding ? "holding" : (isTapping ? "tapping" : orbState))))}
              variants={orbVariants}
              transition={{
                duration: evolutionTrigger ? 1.5 : 0.22,
                ease: evolutionTrigger ? "easeInOut" : [0.16, 1, 0.3, 1]
              }}
              className={cn(
                "w-[80px] h-[80px] rounded-full relative overflow-hidden cursor-pointer pointer-events-auto will-change-transform",
                orbState === 'dormant' && !evolutionTrigger && "brightness-[0.7] saturate-[0.5]",
                orbState === 'depleted' && !evolutionTrigger && "brightness-[0.4] saturate-[0.2]"
              )}
              style={{ 
                background: orbGradient,
                boxShadow: evolutionTrigger ? `0 0 100px 20px ${palette.glow}` : `0 0 50px ${palette.glow}`,
                filter: getRankBlur(evolution)
              }}
            >
              {/* Animated internal light movement */}
              {rotationSpeed > 0 && (
                <motion.div 
                  animate={{ 
                    background: [
                      `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                      `radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
                      `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                    ]
                  }}
                  transition={{ duration: rotationSpeed, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 pointer-events-none opacity-60" 
                />
              )}

              {/* 3D depth effects */}
              <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.3)] pointer-events-none z-10" />
              <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[3px] -rotate-[35deg] z-10" />

              {/* Evolution Flare — only during power-up */}
              <AnimatePresence>
                {evolutionTrigger && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                      animate={{ opacity: [0, 1, 0.8, 0], scale: [0.5, 2, 2.5, 3], rotate: 360 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                      <div className="w-full h-full bg-gradient-to-tr from-white/80 via-transparent to-white/40 blur-[15px] mix-blend-overlay" />
                    </motion.div>
                    
                    {/* Radial Ascension Rays */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5, 2], rotate: 90 }}
                      transition={{ duration: 1.5 }}
                      className="absolute inset-0 flex items-center justify-center z-20"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={i}
                          className="absolute w-[2px] h-[150%] bg-gradient-to-t from-transparent via-white/40 to-transparent"
                          style={{ transform: `rotate(${i * 30}deg)` }}
                        />
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Heavenly Rank Accessories */}
              {!evolutionTrigger && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {/* S-Rank: Transcendent Shards & Heavenly Wings */}
                  {rankTier === 'S' && (
                    <>
                      {/* Inner Halo */}
                      <div className="absolute -inset-2 border border-white/20 rounded-full blur-[1px] animate-pulse" />
                      
                      {/* Outer Heavenly Glow */}
                      <div className="absolute -inset-10 bg-cyan-400/10 rounded-full blur-[25px] animate-pulse" />
                      
                      {/* Cosmic Particle Field */}
                      <div className="absolute inset-[-40px] pointer-events-none">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <motion.div
                            key={`p-${i}`}
                            animate={{ 
                              x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100],
                              y: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100],
                              opacity: [0, 0.4, 0],
                              scale: [0, 1, 0]
                            }}
                            transition={{ 
                              duration: 4 + Math.random() * 4, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                            style={{ 
                              left: `${Math.random() * 100}%`, 
                              top: `${Math.random() * 100}%` 
                            }}
                          />
                        ))}
                      </div>

                      {/* Left Wing / Aura Fragment */}
                      <motion.div
                        animate={{ 
                          rotate: [-5, 5, -5],
                          opacity: [0.3, 0.6, 0.3],
                          x: [-5, -8, -5]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-transparent to-white/20 blur-[8px] rounded-l-full"
                        style={{ transformOrigin: 'right center' }}
                      />
                      
                      {/* Right Wing / Aura Fragment */}
                      <motion.div
                        animate={{ 
                          rotate: [5, -5, 5],
                          opacity: [0.3, 0.6, 0.3],
                          x: [5, 8, 5]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-l from-transparent to-white/20 blur-[8px] rounded-r-full"
                        style={{ transformOrigin: 'left center' }}
                      />

                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                          key={`s-${i}`}
                          animate={{ 
                            y: [-15, -45, -15],
                            opacity: [0, 0.8, 0],
                            scale: [0.3, 0.8, 0.3],
                            rotate: [0, 360]
                          }}
                          transition={{ 
                            duration: 3 + i, 
                            repeat: Infinity, 
                            delay: i * 0.5 
                          }}
                          className="absolute w-1 h-3 bg-white blur-[0.5px]"
                          style={{ 
                            left: `${15 + i * 10}%`, 
                            top: `${30 + (i % 2) * 20}%`,
                            boxShadow: '0 0 10px white'
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* A-Rank: Ethereal Glyphs */}
                  {rankTier === 'A' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                          key={`a-${i}`}
                          animate={{ 
                            rotate: 360,
                            opacity: [0.2, 0.5, 0.2]
                          }}
                          transition={{ 
                            duration: 20 + i * 5, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                          className="absolute text-[6px] font-black text-white/40"
                          style={{ 
                            transform: `rotate(${i * 60}deg) translateY(-45px)` 
                          }}
                        >
                          ⊹
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* B-Rank: Orbital Rings */}
                  {(rankTier === 'B' || rankTier === 'A' || rankTier === 'S') && (
                    <div 
                      className="absolute -inset-1 border border-white/10 rounded-full border-dashed animate-spin-slow-15"
                    />
                  )}
                </div>
              )}
              
              {/* Peaked state — inner ring */}
              {orbState === 'peaked' && (
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-[60%] h-[60%] rounded-full border-[1.5px] border-white/30" />
                  </div>
               )}

               {/* Depleted state — crack overlay */}
               {orbState === 'depleted' && (
                 <div className="absolute inset-0 pointer-events-none opacity-40">
                   <div className="absolute top-[30%] left-[20%] w-[60%] h-[1px] bg-black/60 rotate-[25deg]" />
                   <div className="absolute top-[50%] left-[30%] w-[40%] h-[1px] bg-black/40 -rotate-[15deg]" />
                 </div>
               )}

               {/* Notification indicator — uses user's accent color */}
               {notifications.length > 0 && (
                 <div className="absolute top-4 right-4 w-3 h-3 rounded-full border-2 z-20"
                   style={{ background: palette.accent, borderColor: palette.primary, boxShadow: `0 0 10px ${palette.glow}` }}
                 />
               )}
            </motion.div>

            <AnimatePresence>
              {(orbState === 'peaked' || evolutionTrigger) && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ 
                    scale: evolutionTrigger ? [1, 2.5, 3] : [1, 1.8], 
                    opacity: 0,
                    borderWidth: evolutionTrigger ? ["1px", "5px", "0px"] : "1px"
                  }}
                  transition={{ 
                    duration: evolutionTrigger ? 1.5 : 2, 
                    repeat: evolutionTrigger ? 0 : Infinity, 
                    ease: "easeOut" 
                  }}
                  className="absolute w-[72px] h-[72px] rounded-full border pointer-events-none"
                  style={{ borderColor: palette.accent }}
                />
              )}
            </AnimatePresence>

            {/* Level Up Announcement */}
            <AnimatePresence>
              {evolutionTrigger && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: -160 }}
                  exit={{ opacity: 0, scale: 1.5, y: -200 }}
                  className="absolute flex flex-col items-center whitespace-nowrap z-[150]"
                >
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[14px] font-black italic text-white tracking-[0.5em] drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                  >
                    {evolutionTrigger === 'rank' ? 'RANK EVOLUTION' : 'LEVEL EVOLVED'}
                  </motion.span>
                  <div className="flex items-center gap-2 mt-2">
                     <span className="text-[10px] font-bold text-cyan-400 tracking-widest">{evolutionTrigger === 'rank' ? rank : `LEVEL ${xp.level}`}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ═══════════════════════════════════════════════ */}
      {/* DUEL REQUEST BUBBLE                             */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showBubble && latestDuelNotif && !isNavOpen && !isOrbHidden && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%', scale: 0.96 }}
            animate={{ opacity: 1, y: -110, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -130, x: '-50%', scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ willChange: 'transform' }}
            className="fixed bottom-0 left-1/2 z-[140] w-[calc(100vw-32px)] max-w-[360px] cursor-pointer"
            onClick={() => setIsNavOpen(true)}
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/95 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  latestDuelNotif.type === 'friend'
                    ? "bg-emerald-400/15 text-emerald-300"
                    : latestDuelNotif.type === 'duel_cancelled'
                    ? "bg-red-400/15 text-red-300"
                    : "bg-cyan-400/15 text-cyan-300"
                )}>
                  {latestDuelNotif.type === 'friend' ? (
                    <UserPlus size={16} />
                  ) : (
                    <Swords size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] font-black uppercase tracking-[0.22em] text-white/35">
                    {latestDuelNotif.type === 'friend'
                      ? 'Friend Request'
                      : latestDuelNotif.type === 'duel_cancelled'
                      ? 'Missed Challenge'
                      : latestDuelNotif.type === 'duel_ready'
                      ? 'Duel Accepted'
                      : 'Duel Invite'}
                  </div>
                  <div className="mt-1 truncate text-[12px] font-black uppercase italic tracking-tight text-white">
                    {latestDuelNotif.type === 'friend'
                      ? `${latestDuelNotif.sender} wants to connect`
                      : latestDuelNotif.type === 'duel_cancelled'
                      ? `${latestDuelNotif.sender} withdrew challenge`
                      : latestDuelNotif.type === 'duel_ready'
                      ? `${latestDuelNotif.sender} accepted your duel`
                      : `${latestDuelNotif.sender} is waiting for you`}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                  Open
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRankUpCinematic && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)'
            }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto bg-black/40"
          >
            {/* Hyperspace Background */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 2, 4], opacity: [0, 1, 0] }}
              transition={{ duration: 4, ease: "easeOut" }}
              className="absolute inset-0 bg-transparent overflow-hidden"
            >
              {/* Heavenly Beams */}
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={`beam-${i}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: [0, 0.4, 0],
                    scale: [0.5, 2],
                    rotate: i * 30 
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute left-1/2 top-1/2 w-[2px] h-[1000px] bg-gradient-to-t from-transparent via-cyan-400 to-transparent origin-bottom"
                  style={{ transform: `translateX(-50%) translateY(-100%) rotate(${i * 30}deg)` }}
                />
              ))}

              {Array.from({ length: 200 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: (Math.random() - 0.5) * window.innerWidth * 0.1,
                    y: (Math.random() - 0.5) * window.innerHeight * 0.1,
                    scale: 0.1,
                    opacity: 0
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * window.innerWidth * 2,
                    y: (Math.random() - 0.5) * window.innerHeight * 2,
                    scale: Math.random() * 2 + 1,
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    delay: Math.random() * 1.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                  className="absolute w-[2px] h-[100px] rounded-full bg-white blur-[1px]"
                  style={{ 
                    transform: `rotate(${Math.atan2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)}rad)`,
                    background: `linear-gradient(to top, transparent, ${palette.accent}, white)`
                  }}
                />
              ))}
            </motion.div>

            {/* Flash Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.2, times: [0, 0.1, 0.3, 1] }}
              className="absolute inset-0 bg-white z-[210] mix-blend-overlay"
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.8, times: [0, 0.2, 1] }}
              className="absolute inset-0 bg-cyan-400 z-[211]"
            />

            {/* Central Content */}
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              transition={{ delay: 0.5, duration: 1, type: "spring" }}
              className="relative z-[220] flex flex-col items-center"
            >
              <motion.div
                animate={{ 
                  filter: ["drop-shadow(0 0 20px cyan)", "drop-shadow(0 0 60px cyan)", "drop-shadow(0 0 20px cyan)"],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 rounded-full border-4 border-white/20 flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl relative mb-12 shadow-[0_0_100px_rgba(255,255,255,0.3)]"
              >
                <div 
                  className="w-full h-full rounded-full" 
                  style={{ background: orbGradient, boxShadow: `0 0 120px 20px ${palette.glow}` }}
                />
                
                {/* Orbital Rings */}
                <div 
                  className="absolute -inset-12 border border-white/5 rounded-full animate-spin-slow-10"
                />
                <div 
                  className="absolute -inset-8 border border-white/10 rounded-full [animation-direction:reverse] animate-spin-slow-15"
                />
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="text-center"
              >
                <h2 className="text-[12px] font-black text-cyan-400 tracking-[1em] uppercase mb-4 opacity-70">Evolution Complete</h2>
                <div className="flex flex-col items-center">
                  <span className="text-[64px] font-black italic text-white leading-none tracking-tighter mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                    RANK {rankTier}
                  </span>
                  <div className="h-1 w-32 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-4" />
                  <span className="text-[18px] font-bold text-cyan-300 tracking-[0.3em] uppercase">{rank}</span>
                </div>
              </motion.div>

              {/* Close Countdown */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
                className="mt-20 flex flex-col items-center gap-3"
              >
                <button 
                  onClick={() => setShowRankUpCinematic(false)}
                  className="pointer-events-auto px-10 py-4 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  Continuue Evolution
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
