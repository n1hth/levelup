import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { 
  Zap, Brain, Target, Flame, Users, BookOpen, Clock, Home, Swords, 
  ChevronDown
} from 'lucide-react';

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState(2); // Default to Home (index 2)
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger welcome message bubble after exactly 1 second on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeBubble(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Monitor scroll progress
  const { scrollYProgress } = useScroll();

  // 1. Orb Y-coordinate layout transform:
  // - Phase 0 (Start): Centered.
  // - Phase 1-5 (Features): Moves to bottom-center of viewport and stays anchored.
  // - Phase 6 (Pricing): Moves back to center.
  const orbY = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["10vh", "34vh", "34vh", "0vh"]
  );

  // 2. Orb Dimensions morphs:
  // - Starts as a gorgeous 200px glowing sphere.
  // - Shrinks to a 80px interactive bottom core.
  // - Morphs into a wide 440px x 380px premium pricing card block.
  const orbWidth = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["200px", "80px", "80px", "440px"]
  );

  const orbHeight = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["200px", "80px", "80px", "390px"]
  );

  const orbBorderRadius = useTransform(
    scrollYProgress,
    [0, 0.8, 0.85],
    ["9999px", "9999px", "24px"]
  );

  // Nav Arc opacity & scale transforms (open nav animation on scroll)
  const navScale = useTransform(scrollYProgress, [0.08, 0.16], [0.85, 1]);
  const navOpacity = useTransform(scrollYProgress, [0.08, 0.15, 0.8, 0.83], [0, 1, 1, 0]);

  // Update active tab based on scroll progress threshold
  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      if (latest < 0.12) {
        setActiveTab(2); // Welcome / Home state
      } else if (latest >= 0.12 && latest < 0.25) {
        setActiveTab(0); // Decks
      } else if (latest >= 0.25 && latest < 0.38) {
        setActiveTab(1); // Focus
      } else if (latest >= 0.38 && latest < 0.51) {
        setActiveTab(2); // Home / XP System
      } else if (latest >= 0.51 && latest < 0.64) {
        setActiveTab(3); // Duels
      } else if (latest >= 0.64 && latest < 0.80) {
        setActiveTab(4); // Social
      } else {
        setActiveTab(5); // Pricing Container
      }
    });
  }, [scrollYProgress]);

  // ═══════════════════════════════════════════════
  // DUPLICATED Orb.tsx MATHEMATICAL ARC GEOMETRY
  // ═══════════════════════════════════════════════
  const ARC_RADIUS = 90;
  
  // Navigation segments matched to exact angular mappings from the real Orb component
  const navItems = [
    { id: 0, label: "DECKS", icon: <BookOpen size={20} />, angle: 200 },
    { id: 1, label: "FOCUS", icon: <Clock size={20} />, angle: 235 },
    { id: 2, label: "HOME", icon: <Home size={20} />, angle: 270 },
    { id: 3, label: "BATTLE", icon: <Swords size={20} />, angle: 305 },
    { id: 4, label: "SOCIAL", icon: <Users size={20} />, angle: 340 }
  ];

  // Feature content mapping corresponding to each navigation state
  const featurePages = [
    {
      id: 0,
      title: "EVOLUTIONARY DECKS",
      tag: "SMART CARD RETRIEVAL",
      desc: "Build evolutionary spaced repetition decks. Program cards with smart cognitive targets, automatically scheduling recall waves using our verified SM-2 algorithm.",
      color: "text-cyan-400 border-cyan-400/20 bg-cyan-950/15",
      detail: "SM-2 RETENTION ENGINE • 100% STABLE"
    },
    {
      id: 1,
      title: "DEEP FOCUS PULSE",
      tag: "BRAINWAVE STABILIZER",
      desc: "Launch visual focus countdown lobbies. Ambient breathing cycles dim secondary browser noise, backed by adaptive checks that monitor focus logs.",
      color: "text-cyan-400 border-cyan-400/20 bg-cyan-950/15",
      detail: "COGNITIVE RESTRICTION • ACTIVE"
    },
    {
      id: 2,
      title: "XP & PROGRESS SYSTEMS",
      tag: "DOPAMINE FEEDBACK LOOP",
      desc: "Maintain streaks and complete objectives to accumulate raw XP. Ascend through tactical hunter tiers, triggering dynamic auric rank glows.",
      color: "text-cyan-400 border-cyan-400/20 bg-cyan-950/15",
      detail: "S-RANK HIGHLIGHTS • x1.5 BOOST"
    },
    {
      id: 3,
      title: "STUDY ARENA DUELS",
      tag: "PEER MATCHMAKING",
      desc: "Challenge friends or S-rank opponents inside real-time matchmaking channels. Race through flashcard grids to test recall accuracy under pressure.",
      color: "text-cyan-400 border-cyan-400/20 bg-cyan-950/15",
      detail: "MATCHMAKING BRIDGE • STABILIZED"
    },
    {
      id: 4,
      title: "NEURAL SYNDICATES",
      tag: "STUDY GUILD NETWORKS",
      desc: "Assemble multiplayer guilds, coordinate real-time focus lobbies, exchange messages, and track group performance standings on live leaderboards.",
      color: "text-cyan-400 border-cyan-400/20 bg-cyan-950/15",
      detail: "SYNDICATE MESH • CONNECTED"
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-white relative font-sans select-none scroll-smooth">
      {/* Ambient background lighting bloom (Clean dark aesthetic - NO grids, NO scanlines) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[750px] h-[750px] bg-indigo-500/5 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '1.2s' }} />
      </div>

      {/* ═══════════════════════════════════════════════
          UNIFIED NAVIGATION CONTAINER (Identical to Orb.tsx to eliminate visual glitch)
          ═══════════════════════════════════════════════ */}
      <div className="fixed bottom-[40px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        
        {/* Semicircular Nav Arc SVG Open State (Fades in on scroll) */}
        <AnimatePresence>
          {activeTab < 5 && (
            <motion.div
              style={{
                scale: navScale,
                opacity: navOpacity
              }}
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none w-[400px] h-[400px] bottom-[-160px]"
            >
              <svg width="400" height="400" viewBox="0 0 400 400" className="overflow-visible pointer-events-none">
                <g transform="translate(200, 200)">
                  
                  {/* Background Track Arc */}
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.25 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    d={`M ${ARC_RADIUS * Math.cos(185 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(185 * (Math.PI / 180))} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${ARC_RADIUS * Math.cos(355 * (Math.PI / 180))} ${ARC_RADIUS * Math.sin(355 * (Math.PI / 180))}`}
                    fill="none"
                    stroke="oklch(0.76 0.25 220)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeOpacity={0.25}
                  />

                  {/* Individual Nav Buttons and highlight arcs */}
                  {navItems.map((item, i) => {
                    const isActive = activeTab === item.id;
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
                        {isActive && (
                          <motion.path
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
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
                              const scrollTarget = window.innerHeight * (0.16 + item.id * 0.13);
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

        {/* Central Orb / pricing container */}
        <motion.div
          style={{
            y: orbY,
            width: orbWidth,
            height: orbHeight,
            borderRadius: orbBorderRadius
          }}
          className="relative flex flex-col items-center justify-center border border-cyan-400/30 shadow-[0_0_80px_rgba(0,229,255,0.4),inset_0_0_30px_rgba(255,255,255,0.15)] bg-gradient-to-tr from-cyan-950/70 via-[#0a0b12]/90 to-purple-950/60 pointer-events-auto overflow-visible"
        >
          {activeTab < 5 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              
              {/* SPECULAR GLARE Glare lines exactly from Orb.tsx */}
              <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.35)] rounded-full pointer-events-none z-10" />
              <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/50 blur-[3px] -rotate-[35deg] z-10" />

              {/* S-Rank Aura Accessories */}
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-transparent to-cyan-400/20 blur-[8px] rounded-l-full animate-pulse" />
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-l from-transparent to-cyan-400/20 blur-[8px] rounded-r-full animate-pulse" />
              <div className="absolute -inset-2 border border-cyan-400/10 rounded-full blur-[1px] animate-pulse" />

              {/* Glowing gradient color sphere */}
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

          {/* Pricing bento box inside morphing container */}
          <AnimatePresence>
            {activeTab === 5 && (
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

                  {/* Pricing values */}
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

      {/* Welcome Bubble overlay - Placed relative to screen, positioned safely above the Orb to prevent overlap */}
      <AnimatePresence>
        {activeTab === 2 && scrollYProgress.get() < 0.05 && showWelcomeBubble && (
          <div className="fixed inset-x-0 bottom-[320px] md:bottom-[340px] flex justify-center z-40 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xs md:max-w-sm px-6 py-5 rounded-2xl border border-cyan-400/35 bg-[#08090f]/95 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.15)] text-center relative pointer-events-auto"
            >
              {/* Talk bubble down-arrow indicator */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 border-r border-b border-cyan-400/35 bg-[#08090f] rotate-45" />
              
              <h2 className="text-[9px] font-black tracking-[0.4em] text-cyan-400 uppercase mb-2">NEURAL CORRELATION INCOMING</h2>
              <p className="text-xs md:text-sm font-black tracking-wide text-white uppercase italic leading-relaxed">
                "Greetings, Hunter. Welcome to the Neural Core. Ready to convert studying into an obsession?"
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SYSTEM SECTIONS LAYOUT */}
      <div className="relative z-10">

        {/* HERO SECTION: SPACIALLY PERFECT LAYOUT FOR ORB */}
        <section className="h-screen w-screen flex flex-col justify-between items-center px-6 py-20 relative">
          
          {/* Title Signature */}
          <div className="text-center space-y-2 z-10 mt-6">
            <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/30">
              LEVELUP
            </h1>
            <p className="text-[9px] font-black tracking-[0.5em] text-cyan-400/60 uppercase">NEURAL STUDY OPERATING SYSTEM</p>
          </div>

          {/* Spacer to guarantee clear space */}
          <div className="flex-1" />

          {/* Scroll to Handshake prompt */}
          <div className="flex flex-col items-center gap-2 text-white/20 z-10 mb-12">
            <span className="text-[8px] font-black tracking-[0.4em]">SCROLL TO INITIALIZE</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </section>

        {/* EMITTING SCROLL SECTIONS (Card top half, Nav Orb bottom half - absolutely safe) */}
        {featurePages.map((feature) => (
          <section 
            key={feature.id} 
            className="h-screen w-screen flex flex-col justify-start items-center px-6 pt-28 relative"
          >
            <AnimatePresence>
              {activeTab === feature.id && (
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

        {/* PRICING SCROLL SECTION SPACE HOLDER */}
        <section className="h-screen w-screen flex flex-col justify-center items-center px-6 relative">
          <div className="absolute bottom-10 flex flex-col md:flex-row justify-between items-center w-full max-w-7xl px-8 z-20 text-[9px] font-mono text-white/20 tracking-[0.2em] uppercase">
            <span>LEVELUP STUDY INC // CONNECT SIGNALS PROTECTED</span>
            <span>SYSTEM V1.1.0</span>
          </div>
        </section>

      </div>

      {/* SIGNUP/LOGIN OVERLAY MODAL */}
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
