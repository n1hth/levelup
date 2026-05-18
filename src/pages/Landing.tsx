import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { 
  Zap, Brain, Target, Flame, Users, BookOpen, 
  Play, ArrowRight, Activity, Sparkles, CheckCircle2, Award
} from 'lucide-react';

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [typedMessage, setTypedMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sentient message typing effect from the Orb at start
  const fullMessage = "AWAKEN, HUNTER. CORPORATE STUDY TOOLS ARE DEAD. CONVERT STUDYING INTO AN OBSESSION.";
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullMessage.length) {
        setTypedMessage(prev => prev + fullMessage.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Scroll Progress Monitoring
  const { scrollYProgress } = useScroll();

  // 1. Orb Y-coordinate layout transform:
  // Starts centered -> moves to bottom center -> stays static -> rises slightly to form center CTA button
  const orbY = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["0vh", "34vh", "34vh", "15vh"]
  );

  // 2. Orb Dimensions Morphs:
  // Circular sphere (280px) -> compact circular core (130px) -> wide interactive pill button (320px x 60px)!
  const orbWidth = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["280px", "120px", "120px", "320px"]
  );

  const orbHeight = useTransform(
    scrollYProgress,
    [0, 0.15, 0.8, 0.85],
    ["280px", "120px", "120px", "60px"]
  );

  const orbBorderRadius = useTransform(
    scrollYProgress,
    [0, 0.8, 0.85],
    ["9999px", "9999px", "20px"]
  );

  // Blur, glow, and shadow scaling
  const orbBlur = useTransform(scrollYProgress, [0, 0.15, 0.8, 0.85], ["0px", "4px", "4px", "0px"]);

  // Detect active section on scroll to emit features
  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      if (latest < 0.12) setActiveSection(0);
      else if (latest >= 0.12 && latest < 0.28) setActiveSection(1);
      else if (latest >= 0.28 && latest < 0.44) setActiveSection(2);
      else if (latest >= 0.44 && latest < 0.60) setActiveSection(3);
      else if (latest >= 0.60 && latest < 0.76) setActiveSection(4);
      else if (latest >= 0.76 && latest < 0.88) setActiveSection(5);
      else setActiveSection(6);
    });
  }, [scrollYProgress]);

  // Features list emitted by the Orb as user scrolls
  const features = [
    {
      id: 1,
      title: "DAILY FOCUS QUESTS",
      tag: "MOTIVATION HARVESTER",
      desc: "Bypass boring calendars. Earn massive XP multipliers by maintaining daily focus streaks, clearing revision objectives, and climbing your cognitive tiers.",
      color: "text-cyan-400 border-cyan-400/20 bg-cyan-950/15",
      badge: "ACTIVE MULTIPLIER x1.5"
    },
    {
      id: 2,
      title: "DEEP FOCUS PULSE",
      tag: "BRAINWAVE STABILIZER",
      desc: "Launch immersive focus clocks that automatically dim secondary noise. Adaptive presence locks screen activity, ensuring complete cognitive isolation.",
      color: "text-purple-400 border-purple-400/20 bg-purple-950/15",
      badge: "COGNITIVE RESTRICTION ENGAGED"
    },
    {
      id: 3,
      title: "STUDY ARENA DUELS",
      tag: "PEER MATCHMAKING",
      desc: "Challenge friends or S-rank opponents inside real-time matchmaking channels. Race through custom decks to test accuracy and recall speed.",
      color: "text-red-400 border-red-400/20 bg-red-950/15",
      badge: "PEER CONNECTOR STABLE"
    },
    {
      id: 4,
      title: "EVOLUTIONARY DECKS",
      tag: "SMART CARD ENGINES",
      desc: "Build evolutionary spaced repetition decks. Program cards with smart cognitive triggers, automatically scheduling recall cycles for perfect storage stability.",
      color: "text-emerald-400 border-emerald-400/20 bg-emerald-950/15",
      badge: "SM-2 RETRIEVAL SYSTEM"
    },
    {
      id: 5,
      title: "NEURAL SYNDICATES",
      tag: "SOCIAL NETWORKS",
      desc: "Join study guilds, inspect hunter stats, track status auric glows, and climb the leaderboard standings alongside S-Rank cognitive users globally.",
      color: "text-yellow-400 border-yellow-400/20 bg-yellow-950/15",
      badge: "SYNC RANKINGS ACTIVE"
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020204] text-white relative font-sans select-none scroll-smooth">
      {/* 1. Cyber scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-30" />

      {/* 2. Global floating hexagonal cyber grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10" style={{ 
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)`,
        backgroundSize: '45px 45px'
      }} />

      {/* 3. Ambient cyber glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* 4. THE SOUL — THE ORB WHICH BECOMES THE PAYMENT BUTTON */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-30">
        <motion.div
          style={{
            y: orbY,
            width: orbWidth,
            height: orbHeight,
            borderRadius: orbBorderRadius,
            filter: orbBlur
          }}
          className="relative flex items-center justify-center overflow-hidden border border-cyan-400/30 shadow-[0_0_80px_rgba(6,182,212,0.45),inset_0_0_30px_rgba(255,255,255,0.2)] bg-gradient-to-tr from-cyan-900/60 via-indigo-950/80 to-purple-900/60 pointer-events-auto cursor-pointer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (activeSection === 6 || activeSection === 0) {
              setShowAuth(true);
            }
          }}
        >
          {/* Main animated orb graphics visible ONLY before morphing into button */}
          <AnimatePresence>
            {activeSection < 6 && (
              <motion.div
                key="orb-graphics"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Dynamic core glow */}
                <motion.div 
                  animate={{
                    scale: [1, 1.05, 0.95, 1.05, 1],
                    rotate: 360
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-600 to-purple-600 opacity-80 mix-blend-screen"
                />
                {/* Ethereal second layer */}
                <div className="absolute w-[90%] h-[90%] rounded-full bg-pink-500/20 blur-md mix-blend-color-dodge animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Morphing payment text visible ONLY in active button state */}
          <AnimatePresence>
            {activeSection === 6 && (
              <motion.div
                key="btn-text"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 font-black text-xs md:text-sm tracking-[0.25em] text-white uppercase italic"
              >
                <Zap size={14} className="text-cyan-400 animate-bounce" />
                AWAKEN SYSTEM • $10 ONE-TIME
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 5. SECTIONS FOR NATURAL SCROLL TRACKING */}
      <div className="relative z-10">

        {/* SECTION 1: HERO / AWAKENING ORB MESSAGE */}
        <section className="h-screen w-screen flex flex-col justify-center items-center px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 z-20">
            {/* HUD signature tag */}
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-500/5 border border-cyan-400/20 rounded-full backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-[9px] font-black tracking-[0.4em] uppercase text-cyan-400">NEURAL CORE MATRIX ONLINE</span>
            </div>

            {/* Cinematic Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none text-white/95">
              LEVELUP
            </h1>

            {/* Typewriter message flowing from the Orb */}
            <div className="min-h-[60px] max-w-xl mx-auto flex items-center justify-center">
              <p className="text-xs md:text-sm font-black tracking-widest text-cyan-400 uppercase font-mono leading-relaxed">
                {typedMessage}
                <span className="animate-pulse">|</span>
              </p>
            </div>
          </div>

          <div className="absolute bottom-10 flex flex-col items-center gap-2 text-white/20">
            <span className="text-[8px] font-black tracking-[0.4em]">SCROLL TO CONNECT PROTOCOL</span>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-3 bg-white/20 rounded-full flex justify-center pt-0.5">
              <div className="w-0.5 h-1 bg-cyan-400 rounded-full animate-ping" />
            </motion.div>
          </div>
        </section>

        {/* SECTION 2-6: INDIVIDUAL SCROLL SECTIONS THAT EMIT FEATURES */}
        {features.map((feature, index) => (
          <section 
            key={feature.id} 
            className="h-screen w-screen flex flex-col justify-center items-center px-6 relative"
          >
            {/* Feature emission card */}
            <AnimatePresence>
              {activeSection === feature.id && (
                <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -100, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`w-full max-w-lg p-8 rounded-3xl border border-white/5 bg-[#08090d]/80 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-center space-y-6 relative overflow-hidden`}
                >
                  {/* Glowing light sweep inside card */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                  
                  <div className="space-y-2">
                    <span className="text-[8px] font-black tracking-[0.4em] text-white/40 uppercase">MODULE DETECTED</span>
                    <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase">
                      {feature.title}
                    </h3>
                    <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black tracking-widest text-cyan-300 uppercase">
                      {feature.tag}
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                    {feature.desc}
                  </p>

                  <div className="pt-2">
                    <span className="text-[9px] font-black tracking-widest text-cyan-400 px-3 py-1.5 bg-cyan-950/20 border border-cyan-500/25 rounded-xl uppercase">
                      {feature.badge}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ))}

        {/* SECTION 7: FINAL SCROLL CLIMAX - PAY FOR ACTIVATION */}
        <section className="h-screen w-screen flex flex-col justify-center items-center px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

          <div className="max-w-xl mx-auto text-center space-y-6 z-20">
            <span className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase">SYNCHRONIZATION SEQUENCER</span>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
              AWAKEN THE FULL MATRIX.
            </h2>
            <p className="text-xs md:text-sm text-white/60 font-semibold uppercase tracking-wider max-w-md mx-auto leading-relaxed">
              No complex subscriptions. No monthly friction. Pay ten dollars once and receive permanent S-rank access to focus matrices, flashcard evolution, and friendly battle arenas.
            </p>
          </div>

          <div className="absolute bottom-10 flex flex-col md:flex-row justify-between items-center w-full max-w-7xl px-8 z-20 text-[10px] font-black text-white/30 tracking-widest uppercase">
            <span>LEVELUP STUDY INC // ALL PROTOCOLS ENCRYPTED.</span>
            <span>VERSION 1.1.0</span>
          </div>
        </section>

      </div>

      {/* 6. GLASSMORPHIC AUTH OVERLAY TRIGGERED BY CLICKING MORPHED BUTTON */}
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
