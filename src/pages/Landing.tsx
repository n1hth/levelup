import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { 
  Zap, Brain, Target, Flame, Users, BookOpen, Clock, Home, Swords, Check
} from 'lucide-react';

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState(2); // Default to Home (index 2)
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor scroll progress
  const { scrollYProgress } = useScroll();

  // 1. Orb Y-coordinate layout transform:
  // - Phase 0 (Start): Center-left of viewport.
  // - Phase 1-5 (Features): Moves to bottom-center of viewport and stays anchored.
  // - Phase 6 (Pricing): Moves back to absolute center.
  const orbY = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["10vh", "32vh", "32vh", "0vh"]
  );

  // 2. Orb Dimensions morphs:
  // - Starts as a gorgeous 220px glowing sphere.
  // - Shrinks to a 110px interactive bottom core.
  // - Morphs into a wide 450px x 380px premium pricing card block.
  const orbWidth = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["220px", "110px", "110px", "440px"]
  );

  const orbHeight = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["220px", "110px", "110px", "390px"]
  );

  const orbBorderRadius = useTransform(
    scrollYProgress,
    [0, 0.8, 0.85],
    ["9999px", "9999px", "24px"]
  );

  // Nav Arc opacity & scale transforms (open nav animation on scroll)
  const navScale = useTransform(scrollYProgress, [0.08, 0.16], [0.85, 1.05]);
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

  // Navigation Items coordinates for clean semicircular arc:
  // - Radius: 120px. Centered above the bottom-anchored Orb.
  const navItems = [
    { id: 0, label: "DECKS", icon: BookOpen, x: -105, y: -60 },
    { id: 1, label: "FOCUS", icon: Clock, x: -60, y: -105 },
    { id: 2, label: "HOME", icon: Home, x: 0, y: -120 },
    { id: 3, label: "BATTLE", icon: Swords, x: 60, y: -105 },
    { id: 4, label: "SOCIAL", icon: Users, x: 105, y: -60 }
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
    <div ref={containerRef} className="min-h-screen bg-[#020204] text-white relative font-sans select-none scroll-smooth">
      {/* 1. Cyber scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-20" />

      {/* 2. Dotted hex grid backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10" style={{ 
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* 3. Ambient atmospheric lighting bloom */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[750px] h-[750px] bg-indigo-500/5 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '1.2s' }} />
      </div>

      {/* 4. THE SOUL — MORPHING CENTRAL FOCUS ORB & PRICING CONTAINER */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-30">
        <motion.div
          style={{
            y: orbY,
            width: orbWidth,
            height: orbHeight,
            borderRadius: orbBorderRadius
          }}
          className="relative flex flex-col items-center justify-center border border-cyan-400/30 shadow-[0_0_80px_rgba(6,182,212,0.4),inset_0_0_30px_rgba(255,255,255,0.15)] bg-gradient-to-tr from-cyan-950/70 via-[#0a0b12]/90 to-purple-950/60 pointer-events-auto overflow-hidden"
        >
          {/* Main animated Core (Only visible before morphing into Pricing Container) */}
          {activeTab < 5 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Inner glowing pulsing orb */}
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
                className="w-[90%] h-[90%] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-600 to-purple-600 opacity-80 mix-blend-screen shadow-[inset_0_0_30px_rgba(255,255,255,0.4)]"
              />
              <div className="absolute w-[80%] h-[80%] rounded-full bg-pink-500/10 blur-sm mix-blend-color-dodge animate-pulse" />
            </div>
          )}

          {/* Pricing Details Panel (Visible ONLY in final scroll phase) */}
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

                  {/* Pricing metrics */}
                  <div className="py-2">
                    <span className="text-5xl font-black italic tracking-tighter text-cyan-300">$10</span>
                    <span className="text-[10px] font-black tracking-widest text-white/50 uppercase ml-2">ONE-TIME LICENSE</span>
                  </div>

                  <p className="text-[11px] text-white/60 uppercase tracking-wider leading-relaxed max-w-sm mx-auto">
                    Permanent access to the complete spaced repetition engines, matchmaking combat duels, deep restriction matrices, and direct syndicates.
                  </p>
                </div>

                <div className="space-y-4 w-full">
                  {/* Glowing Activation button */}
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

      {/* 5. STATIC FIXED BOTTOM NAVIGATION DOCK (Expanded container boundaries to avoid clipping) */}
      <div className="fixed bottom-0 left-0 w-full h-[220px] flex justify-center z-20 pointer-events-none">
        <motion.div
          style={{
            scale: navScale,
            opacity: navOpacity
          }}
          className="relative w-[340px] h-[220px] flex justify-center pointer-events-auto"
        >
          {/* Semicircular tracking path matching the screenshot exactly */}
          <svg className="absolute top-10 w-[300px] h-[150px] overflow-visible pointer-events-none" viewBox="0 0 300 150">
            <path 
              d="M 30,120 A 120,120 0 0,1 270,120" 
              fill="none" 
              stroke="rgba(255,255,255,0.06)" 
              strokeWidth="2"
            />
          </svg>

          {/* Active curved cyan indicator line (directly above the Orb top boundary) */}
          <div className="absolute top-[48px] w-[114px] h-[114px] rounded-full pointer-events-none">
            {/* Semicircular highlight curve exactly matching Home selection style */}
            <motion.div 
              animate={{ rotate: activeTab === 0 ? -60 : activeTab === 1 ? -30 : activeTab === 2 ? 0 : activeTab === 3 ? 30 : 60 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="absolute -inset-[2px] rounded-full border border-transparent border-t-cyan-400 border-t-4"
            />
          </div>

          {/* Semicircular Nav Icons Placement (With adjusted padding to guarantee zero window edge clipping) */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  // Direct jump simulation if they click
                  const scrollTarget = window.innerHeight * (0.16 + item.id * 0.13);
                  window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
                }}
                style={{
                  transform: `translate(${item.x}px, ${item.y + 42}px)`
                }}
                className="absolute w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all duration-300"
              >
                <Icon 
                  size={18} 
                  className={`transition-colors duration-300 ${isActive ? "text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]" : "text-white/40 hover:text-white/70"}`} 
                />
                
                {/* Active Cyan Bold Label directly under active icon */}
                {isActive && (
                  <motion.span 
                    layoutId="activeNavLabel"
                    className="absolute top-10 text-[9px] font-black tracking-[0.2em] text-cyan-400 text-center"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* 6. SYSTEM SECTIONS LAYOUT */}
      <div className="relative z-10">

        {/* HERO SECTION: WELCOME MESSAGE AND GIANT ORB FLOATING (Clean Spaced Layout - ZERO Overlaps) */}
        <section className="h-screen w-screen flex flex-col justify-between items-center px-6 py-20 relative">
          
          {/* Title Signature */}
          <div className="text-center space-y-2 z-10 mt-6">
            <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/30">
              LEVELUP
            </h1>
            <p className="text-[9px] font-black tracking-[0.5em] text-cyan-400/60 uppercase">NEURAL STUDY OPERATING SYSTEM</p>
          </div>

          {/* Spacer to push Orb down */}
          <div className="flex-1" />

          {/* Welcoming Talk Bubble - Spacer adjusted to sit cleanly at the top of the Orb without colliding */}
          <div className="w-full max-w-sm px-6 py-5 rounded-2xl border border-cyan-400/40 bg-[#08090f]/90 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.2)] text-center relative z-20 mb-8">
            {/* Talk bubble down-arrow indicator */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 border-r border-b border-cyan-400/40 bg-[#08090f] rotate-45" />
            
            <h2 className="text-[9px] font-black tracking-[0.4em] text-cyan-400 uppercase mb-2">NEURAL CORRELATION INCOMING</h2>
            <p className="text-xs md:text-sm font-black tracking-wide text-white uppercase italic leading-relaxed">
              "Greetings, Hunter. Welcome to the Neural Core. Ready to convert studying into an obsession?"
            </p>
          </div>

          {/* Scroll to Handshake prompt */}
          <div className="flex flex-col items-center gap-2 text-white/20 z-10">
            <span className="text-[8px] font-black tracking-[0.4em]">SCROLL TO INITIALIZE</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </section>

        {/* EMITTING SCROLL SECTIONS (Clean spacing between Top Feature Card and Bottom Nav Bar) */}
        {featurePages.map((feature) => (
          <section 
            key={feature.id} 
            className="h-screen w-screen flex flex-col justify-start items-center px-6 pt-28 relative"
          >
            {/* Animate feature card in the top half of the screen (Guarantees zero overlapping with bottom nav Orb) */}
            <AnimatePresence>
              {activeTab === feature.id && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full max-w-md p-6 md:p-8 rounded-3xl border border-white/5 bg-[#08090e]/95 shadow-[0_0_50px_rgba(0,0,0,0.7)] backdrop-blur-xl text-center space-y-4 relative overflow-hidden"
                >
                  {/* Subtle top indicator curve inside card */}
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
