import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
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

export type OrbState = 'dormant' | 'idle' | 'active' | 'peaked' | 'depleted' | 'evolving';

const ARC_RADIUS = 65; 
const ARC_THICKNESS = 4;
const SEGMENTS = [
  { path: '/home', label: 'CORE', icon: <Diamond size={16} />, angle: 210 },
  { path: '/focus', label: 'PULSE', icon: <Circle size={16} className="stroke-[1.5]" />, angle: 240 },
  { path: '/decks', label: 'DECK', icon: <Layers size={16} />, angle: 270 },
  { path: '/battle', label: 'ARENA', icon: <Swords size={16} />, angle: 300 },
  { path: '/social', label: 'NET', icon: <Share2 size={16} />, angle: 330 },
];

export interface OrbProps {
  onInteractionChange?: (state: 'none' | 'holding' | 'insight' | 'nav-open') => void;
}

export function Orb({ onInteractionChange }: OrbProps) {
  const { state, getTodayFocusTime, getXpProgress, getRank, isOrbHidden, getNotifications, acceptFriendRequest, acceptDuelInvite, clearNotifications } = useApp();
  const [orbState, setOrbState] = useState<OrbState>('dormant');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [pulseType, setPulseType] = useState<'open' | 'close'>('open');
  const [showPulseWave, setShowPulseWave] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  
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
    if (data.length > notifications.length) {
      // Bright pulse on new notification
      setShowPulseWave(true);
      setTimeout(() => setShowPulseWave(false), 1500);
    }
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  const handleAction = async (notif: any, action: 'accept' | 'decline') => {
    if (action === 'accept') {
      if (notif.type === 'friend') {
        await acceptFriendRequest(notif.id);
      } else {
        await acceptDuelInvite(notif.id);
        navigate(`/duels/${notif.duel_id}`);
        setIsNavOpen(false);
      }
    }
    fetchNotifications();
  };

  const handleClearAll = async () => {
    await clearNotifications();
    fetchNotifications();
  };

  // Rank-based details
  const rank = getRank();
  const rankTier = rank.split(' ')[0][0]; 
  
  // Focus tracking
  const todayFocusTime = getTodayFocusTime();
  const focusStreak = state.streak;
  const momentum = 1 + state.momentum * 0.1;
  const xp = getXpProgress();

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
      opacity: [null, 1, null],
      transition: {
        duration: 0.45,
        times: [0, 0.33, 1],
        ease: ["easeOut", "easeIn"] as any[]
      }
    }
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
            <div className="absolute -inset-3 bg-cyan-500/10 rounded-[3.5rem] blur-[30px] pointer-events-none" />
            
            {/* Bento Box */}
            <div className="relative bg-[#0a1520]/80 backdrop-blur-3xl border border-cyan-500/25 rounded-[2rem] shadow-[0_0_80px_rgba(0,229,255,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col overflow-hidden">
              {/* Gradient shimmer line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
              
              {/* Header — always pinned */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                    <Bell size={11} className="text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-black text-cyan-400/90 uppercase tracking-[0.25em]">Neural Alerts</span>
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
                            notif.type === 'friend' ? "bg-emerald-500/15 text-emerald-400" : "bg-cyan-500/15 text-cyan-400"
                          )}>
                            {notif.type === 'friend' ? <UserPlus size={15} /> : <Swords size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-black text-white uppercase tracking-tight truncate">{notif.sender}</div>
                            <div className="text-[8px] font-bold text-cyan-400/40 uppercase tracking-[0.15em] mt-0.5">
                              {notif.type === 'friend' ? 'Syndicate Link Request' : 'Duel Challenge Issued'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAction(notif, 'accept')}
                            className="flex-1 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                          >
                            Accept
                          </button>
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
              background: 'radial-gradient(circle, rgba(0,229,255,0.45) 0%, transparent 75%)',
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
                          stroke="#00E5FF"
                          strokeWidth="2"
                          strokeLinecap="round"
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
                                  stroke="#00E5FF"
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                  className="drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
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
                                    isActive ? "text-cyan-400" : "text-[#3d526b] hover:text-[#4d6682]"
                                  )}
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
                        <span className="text-[10px] font-black text-[#3A6070] tracking-[0.2em] mb-1">{item.label}</span>
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
                  <Activity size={24} className="text-cyan-400 opacity-20 mb-4" />
                  <p className="text-white text-lg text-center font-medium leading-relaxed">
                     Neural stability maintained. {xp.nextLevelXp - xp.currentLevelXp} XP until evolution.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              animate={isTapping ? "tapping" : orbState}
              variants={glowVariants}
              className="absolute inset-0 blur-[20px] rounded-full bg-[#00E5FF] -z-10"
              style={{ willChange: 'transform, opacity' }}
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
                "w-[80px] h-[80px] rounded-full relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.4)] cursor-pointer pointer-events-auto will-change-transform",
                "bg-cyan-500", // Fallback
                orbState === 'dormant' && "brightness-[0.9] saturate-[0.9]"
              )}
            >
              {/* Base Vibrant Gradient Layer */}
              <motion.div 
                animate={{ 
                  background: [
                    'radial-gradient(circle at 30% 30%, #ffffff 0%, #a5f3fc 20%, #06b6d4 50%, #0891b2 100%)',
                    'radial-gradient(circle at 70% 30%, #ffffff 0%, #a5f3fc 20%, #0891b2 50%, #06b6d4 100%)',
                    'radial-gradient(circle at 30% 70%, #ffffff 0%, #a5f3fc 20%, #06b6d4 50%, #0891b2 100%)',
                    'radial-gradient(circle at 30% 30%, #ffffff 0%, #a5f3fc 20%, #06b6d4 50%, #0891b2 100%)',
                  ]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none" 
              />
              
              <motion.div 
                animate={{ 
                  background: [
                    'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                    'radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 0%, transparent 60%)',
                    'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                  ]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none opacity-60" 
              />
              <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.3)] pointer-events-none" />
              <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[3px] -rotate-[35deg]" />
              
              {['C', 'B', 'A', 'S'].includes(rankTier) && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                  style={{ willChange: 'transform' }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-[110%] h-[1px] bg-white/15" />
                </motion.div>
              )}
              
              {orbState === 'peaked' && (
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-[60%] h-[60%] rounded-full border-[1.5px] border-white/30" />
                  </div>
               )}

               {notifications.length > 0 && (
                 <div className="absolute top-4 right-4 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.8)] z-20" />
               )}
            </motion.div>

            <AnimatePresence>
              {orbState === 'peaked' && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute w-[72px] h-[72px] rounded-full border border-white/30 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
