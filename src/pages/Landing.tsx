import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { 
  Zap, Brain, Target, Flame, Users, BookOpen, Shield, ChevronDown, 
  Terminal, Play, ArrowRight, Activity, Sparkles, CheckCircle2, Award
} from 'lucide-react';

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [demoCommand, setDemoCommand] = useState('');
  const [demoLogs, setDemoLogs] = useState<string[]>([
    'SYSTEM ONLINE: NEURAL SIGNATURE WAITING...',
    'READY FOR COGNITIVE ENGAGEMENT.'
  ]);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for magnetic orb feel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // Calculate normalized position from center (-0.5 to 0.5)
      const x = (clientX / innerWidth) - 0.5;
      const y = (clientY / innerHeight) - 0.5;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Spring values for smooth lag follow on the main Orb
  const springConfig = { damping: 25, stiffness: 120 };
  const orbX = useSpring(mousePosition.x * 50, springConfig);
  const orbY = useSpring(mousePosition.y * 50, springConfig);

  // Scroll animations for Orb scale, position, and blur morphs
  const { scrollYProgress } = useScroll();
  
  // Transform the Orb size, rotation, blur, and opacity based on scroll
  const orbScale = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [1, 0.8, 1.2, 0.9, 0.7, 2.5]);
  const orbBlur = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 4, 2, 8, 4, 12]);
  const orbOpacity = useTransform(scrollYProgress, [0, 0.15, 0.4, 0.65, 0.9, 1], [0.8, 0.6, 0.9, 0.7, 0.6, 0.95]);
  
  // Interactive mock terminal action
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoCommand.trim()) return;
    
    const cmd = demoCommand.toLowerCase().trim();
    setDemoLogs(prev => [...prev, `> ${demoCommand}`]);
    setDemoCommand('');
    setIsDemoLoading(true);

    setTimeout(() => {
      setIsDemoLoading(false);
      if (cmd.includes('cognitive') || cmd.includes('activate')) {
        setDemoLogs(prev => [
          ...prev,
          '⚙️ INITIALIZING COGNITIVE INTERFACE...',
          '⚡ NEURAL SYNAPSE ROUTING STABILIZED [100%]',
          '🔥 COGNITIVE TURBO PROTOCOL FULLY ARMED.',
          '🌟 CURRENT LEVEL: S-RANK FOCUS DETECTED.'
        ]);
      } else if (cmd.includes('sync') || cmd.includes('orb')) {
        setDemoLogs(prev => [
          ...prev,
          '🔮 SYNCHRONIZING WITH CENTRAL FOCUS ORB...',
          '✨ ORB EMITTING HARMONIC NEURAL WAVES (HUE: 200°)',
          '🛡️ FOCUS SHELL ENGAGED - ALL DISTRACTIONS FILTERED.'
        ]);
      } else if (cmd.includes('deck') || cmd.includes('smart')) {
        setDemoLogs(prev => [
          ...prev,
          '🗂️ LOADING EVOLUTIONARY SMART DECK STORAGE...',
          '🧬 SM-2 SPACED REPETITION ALGORITHM: ONLINE.',
          '📈 STABILITY ENHANCED: CARDS READY FOR RETRIEVAL.'
        ]);
      } else if (cmd.includes('clear')) {
        setDemoLogs([]);
      } else {
        setDemoLogs(prev => [
          ...prev,
          `⚠️ COMMAND NOT SPECIFIED: '${cmd}'`,
          'AVAILABLE UTILITIES: /activate-cognitive, /sync-orb, /load-decks, /clear'
        ]);
      }
    }, 800);
  };

  // Pre-load specific command in terminal demo
  const triggerDemoCommand = (command: string) => {
    setDemoCommand(command);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020204] text-white relative overflow-x-hidden font-sans select-none scroll-smooth">
      {/* 1. Cyber scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-35" />

      {/* 2. Global floating hexagonal cyber grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15" style={{ 
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* 3. Volumetric glowing background layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[180px] animate-pulse delay-1000" />
      </div>

      {/* 4. THE SOUL — GLOBAL FLOATING ORB */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-10">
        <motion.div
          style={{
            x: orbX,
            y: orbY,
            scale: orbScale,
            filter: `blur(${orbBlur}px)`,
            opacity: orbOpacity
          }}
          className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center"
        >
          {/* Main pulsing core */}
          <motion.div 
            animate={{
              scale: [1, 1.03, 0.97, 1.05, 1],
              rotate: 360
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-600 to-purple-600 shadow-[0_0_120px_rgba(6,182,212,0.65),inset_0_0_60px_rgba(255,255,255,0.4)] opacity-85 mix-blend-screen"
          />

          {/* Ethereal second layer */}
          <div className="absolute w-[95%] h-[95%] rounded-full bg-gradient-to-bl from-pink-500/40 via-cyan-400/30 to-purple-600/50 blur-sm mix-blend-color-dodge animate-pulse" />

          {/* Orbital cyan ring */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 rounded-full border border-cyan-400/25 border-dashed shadow-[0_0_25px_rgba(34,211,238,0.15)]"
          />

          {/* Outer purple ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-16 rounded-full border border-purple-500/15 shadow-[0_0_35px_rgba(168,85,247,0.1)]"
          />
        </motion.div>
      </div>

      {/* 5. FLOATING HUD NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-6 backdrop-blur-md border-b border-white/[0.03]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-[8px]" />
              <div className="relative w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
            </div>
            <span className="text-sm font-black italic tracking-[0.3em] text-white">LEVELUP // NEURAL OS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-[10px] font-black tracking-widest text-white/50 hover:text-white uppercase transition-colors">THE COGNITIVE GAP</a>
            <a href="#features" className="text-[10px] font-black tracking-widest text-white/50 hover:text-white uppercase transition-colors">SYSTEM UTILITIES</a>
            <a href="#demo" className="text-[10px] font-black tracking-widest text-white/50 hover:text-white uppercase transition-colors">INTERACTION SIMULATOR</a>
            <a href="#logs" className="text-[10px] font-black tracking-widest text-white/50 hover:text-white uppercase transition-colors">HUNTER RECORDS</a>
          </nav>

          <button 
            onClick={() => setShowAuth(true)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-white rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)]"
          >
            INITIALIZE CONSOLE
          </button>
        </div>
      </header>

      {/* 6. LANDING PAGE SECTIONS */}
      <main className="relative z-20">
        
        {/* SECTION 1 — HERO */}
        <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto space-y-8 z-20">
            {/* System Online HUD Tag */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-500/5 border border-cyan-400/20 rounded-full backdrop-blur-xl"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-[9px] font-black tracking-[0.4em] uppercase text-cyan-400">NEURAL STUDY SYSTEM ONLINE</span>
            </motion.div>

            {/* Massive headline */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none"
            >
              TURN STUDYING INTO AN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">OBSESSION</span>
            </motion.h1>

            {/* Subtext description */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-lg text-white font-medium max-w-2xl mx-auto leading-relaxed tracking-wide"
            >
              A futuristic self-study operating system that transforms focus, revision, and discipline into a live ranked progression game. Hack your dopamine cycle. Evolve your brain.
            </motion.p>

            {/* Glowing tactile CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6"
            >
              <button 
                onClick={() => setShowAuth(true)}
                className="group relative px-8 py-5 overflow-hidden rounded-2xl bg-cyan-500 text-black font-black text-xs tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                ENTER THE SYSTEM
              </button>

              <a 
                href="#demo"
                className="flex items-center gap-3 px-8 py-5 bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-white rounded-2xl text-xs font-black tracking-[0.2em] uppercase transition-all active:scale-[0.98]"
              >
                <Play size={14} className="text-cyan-400" />
                WATCH SYSTEM DEMO
              </a>
            </motion.div>
          </div>

          <div className="absolute bottom-10 flex flex-col items-center gap-2 text-white/25">
            <span className="text-[8px] font-black tracking-[0.4em] uppercase">SCROLL FOR SYSTEM DIAGNOSTICS</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </section>

        {/* SECTION 2 — THE PROBLEM */}
        <section id="problem" className="relative min-h-screen flex items-center justify-center px-6 py-28 border-t border-b border-white/[0.03] bg-black/40">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-red-500/5 border border-red-500/20 rounded text-[9px] font-black tracking-widest text-red-400 uppercase">
                COGNITIVE DECAY DETECTED
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tight uppercase leading-tight">
                YOUR BRAIN WAS NEVER DESIGNED FOR STATIC PRODUCTIVITY
              </h2>
              <div className="h-1 w-20 bg-red-500" />
              <p className="text-sm text-white/60 leading-relaxed">
                Corporate calendars and default flat folders trigger zero dopamine. Static flashcard software makes studying feel like labor, draining focus reserves and locking you into endless loop cycles of procrastination.
              </p>
              <div className="p-5 border border-white/5 rounded-2xl bg-white/[0.02]">
                <p className="text-xs font-black tracking-wider text-cyan-400 uppercase mb-2">⚡ THE NEURAL OVERRIDE:</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  We bypassed boring calendars and created a progression feedback loop that mirrors the neurological patterns of addicting game launches.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Fake UI items representing the problem dissolving */}
              <div className="relative p-6 border border-red-500/10 rounded-2xl bg-red-500/[0.01] blur-[1px] opacity-40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-red-400">FLAT STUDY APP</span>
                  <span className="text-[8px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded">BOREDOM</span>
                </div>
                <div className="h-2 bg-red-500/10 rounded w-3/4 mb-2" />
                <div className="h-2 bg-red-500/10 rounded w-1/2" />
              </div>

              <div className="text-center py-4">
                <span className="text-[9px] font-black tracking-[0.3em] text-white/20">SYSTEM CONVERTING STATIC ASSETS...</span>
              </div>

              {/* Glowing active system card */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-6 border border-cyan-400/30 rounded-2xl bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl" />
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black tracking-widest text-cyan-400">LEVELUP PROGRESSION HARMONICS</span>
                  <span className="text-[8px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-black tracking-wider">ACTIVE</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[8px] font-black tracking-widest text-white/60 mb-1">
                      <span>NEURAL SYNCHRONIZATION</span>
                      <span className="text-cyan-400">98%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '98%' }}
                        className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[9px] font-bold text-white/40">S-RANK COGNITIVE BUFFER</span>
                    <span className="text-[10px] font-black text-cyan-300 tracking-wider">+450 XP</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — FEATURE EXPERIENCE */}
        <section id="features" className="relative px-6 py-32 space-y-28">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase">TACTICAL MODULES</span>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase">SYSTEM UTILITIES UNLOCKED</h2>
            <p className="text-xs text-white/50 max-w-xl mx-auto uppercase tracking-widest">EVERY UNIT IS DESIGNED TO MAXIMIZE DOPAMINE HARVESTING.</p>
          </div>

          <div className="max-w-5xl mx-auto space-y-24">
            {/* Feature 1 — Daily Quests */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Flame size={20} className="animate-pulse" />
                </div>
                <h3 className="text-3xl font-black italic tracking-tight uppercase">DAILY FOCUS QUESTS</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Earn active XP by logging consistency streaks. Your dashboard provides daily focus objectives—consecutive streak boosts, cognitive trials, and memory recalls—that keep your daily momentum alive.
                </p>
                <div className="flex gap-4">
                  <div className="p-3 border border-white/5 bg-white/[0.01] rounded-xl text-center flex-1">
                    <p className="text-[10px] font-black text-cyan-400">STREAK MULTIPLIER</p>
                    <p className="text-xl font-black italic text-white mt-1">x1.5 XP</p>
                  </div>
                  <div className="p-3 border border-white/5 bg-white/[0.01] rounded-xl text-center flex-1">
                    <p className="text-[10px] font-black text-purple-400">COGNITIVE LEVEL</p>
                    <p className="text-xl font-black italic text-white mt-1">S-RANK</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-white/5 rounded-[2rem] bg-white/[0.01] relative overflow-hidden group hover:border-cyan-400/25 transition-all">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />
                <h4 className="text-xs font-black tracking-widest text-cyan-400 mb-4 uppercase">⚡ PENDING MISSION LOGS</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                      <span className="text-[10px] font-black tracking-wider text-white">SMART DECK CALIBRATION</span>
                    </div>
                    <span className="text-[9px] font-black text-cyan-400 tracking-wider">+100 XP</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span className="text-[10px] font-black tracking-wider text-white">DEEP PULSE STABILIZATION (25 MIN)</span>
                    </div>
                    <span className="text-[9px] font-black text-purple-400 tracking-wider">+250 XP</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-black tracking-wider text-white">ARENA TRIAL RETRIEVAL</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 tracking-wider">COMPLETED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 — Deep Pulse Focus */}
            <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
              <div className="space-y-6 md:order-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Brain size={20} />
                </div>
                <h3 className="text-3xl font-black italic tracking-tight uppercase">DEEP PULSE TIMER</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Enter focus states where the visual environment dims and focus triggers a dynamic, glowing breathing matrix. The timer syncs with your neural state, keeping you completely isolated from secondary inputs.
                </p>
                <div className="p-4 border border-purple-500/20 bg-purple-950/10 rounded-2xl">
                  <p className="text-[10px] font-black text-purple-400 mb-1">BRAINWAVE HARMONY:</p>
                  <p className="text-xs text-white/55">In-app focus checks monitor activity status, securing zero distractions for the entire duration.</p>
                </div>
              </div>

              <div className="md:order-1 p-8 border border-white/5 rounded-[2rem] bg-white/[0.01] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.06)_0%,transparent_70%)]" />
                
                {/* Immersive Pulse Timer visualization */}
                <div className="relative w-44 h-44 rounded-full border border-purple-500/20 flex items-center justify-center mb-6">
                  <motion.div 
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-4 rounded-full bg-purple-600/5 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col items-center justify-center"
                  />
                  <div className="relative text-center">
                    <span className="text-3xl font-black italic tracking-tighter text-white">24:59</span>
                    <p className="text-[7px] font-black tracking-[0.3em] text-purple-400 uppercase mt-1">DEEP FOCUS</p>
                  </div>
                </div>
                <span className="text-[9px] font-black tracking-[0.4em] text-purple-400 uppercase animate-pulse">BREATHE INDUCTIVELY</span>
              </div>
            </div>

            {/* Feature 3 — Battle Arenas */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Target size={20} />
                </div>
                <h3 className="text-3xl font-black italic tracking-tight uppercase">STUDY ARENA DUELS</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Put your revision deck speed to the test. Join friendly or random duels inside real-time matchmaking channels. Both players undergo randomized deck retrieval cards—winner takes major XP awards!
                </p>
                <div className="flex items-center gap-3 text-cyan-300">
                  <Zap size={16} />
                  <span className="text-xs font-black tracking-widest uppercase">REAL-TIME PEER HANDSHAKE ONLINE</span>
                </div>
              </div>

              <div className="p-6 border border-white/5 rounded-[2rem] bg-white/[0.01] relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-white/40 tracking-wider">ARENA MATCH DETECTED</span>
                  <span className="text-[8px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 rounded font-black">EXCHANGE ACTIVE</span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  {/* Player 1 */}
                  <div className="text-center space-y-2 flex-1">
                    <div className="w-12 h-12 rounded-full border border-cyan-400/40 bg-cyan-950/20 mx-auto flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                      <span>P1</span>
                    </div>
                    <p className="text-[9px] font-black text-white truncate">YOU (MONARCH)</p>
                    <p className="text-[10px] font-black text-cyan-400">95% ACC</p>
                  </div>

                  <div className="text-[12px] font-black italic text-cyan-400/40">VS</div>

                  {/* Player 2 */}
                  <div className="text-center space-y-2 flex-1">
                    <div className="w-12 h-12 rounded-full border border-purple-500/30 bg-purple-950/20 mx-auto flex items-center justify-center text-purple-300">
                      <span>P2</span>
                    </div>
                    <p className="text-[9px] font-black text-white truncate">HUNTER_X</p>
                    <p className="text-[10px] font-black text-purple-400">89% ACC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — HOW IT WORKS */}
        <section className="relative px-6 py-28 border-t border-b border-white/[0.03] bg-black/40">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase">SYS SETUP FLOW</span>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">SYNCHRONIZATION PATHWAYS</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="p-6 border border-white/5 bg-white/[0.01] rounded-3xl relative overflow-hidden space-y-4 group hover:border-cyan-400/20 transition-all">
                <div className="text-3xl font-black italic text-cyan-500/20">01</div>
                <h3 className="text-lg font-black uppercase text-white">AWAKEN YOUR PROFILE</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Go through the SENTIENT awakening interview to construct your neural profile, allocate initial hunter stats, and map your core rank status hue.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 border border-white/5 bg-white/[0.01] rounded-3xl relative overflow-hidden space-y-4 group hover:border-cyan-400/20 transition-all">
                <div className="text-3xl font-black italic text-cyan-500/20">02</div>
                <h3 className="text-lg font-black uppercase text-white">CONSTRUCT SMART DECKS</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Build evolutionary study decks. Program revision flashcards with targeted cognitive blocks and practice them inside focus countdown lobbies.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 border border-white/5 bg-white/[0.01] rounded-3xl relative overflow-hidden space-y-4 group hover:border-cyan-400/20 transition-all">
                <div className="text-3xl font-black italic text-cyan-500/20">03</div>
                <h3 className="text-lg font-black uppercase text-white">LEVEL UP YOUR RANK</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Conquer daily challenges and duel other hunters inside peer battle arenas to gather raw XP, level up your rank, and glow with ultimate auric power.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — IMMERSIVE INTERACTIVE MOCK TERMINAL */}
        <section id="demo" className="relative px-6 py-32">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase">COGNITIVE INTERFACE</span>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">NEURAL SIMULATOR CONSOLE</h2>
              <p className="text-xs text-white/55 max-w-lg mx-auto">TRY INJECTING COGNITIVE SIGNALS DIRECTLY TO THE CORE SYSTEM NOW.</p>
            </div>

            {/* Immersive Terminal Card */}
            <div className="border border-white/10 rounded-3xl bg-[#08090d]/80 shadow-[0_0_50px_rgba(6,182,212,0.1)] backdrop-blur-2xl overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex items-center gap-2 text-cyan-400/50">
                  <Terminal size={14} />
                  <span className="text-[9px] font-black tracking-widest uppercase">COGNITIVE_TERMINAL_V1.0</span>
                </div>
                <div className="w-16" />
              </div>

              {/* Logs area */}
              <div className="p-6 min-h-[220px] font-mono text-xs space-y-2 text-white/80 overflow-y-auto">
                <AnimatePresence>
                  {demoLogs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`${log.startsWith('⚠️') ? 'text-red-400' : log.startsWith('> ') ? 'text-cyan-400 font-bold' : 'text-cyan-200/60'}`}
                    >
                      {log}
                    </motion.div>
                  ))}
                  {isDemoLoading && (
                    <motion.div 
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-cyan-400"
                    >
                      &gt; PROCESSING COGNITIVE PROTOCOL...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Suggestions Panel */}
              <div className="px-6 py-3 border-t border-b border-white/5 bg-white/[0.01] flex flex-wrap gap-2 items-center">
                <span className="text-[8px] font-black text-white/40 tracking-wider uppercase mr-2">QUICK SIGNALS:</span>
                <button 
                  onClick={() => triggerDemoCommand('/activate-cognitive')}
                  className="px-3 py-1.5 border border-cyan-400/30 hover:border-cyan-400 bg-cyan-950/20 text-cyan-300 rounded text-[9px] font-mono transition-all"
                >
                  /activate-cognitive
                </button>
                <button 
                  onClick={() => triggerDemoCommand('/sync-orb')}
                  className="px-3 py-1.5 border border-purple-500/30 hover:border-purple-500 bg-purple-950/20 text-purple-300 rounded text-[9px] font-mono transition-all"
                >
                  /sync-orb
                </button>
                <button 
                  onClick={() => triggerDemoCommand('/load-decks')}
                  className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 text-emerald-300 rounded text-[9px] font-mono transition-all"
                >
                  /load-decks
                </button>
              </div>

              {/* Terminal Input */}
              <form onSubmit={handleTerminalSubmit} className="flex border-t border-white/5">
                <span className="flex items-center pl-6 text-cyan-400 font-mono text-xs font-bold">&gt;</span>
                <input
                  type="text"
                  value={demoCommand}
                  onChange={(e) => setDemoCommand(e.target.value)}
                  placeholder="Inject study protocols... (e.g. /activate-cognitive, /sync-orb)"
                  className="flex-1 bg-transparent px-3 py-5 font-mono text-xs text-white outline-none placeholder:text-white/20"
                />
                <button 
                  type="submit" 
                  className="px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] tracking-widest uppercase transition-colors"
                >
                  INJECT
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* SECTION 6 — SOCIAL PROOF (HUNTER LOGS) */}
        <section id="logs" className="relative px-6 py-28 border-t border-white/[0.03] bg-black/40">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase">SYNCHRONIZATION REVIEWS</span>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">HUNTER INTRUSION LOGS</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Log 1 */}
              <div className="p-6 border border-white/5 bg-white/[0.01] rounded-3xl relative overflow-hidden space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-cyan-400/20 bg-cyan-950/20 flex items-center justify-center text-cyan-400 text-xs font-black">
                    #91
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-white uppercase">HUNTER KAELEN</p>
                    <p className="text-[8px] font-black text-cyan-400 tracking-wider">A-RANK MONARCH</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed italic">
                  "I was struggling to hit even 2 hours of study time daily. But the combat duel matchmaking in LevelUp has completely hijacked my brain. I studied 6 hours straight without forcing myself. My streak addiction became real."
                </p>
              </div>

              {/* Log 2 */}
              <div className="p-6 border border-white/5 bg-white/[0.01] rounded-3xl relative overflow-hidden space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-purple-500/20 bg-purple-950/20 flex items-center justify-center text-purple-400 text-xs font-black">
                    #76
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-white uppercase">HUNTER ARIS</p>
                    <p className="text-[8px] font-black text-purple-400 tracking-wider">S-RANK COGNITIVE</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed italic">
                  "This is not a productivity system. This is a sentience launcher for discipline. The dynamic visual feedback when the focus orb pulses genuinely calms my neurodivergent noise. Absolutely outstanding design."
                </p>
              </div>

              {/* Log 3 */}
              <div className="p-6 border border-white/5 bg-white/[0.01] rounded-3xl relative overflow-hidden space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/20 bg-emerald-950/20 flex items-center justify-center text-emerald-400 text-xs font-black">
                    #12
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-white uppercase">HUNTER VERA</p>
                    <p className="text-[8px] font-black text-emerald-400 tracking-wider">B-RANK SHIELDER</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed italic">
                  "SM-2 flashcard evolution keeps memory recall locked inside high stakes. Leveling up my status aura feels incredibly satisfying. I deleted every study app on my desktop. This is the only console I need."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — FINAL CTA */}
        <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-32">
          {/* Extremely dark focus atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-[#020204]/90 to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-8 z-20 relative">
            <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase">SYS FINALIZE SEQUENCE</span>
            
            <h2 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase leading-none text-white">
              YOUR SYSTEM IS WAITING.
            </h2>
            
            <p className="text-sm md:text-lg text-white/60 font-medium max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
              Stop relying on fleeting motivation. Initialize a progression operating system your brain actually wants to return to.
            </p>

            <div className="pt-6">
              <button 
                onClick={() => setShowAuth(true)}
                className="group relative px-10 py-6 overflow-hidden rounded-[2rem] bg-cyan-500 text-black font-black text-sm tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(6,182,212,0.6)]"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                ENTER THE NEURAL SYSTEM
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-white/[0.03] py-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
            <span className="text-xs font-black tracking-[0.3em] uppercase text-white/60">LEVELUP STUDY SYSTEM COGNITION INC.</span>
          </div>
          <div className="text-[9px] font-mono text-white/30 tracking-wider">
            SYSTEM VERSION 1.1.0 // ALL SIGNALS ENCRYPTED.
          </div>
        </div>
      </footer>

      {/* 7. FULLSCREEN GORGEOUS GLASSMORPHIC AUTH OVERLAY INTEGRATION */}
      <AnimatePresence>
        {showAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-hidden bg-black/90 backdrop-blur-2xl flex items-center justify-center"
          >
            <QuickStart initialPhase={2} onClose={() => setShowAuth(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
