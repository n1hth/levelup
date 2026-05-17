import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/src/lib/store.tsx';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils.ts';
import { type OrbState, getOrbColors, getOrbGradient, getRankEvolution, getRankBlur, getFacetCount, hasParticleField, getInternalRotationSpeed } from '@/src/lib/orb-color';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Layout as Diamond, 
  Circle, 
  Layers, 
  Swords, 
  Share2, 
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



const ARC_RADIUS = 65; 
const ARC_THICKNESS = 4;
const SEGMENTS = [
  { path: '/home', label: 'HOME', icon: <Diamond size={16} />, angle: 210 },
  { path: '/focus', label: 'FOCUS', icon: <Circle size={16} className="stroke-[1.5]" />, angle: 240 },
  { path: '/decks', label: 'DECKS', icon: <Layers size={16} />, angle: 270 },
  { path: '/battle', label: 'ARENA', icon: <Swords size={16} />, angle: 300 },
  { path: '/social', label: 'SOCIAL', icon: <Share2 size={16} />, angle: 330 },
];

export interface OrbProps {
  onInteractionChange?: (state: 'none' | 'holding' | 'insight' | 'nav-open') => void;
}

export function Orb({ onInteractionChange }: OrbProps) {
  const { state, getTodayFocusTime, getXpProgress, getRank, getOrbHue, isOrbHidden, getNotifications, acceptFriendRequest, acceptDuelInvite, dismissNotification, clearNotifications } = useApp();
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

  // Lock background scroll when nav is open
  useEffect(() => {
    if (isNavOpen || isInsightOpen || isHolding) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isNavOpen, isInsightOpen, isHolding]);

  const fetchNotifications = async () => {
    const data = await getNotifications();
    const prevNotifs = notificationsRef.current;
    
    // Check for new notifications by ID
    const newItems = data.filter(n => !prevNotifs.find(pn => pn.id === n.id));
    
    if (newItems.length > 0) {
      // Bright pulse on any new notification
      setShowPulseWave(true);
      setTimeout(() => setShowPulseWave(false), 1500);

      // Check specifically for duel events to show bubble
      const newDuel = newItems.find(n => n.type === 'duel' || n.type === 'duel_cancelled');
      if (newDuel) {
        setLatestDuelNotif(newDuel);
        setShowBubble(true);
        setTimeout(() => setShowBubble(false), 8000);
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

  // Dynamic orb identity
  const orbHue = getOrbHue();
  const palette = useMemo(() => getOrbColors(orbHue, orbState), [orbHue, orbState]);
  const evolution = useMemo(() => getRankEvolution(rankTier), [rankTier]);
  const orbGradient = useMemo(() => getOrbGradient(orbHue, orbState, rankTier), [orbHue, orbState, rankTier]);
  const facetCount = useMemo(() => getFacetCount(evolution), [evolution]);
  const rotationSpeed = useMemo(() => getInternalRotationSpeed(evolution), [evolution]);

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
    navOpen: { scale: 1 },
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
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
    },
    peaked: {
       scale: [1, 1.08, 1],
       transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
    },
    tapping: {
      scale: 1,
      transition: { 
        duration: 0.15,
        ease: "easeOut" as const
      }
    },
    depleted: { scale: 1 },
    evolving: {}
  };

  const glowVariants = {
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
        {isNavOpen && (
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
                  {notifications.filter(n => n.type !== 'duel_cancelled').length > 0 ? (
                    notifications.filter(n => n.type !== 'duel_cancelled').map(notif => (
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
                              {notif.type === 'friend' ? 'Syndicate Link Request' : (notif.message || 'Duel Challenge Issued')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {notif.type === 'duel_cancelled' ? (
                            <button
                              onClick={() => handleAction(notif, 'decline')}
                              className="flex-1 py-2 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                              Acknowledge
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
        {(isHolding || isInsightOpen || isNavOpen) && (
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
        {showPulseWave && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.4, 1.8, 3.5], 
              opacity: [0, 0.4, 0.4, 0] 
            }}
            transition={{ 
              duration: 2.2, 
              times: [0, 0.15, 0.6, 1],
              ease: "linear"
            }}
            className="fixed bottom-[40px] left-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full z-[85] pointer-events-none blur-[90px]"
            style={{ 
              background: `radial-gradient(circle, ${palette.glow} 0%, transparent 75%)`,
              willChange: 'transform, opacity'
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOrbHidden && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
            className="fixed bottom-[40px] left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none"
          >
            <AnimatePresence>
              {isNavOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute pointer-events-none w-[400px] h-[400px] bottom-[-160px]"
                  >
                    <svg width="400" height="400" viewBox="0 0 400 400" className="overflow-visible">
                      <g transform="translate(200, 200)">
                        {/* Global Background Track */}
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.25 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          d={`M ${ARC_RADIUS * Math.cos(200 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(200 * (Math.PI / 180))} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${ARC_RADIUS * Math.cos(340 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(340 * (Math.PI / 180))}`}
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

                          const iconX = (ARC_RADIUS + 30) * Math.cos(angleRad);
                          const iconY = (ARC_RADIUS + 30) * Math.sin(angleRad);

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
                                x={iconX - 35} 
                                y={iconY - 35} 
                                width="70" 
                                height="70"
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
              animate={isTapping ? "tapping" : orbState}
              variants={glowVariants}
              className="absolute inset-0 blur-[20px] rounded-full -z-10"
              style={{ background: palette.primary, willChange: 'transform, opacity' }}
            />

            <motion.div
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={handleTap}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              animate={isNavOpen ? "navOpen" : (isTapping ? "tapping" : orbState)}
              variants={orbVariants}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1]
              }}
              className={cn(
                "w-[80px] h-[80px] rounded-full relative overflow-hidden cursor-pointer pointer-events-auto will-change-transform",
                orbState === 'dormant' && "brightness-[0.7] saturate-[0.5]",
                orbState === 'depleted' && "brightness-[0.4] saturate-[0.2]"
              )}
              style={{ 
                background: orbGradient,
                boxShadow: `0 0 50px ${palette.glow}`,
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
              <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.3)] pointer-events-none" />
              <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[3px] -rotate-[35deg]" />
              
              {/* Crystalline facet lines — appear at B rank and above */}
              {facetCount > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: facetCount }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 120 + i * 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ transform: `rotate(${(360 / facetCount) * i}deg)` }}
                    >
                      <div className="w-[110%] h-[1px] bg-white/15" />
                    </motion.div>
                  ))}
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
              {orbState === 'peaked' && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute w-[72px] h-[72px] rounded-full border pointer-events-none"
                  style={{ borderColor: palette.accent }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ═══════════════════════════════════════════════ */}
      {/* DUEL REQUEST BUBBLE                             */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showBubble && latestDuelNotif && !isNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: -110, x: -50, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, y: -130 }}
            className="fixed bottom-0 left-1/2 z-[100] cursor-pointer"
            onClick={() => setIsNavOpen(true)}
          >
            <div className="bg-cyan-500/10 border border-cyan-400/30 backdrop-blur-3xl rounded-2xl px-5 py-3 flex items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.2)] group">
               <div className="w-8 h-8 rounded-xl bg-cyan-400/20 flex items-center justify-center shrink-0">
                  <Swords size={16} className="text-cyan-400" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">
                    {latestDuelNotif.type === 'duel_cancelled' ? 'Missed Challenge' : 'Incoming Challenge'}
                  </span>
                  <span className="text-[11px] font-black text-white uppercase italic tracking-tight">
                    {latestDuelNotif.type === 'duel_cancelled'
                      ? `${latestDuelNotif.sender} tried to duel`
                      : `${latestDuelNotif.sender} issued a duel`}
                  </span>
               </div>
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-900/20 border-r border-b border-cyan-400/30 rotate-45 backdrop-blur-3xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
