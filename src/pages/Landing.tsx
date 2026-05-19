import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { 
  Zap, Brain, Target, Flame, Users, BookOpen, Clock, Home, Swords, 
  ChevronDown
} from 'lucide-react';

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const [windowHeight, setWindowHeight] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure window height for bulletproof dynamic vertical calculations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Welcome message bubble pops up from the Orb after exactly 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeBubble(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Track scroll snapping to 7 distinct folds (Welcome + 5 features + Pricing)
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const height = windowHeight || window.innerHeight;
      const index = Math.min(Math.max(Math.round(scrollPos / height), 0), 6);
      setActiveSection(index);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to establish state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [windowHeight]);

  // Semicircular SVG Nav Arc constants (Direct duplication of native app geometry)
  const ARC_RADIUS = 90;
  const navItems = [
    { id: 0, label: "DECKS", icon: <BookOpen size={20} />, angle: 200 },
    { id: 1, label: "FOCUS", icon: <Clock size={20} />, angle: 235 },
    { id: 2, label: "HOME", icon: <Home size={20} />, angle: 270 },
    { id: 3, label: "BATTLE", icon: <Swords size={20} />, angle: 305 },
    { id: 4, label: "SOCIAL", icon: <Users size={20} />, angle: 340 }
  ];

  // Dynamic Layout dimensions based on scroll state
  const isStartFold = activeSection === 0;
  const isEndFold = activeSection === 6;

  // Orb dimensions morphing:
  // - Starts at 200px at fold 0.
  // - Shrinks to 80px static bottom core at folds 1-5.
  // - Morphs to 440px width and 390px height pricing card at fold 6.
  const orbWidth = isStartFold ? 200 : isEndFold ? 440 : 80;
  const orbHeight = isStartFold ? 200 : isEndFold ? 390 : 80;
  const orbBorderRadius = isEndFold ? 24 : 9999;

  // Absolute viewport center to bottom navigation center translation:
  // - Center is at y = 0.
  // - Bottom nav placement is at yOffset = half viewport height - bottom margin (40px) - orb radius (40px)
  const yOffset = isStartFold ? 0 : isEndFold ? 0 : (windowHeight / 2) - 80;

  // Feature content mapping corresponding to folds 1-5
  const featurePages = [
    {
      id: 0,
      title: "EVOLUTIONARY DECKS",
      tag: "SMART CARD RETRIEVAL",
      desc: "Build evolutionary spaced repetition decks. Program cards with smart cognitive targets, automatically scheduling recall waves using our verified SM-2 algorithm.",
      detail: "SM-2 RETENTION ENGINE • 100% STABLE"
    },
    {
      id: 1,
      title: "DEEP FOCUS PULSE",
      tag: "BRAINWAVE STABILIZER",
      desc: "Launch visual focus countdown lobbies. Ambient breathing cycles dim secondary browser noise, backed by adaptive checks that monitor focus logs.",
      detail: "COGNITIVE RESTRICTION • ACTIVE"
    },
    {
      id: 2,
      title: "XP & PROGRESS SYSTEMS",
      tag: "DOPAMINE FEEDBACK LOOP",
      desc: "Maintain streaks and complete objectives to accumulate raw XP. Ascend through tactical hunter tiers, triggering dynamic auric rank glows.",
      detail: "S-RANK HIGHLIGHTS • x1.5 BOOST"
    },
    {
      id: 3,
      title: "STUDY ARENA DUELS",
      tag: "PEER MATCHMAKING",
      desc: "Challenge friends or S-rank opponents inside real-time matchmaking channels. Race through flashcard grids to test recall accuracy under pressure.",
      detail: "MATCHMAKING BRIDGE • STABILIZED"
    },
    {
      id: 4,
      title: "NEURAL SYNDICATES",
      tag: "STUDY GUILD NETWORKS",
      desc: "Assemble multiplayer guilds, coordinate real-time focus lobbies, exchange messages, and track group performance standings on live leaderboards.",
      detail: "SYNDICATE MESH • CONNECTED"
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020205] text-white relative font-sans select-none scroll-smooth overflow-x-hidden">
      
      {/* 1. Deep atmospheric background glow (NO grid lines, NO scanlines) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[750px] h-[750px] bg-indigo-500/5 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '1.2s' }} />
      </div>

      {/* 2. THE SOUL — THE FLOATING ORB & DOCK SYSTEM (Perfect unified container - NO glitches) */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-30">
        <div className="relative flex flex-col items-center justify-center w-full h-full pointer-events-none">
          
          {/* Welcome Talk Bubble (Pops up from Orb after 1 second, positioned safely above it to prevent overlaps) */}
          <AnimatePresence>
            {isStartFold && showWelcomeBubble && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                className="absolute bottom-[calc(50%+130px)] w-full max-w-xs md:max-w-sm px-6 py-5 rounded-2xl border border-cyan-400/30 bg-[#08090f]/95 backdrop-blur-md shadow-[0_0_40px_rgba(0,229,255,0.15)] text-center pointer-events-auto"
              >
                {/* Downward pointing talkbubble indicator */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 border-r border-b border-cyan-400/30 bg-[#08090f] rotate-45" />
                
                <h2 className="text-[9px] font-black tracking-[0.4em] text-cyan-400 uppercase mb-2">NEURAL CONNECTION SECURED</h2>
                <p className="text-xs md:text-sm font-black tracking-wide text-white uppercase italic leading-relaxed">
                  "Greetings, Hunter. Welcome to the Neural Core. Ready to convert studying into an obsession?"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Semicircular Nav Arc SVG Layer (Only visible in folds 1-5, shares the absolute center context with the Orb) */}
          <AnimatePresence>
            {!isStartFold && !isEndFold && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.3 }}
                className="absolute w-[400px] h-[400px] bottom-[28px] pointer-events-none"
              >
                <svg width="400" height="400" viewBox="0 0 400 400" className="overflow-visible pointer-events-none">
                  <g transform="translate(200, 200)">
                    
                    {/* Semicircular Track path from Orb.tsx */}
                    <path
                      d={`M ${ARC_RADIUS * Math.cos(185 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(185 * (Math.PI / 180))} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${ARC_RADIUS * Math.cos(355 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(355 * (Math.PI / 180))}`}
                      fill="none"
                      stroke="oklch(0.76 0.25 220)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeOpacity={0.2}
                    />

                    {/* Semicircular Angled items mapping */}
                    {navItems.map((item) => {
                      const isActive = (activeSection - 1) === item.id;
                      const angleRad = item.angle * (Math.PI / 180);
                      
                      const startAngle = (item.angle - 11) * (Math.PI / 180);
                      const endAngle = (item.angle + 11) * (Math.PI / 180);
                      const x1 = ARC_RADIUS * Math.cos(startAngle);
                      const y1 = ARC_RADIUS * Math.sin(startAngle);
                      const x2 = ARC_RADIUS * Math.cos(endAngle);
                      const y2 = ARC_RADIUS * Math.sin(endAngle);

                      const iconX = (ARC_RADIUS + 38) * Math.cos(angleRad);
                      const iconY = (ARC_RADIUS + 38) * Math.sin(angleRad);

                      return (
                        <g key={item.id}>
                          {/* Active segment arc track overlay */}
                          {isActive && (
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              d={`M ${x1} ${y1} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${x2} ${y2}`}
                              fill="none"
                              stroke="oklch(0.76 0.25 220)"
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
                            <button
                              onClick={() => {
                                const scrollTarget = windowHeight * (1 + item.id);
                                window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
                              }}
                              className="w-full h-full flex flex-col items-center justify-center text-center outline-none pointer-events-auto"
                            >
                              <div className={`transition-transform duration-300 ${isActive ? "text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" : "text-[#3d526b] hover:text-[#4d6682]"}`}>
                                {item.icon}
                              </div>
                              
                              {isActive && (
                                <motion.span 
                                  initial={{ opacity: 0, y: 2 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-[9px] font-black tracking-[0.15em] uppercase text-cyan-400 mt-1.5 leading-none"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </button>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Morphing Central focus Orb / Pricing card block */}
          <motion.div
            animate={{
              y: yOffset,
              width: orbWidth,
              height: orbHeight,
              borderRadius: orbBorderRadius
            }}
            transition={{
              type: "spring",
              damping: 26,
              stiffness: 110
            }}
            className="relative flex flex-col items-center justify-center border border-cyan-400/30 shadow-[0_0_80px_rgba(0,229,255,0.4),inset_0_0_30px_rgba(255,255,255,0.15)] bg-gradient-to-tr from-cyan-950/70 via-[#0a0b12]/95 to-purple-950/60 pointer-events-auto overflow-visible"
          >
            {/* The animated 3D sphere layers (only visible when not morphed to Pricing Card) */}
            {!isEndFold && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full overflow-hidden">
                {/* 3D Specular glares from Orb.tsx */}
                <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.35)] rounded-full pointer-events-none z-10" />
                <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/50 blur-[3px] -rotate-[35deg] z-10" />

                {/* S-Rank Aura Accessories */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-transparent to-cyan-400/20 blur-[8px] rounded-l-full animate-pulse" />
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-l from-transparent to-cyan-400/20 blur-[8px] rounded-r-full animate-pulse" />

                {/* Inner glowing pulsing sphere */}
                <motion.div 
                  animate={{
                    scale: [1, 1.04, 0.96, 1.04, 1],
                    rotate: 360
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-[90%] h-[90%] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-600 to-purple-600 opacity-85 mix-blend-screen shadow-[inset_0_0_30px_rgba(255,255,255,0.4)]"
                />
              </div>
            )}

            {/* Pricing Details Panel inside morphed Container card */}
            <AnimatePresence>
              {isEndFold && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full p-8 flex flex-col justify-between items-center text-center z-10"
                >
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-center gap-2 text-cyan-400">
                      <Zap size={16} className="animate-bounce" />
                      <span className="text-[9px] font-black tracking-[0.4em] uppercase">S-RANK LICENSE ACTIVE</span>
                    </div>
                    
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">
                      AWAKEN ACCESS
                    </h3>
                    
                    <div className="h-px bg-white/10 w-2/3 mx-auto" />

                    {/* Cost values */}
                    <div className="py-2">
                      <span className="text-5xl font-black italic tracking-tighter text-cyan-300">$10</span>
                      <span className="text-[10px] font-black tracking-widest text-white/50 uppercase ml-2">ONE-TIME LICENSE</span>
                    </div>

                    <p className="text-[11px] text-white/60 uppercase tracking-wider leading-relaxed max-w-sm mx-auto">
                      Permanent access to the complete spaced repetition engines, matchmaking combat duels, deep restriction matrices, and direct syndicates.
                    </p>
                  </div>

                  <div className="space-y-4 w-full">
                    <button 
                      onClick={() => setShowAuth(true)}
                      className="w-full py-4 rounded-xl bg-cyan-500 text-black font-black text-xs tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                    >
                      AWAKEN NEURAL SYSTEM
                    </button>
                    <p className="text-[8px] font-mono text-cyan-400/40 tracking-[0.25em]">SECURE PAYMENT BRIDGE ACTIVE</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

        </div>
      </div>

      {/* 3. SCROLL ZONE SECTIONS */}
      <div className="relative z-10">

        {/* Section 0: Welcome fold (Orb starts big in absolute center) */}
        <section className="h-screen w-full flex flex-col justify-between items-center px-6 py-20 relative">
          <div className="text-center space-y-2 z-10 mt-6">
            <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/30">
              LEVELUP
            </h1>
            <p className="text-[9px] font-black tracking-[0.5em] text-cyan-400/60 uppercase">NEURAL STUDY OPERATING SYSTEM</p>
          </div>

          <div className="flex-1" />

          {/* Scroll initialize instruction */}
          <div className="flex flex-col items-center gap-2 text-white/20 z-10 mb-10">
            <span className="text-[8px] font-black tracking-[0.4em]">SCROLL TO INITIALIZE</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </section>

        {/* Sections 1-5: Interactive Feature diagnostic cards */}
        {featurePages.map((feature, idx) => (
          <section 
            key={feature.id} 
            className="h-screen w-full flex flex-col justify-start items-center px-6 pt-32 relative"
          >
            <AnimatePresence>
              {(activeSection - 1) === feature.id && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full max-w-md p-6 md:p-8 rounded-3xl border border-white/5 bg-[#08090e]/95 shadow-[0_0_50px_rgba(0,0,0,0.7)] backdrop-blur-xl text-center space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
                  
                  <div className="space-y-1">
                    <span className="text-[8px] font-black tracking-[0.3em] text-white/40 uppercase">MODULE DIAGNOSTICS</span>
                    <h3 className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase">
                      {feature.title}
                    </h3>
                    <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black tracking-widest text-cyan-400 uppercase">
                      {feature.tag}
                    </div>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
                    {feature.desc}
                  </p>

                  <div className="pt-1">
                    <span className="text-[8px] font-black tracking-widest text-cyan-400 px-3 py-1.5 bg-cyan-950/20 border border-cyan-500/25 rounded-xl uppercase">
                      {feature.detail}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ))}

        {/* Section 6: Pricing Climax Holder */}
        <section className="h-screen w-full flex flex-col justify-center items-center px-6 relative">
          <div className="absolute bottom-10 flex flex-col md:flex-row justify-between items-center w-full max-w-7xl px-8 z-20 text-[9px] font-mono text-white/20 tracking-[0.2em] uppercase">
            <span>LEVELUP STUDY INC // CONNECT SIGNALS PROTECTED</span>
            <span>SYSTEM V1.1.0</span>
          </div>
        </section>

      </div>

      {/* 7. SIGNUP/LOGIN OVERLAY MODAL */}
      <AnimatePresence>
        {showAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-hidden bg-black/95 backdrop-blur-3xl flex items-center justify-center"
          >
            <QuickStart initialPhase={2} onClose={() => setShowAuth(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
