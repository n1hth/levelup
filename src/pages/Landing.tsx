import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// REVEAL — Fade in on scroll
// ═══════════════════════════════════════════════════════════
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MARQUEE — Infinite horizontal scroll (CSS only)
// ═══════════════════════════════════════════════════════════
const MARQUEE_ITEMS = [
  'SPACED REPETITION', 'FOCUS ENGINE', 'RANK EVOLUTION', 'LIVE DUELS',
  'GUILD WARS', 'XP SYSTEM', 'NEURAL ANALYTICS', 'FLASHCARD DECKS',
  'AWARENESS CHECKS', 'STUDY STREAKS', 'LEADERBOARDS', 'DEEP FLOW',
];

function Marquee() {
  const content = MARQUEE_ITEMS.map(t => t + '  ◆  ').join('');
  return (
    <div className="relative overflow-hidden py-6 border-y border-white/[0.04]">
      <div className="marquee-track flex whitespace-nowrap">
        {[0, 1].map(i => (
          <span
            key={i}
            className="text-[11px] sm:text-xs font-black tracking-[0.5em] text-white/[0.07] uppercase flex-shrink-0 pr-4"
            aria-hidden={i === 1}
          >
            {content}
          </span>
        ))}
      </div>
      <style>{`
        .marquee-track {
          animation: marquee 40s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AURORA — Animated gradient mesh (CSS only, GPU composited)
// ═══════════════════════════════════════════════════════════
function Aurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          will-change: transform;
        }
        @media (min-width: 768px) {
          .aurora-blob { filter: blur(160px); }
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, -60px) scale(1.15); }
          66% { transform: translate(-40px, 40px) scale(0.9); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-60px, 80px) scale(0.85); }
          66% { transform: translate(60px, -30px) scale(1.1); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0) scale(1.05); }
          50% { transform: translate(40px, 60px) scale(0.9); }
        }
      `}</style>
      {/* Cyan core */}
      <div
        className="aurora-blob w-[500px] h-[500px] md:w-[800px] md:h-[800px] opacity-[0.12]"
        style={{
          background: 'oklch(0.65 0.25 210)',
          top: '20%', left: '40%',
          animation: 'drift1 20s ease-in-out infinite',
        }}
      />
      {/* Blue accent */}
      <div
        className="aurora-blob w-[400px] h-[400px] md:w-[600px] md:h-[600px] opacity-[0.08]"
        style={{
          background: 'oklch(0.5 0.25 250)',
          top: '50%', left: '20%',
          animation: 'drift2 25s ease-in-out infinite',
        }}
      />
      {/* Purple whisper */}
      <div
        className="aurora-blob w-[350px] h-[350px] md:w-[500px] md:h-[500px] opacity-[0.06]"
        style={{
          background: 'oklch(0.45 0.2 290)',
          top: '30%', left: '60%',
          animation: 'drift3 30s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ORB — Interactive, parallax-responsive, living brand mark
// ═══════════════════════════════════════════════════════════
function HeroOrb() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 30 });
  const sy = useSpring(my, { stiffness: 80, damping: 30 });
  const rotX = useTransform(sy, [-0.5, 0.5], [12, -12]);
  const rotY = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const glowX = useTransform(sx, [-0.5, 0.5], [20, -20]);
  const glowY = useTransform(sy, [-0.5, 0.5], [20, -20]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth) - 0.5);
      my.set((e.clientY / window.innerHeight) - 0.5);
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [mx, my]);

  return (
    <motion.div
      style={{ rotateX: rotX, rotateY: rotY, perspective: 600 }}
      className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52"
    >
      {/* Aura pulse */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-12 md:-inset-16 rounded-full"
        style={{ background: 'radial-gradient(circle, oklch(0.65 0.25 220 / 0.3) 0%, transparent 70%)' }}
      />

      {/* Orb body */}
      <motion.div
        animate={{ scale: [1, 1.025, 0.975, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="w-full h-full rounded-full relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 35% 35%, white 0%, oklch(0.98 0.05 220) 25%, oklch(0.86 0.4 220) 55%, oklch(0.15 0.55 220) 100%)',
          boxShadow: '0 0 60px oklch(0.6 0.3 220 / 0.4), 0 0 160px oklch(0.5 0.25 220 / 0.15)',
        }}
      >
        {/* Moving specular highlight */}
        <motion.div
          className="absolute inset-[-20%] rounded-full opacity-70"
          style={{
            x: glowX,
            y: glowY,
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 45%)'
          }}
        />
        {/* Inner shadow */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_-8px_20px_rgba(0,0,0,0.4)]" />
        {/* Top glare */}
        <div className="absolute top-[12%] left-[18%] w-[32%] h-[16%] rounded-full bg-white/50 blur-[4px] -rotate-[30deg]" />
      </motion.div>

      {/* Floating sparks */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20 - i * 8, 0],
            x: [(i % 2 ? 5 : -5), (i % 2 ? -10 : 10), (i % 2 ? 5 : -5)],
            opacity: [0, 0.7, 0],
          }}
          transition={{ duration: 3 + i * 0.7, repeat: Infinity, delay: i * 0.6 }}
          className="absolute w-0.5 h-0.5 bg-white rounded-full"
          style={{
            left: `${20 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.5)',
          }}
        />
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// CAPABILITIES DATA
// ═══════════════════════════════════════════════════════════
const CAPABILITIES = [
  {
    id: '01',
    name: 'Evolutionary Decks',
    brief: 'SM-2 spaced repetition that adapts to your memory in real-time.',
  },
  {
    id: '02',
    name: 'Deep Focus',
    brief: 'Ambient timers, breathing cues, and awareness checks for flow state.',
  },
  {
    id: '03',
    name: 'XP & Rank System',
    brief: 'Seven hunter tiers. Your orb evolves as your knowledge grows.',
  },
  {
    id: '04',
    name: 'Arena Duels',
    brief: 'Real-time flashcard battles against friends or matchmade opponents.',
  },
  {
    id: '05',
    name: 'Study Guilds',
    brief: 'Squad up, share decks, coordinate sessions, climb together.',
  },
  {
    id: '06',
    name: 'Neural Analytics',
    brief: 'Retention curves, session data, and cognitive performance tracking.',
  },
];

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [activeCapIndex, setActiveCapIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCapIndex((prev) => (prev + 1) % CAPABILITIES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#030309] text-white font-sans antialiased overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">

      {/* ───────── NAV ───────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 35%, white, oklch(0.86 0.4 220) 60%, oklch(0.15 0.55 220))',
                boxShadow: '0 0 14px oklch(0.6 0.3 220 / 0.5)',
              }}
            />
            <span className="text-[13px] font-black tracking-[0.12em] uppercase italic">
              Ascend
            </span>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2 rounded-full border border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────── */}
      {/*  HERO                                               */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">
        <Aurora />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Orb */}
          <div className="mb-8 md:mb-10">
            <HeroOrb />
          </div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(1.75rem,6.2vw,5.8rem)] font-black italic tracking-[-0.04em] leading-[0.95] mb-5"
          >
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30">
              Greatness Isn't Given.
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500">
              It's Ascended.
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-sm sm:text-base md:text-lg text-white/35 max-w-md md:max-w-lg leading-relaxed mb-10"
          >
            Every session. Every review. Every victory.
            <br />
            Makes you stronger.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            <button
              onClick={() => setShowAuth(true)}
              className="group relative flex items-center gap-3 px-9 py-4 rounded-full font-bold text-sm tracking-[0.1em] uppercase overflow-hidden transition-transform duration-300 hover:scale-[1.04] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, oklch(0.68 0.22 220) 0%, oklch(0.48 0.28 240) 100%)',
                boxShadow: '0 0 40px oklch(0.55 0.25 220 / 0.35), 0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10">BEGIN YOUR ASCENSION</span>
              <ArrowRight size={15} className="relative z-10 transition-transform group-hover:translate-x-0.5" />
            </button>
            <span className="text-[10px] text-white/20 tracking-[0.2em] font-medium uppercase">
              Lifetime Access • Own It Forever
            </span>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030309] to-transparent pointer-events-none" />
      </section>

      {/* ─────────── MARQUEE ─────────── */}
      <Marquee />

      {/* ─────────────────────────────────────────────────── */}
      {/*  CAPABILITIES                                       */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header — split layout */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl md:text-[3.2rem] font-black italic tracking-[-0.03em] leading-[1.05]">
                Six systems.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                  One neural interface.
                </span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-sm text-white/25 max-w-xs leading-relaxed md:text-right">
                Every feature is designed to make knowledge acquisition feel like a game you can't put down.
              </p>
            </Reveal>
          </div>

          {/* Showcase Layout: Dual Layout (Responsive Mobile Card vs Desktop Split Column) */}
          
          {/* 1. Desktop Layout (Large screens only) */}
          <div className="hidden lg:flex flex-row gap-10 lg:gap-16 items-start w-full">
            {/* Left Column: Capability List */}
            <div className="w-full lg:w-1/2 space-y-0">
              {CAPABILITIES.map((cap, i) => {
                const isActive = i === activeCapIndex;
                return (
                  <Reveal key={cap.id} delay={i * 0.06}>
                    <div 
                      onClick={() => setActiveCapIndex(i)}
                      className={`group flex flex-col gap-2.5 py-5 border-t border-white/[0.04] cursor-pointer transition-all duration-500 ${isActive ? 'bg-white/[0.02] border-white/[0.1] px-4 rounded-xl -mx-4' : 'hover:border-white/[0.08]'}`}
                    >
                      <div className="flex items-center gap-5">
                        {/* Number */}
                        <span className={`text-[11px] font-mono transition-colors duration-500 ${isActive ? 'text-cyan-400 font-bold' : 'text-white/[0.1] group-hover:text-cyan-400/40'}`}>
                          {cap.id}
                        </span>

                        {/* Title */}
                        <h3 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                          {cap.name}
                        </h3>

                        {/* Arrow hint */}
                        <div className={`ml-auto hidden sm:flex w-5 items-center justify-center transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'}`}>
                          <ArrowRight size={14} className="text-cyan-400/50" />
                        </div>
                      </div>

                      {/* Brief description */}
                      <p className={`text-[13px] leading-relaxed transition-colors duration-500 pl-8 ${isActive ? 'text-white/60' : 'text-white/20 group-hover:text-white/35'}`}>
                        {cap.brief}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
              <div className="border-t border-white/[0.04]" />
            </div>

            {/* Right Column: Shared Fixed aspect-ratio Image Showcase */}
            <div className="w-full lg:w-1/2 lg:sticky lg:top-28">
              <Reveal delay={0.15}>
                <div className="w-full aspect-[16/10] bg-[#05070e] border border-white/10 rounded-2xl relative overflow-hidden group/img shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
                  {/* Glowing background hint */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-50" />
                  
                  {/* Inner dynamic content with smooth cross-fade */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCapIndex}
                      initial={{ opacity: 0, scale: 0.97, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.03, y: -4 }}
                      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-6"
                    >
                      {/* Image Placeholder */}
                      <div className="text-white/25 text-[10px] font-mono tracking-widest uppercase flex flex-col items-center gap-3 select-none text-center">
                        <div className="w-7 h-7 rounded-full border-2 border-white/5 border-t-cyan-400 animate-spin" />
                        <span>[ {CAPABILITIES[activeCapIndex].name.toUpperCase()} PREVIEW ]</span>
                        <span className="text-[8px] text-white/10 tracking-[0.2em] font-sans font-medium mt-1">Recommended: 960 × 600px (16:10)</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Reveal>
            </div>
          </div>

          {/* 2. Mobile & Tablet Carousel Layout (Below 1024px) */}
          <div className="flex lg:hidden flex-col items-center gap-6 w-full">
            <Reveal className="w-full">
              {/* Unified Feature Card */}
              <div className="w-full bg-white/[0.02] border border-white/10 p-5 rounded-[2.5rem] relative overflow-hidden backdrop-blur-3xl shadow-xl touch-pan-y">
                {/* Top: Image Preview */}
                <div className="w-full aspect-[16/10] bg-[#05070e] border border-white/5 rounded-2xl relative overflow-hidden mb-5">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-50" />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCapIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-4"
                    >
                      <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase flex flex-col items-center gap-2 text-center select-none">
                        <div className="w-6 h-6 rounded-full border-2 border-white/5 border-t-cyan-400 animate-spin" />
                        <span>[ {CAPABILITIES[activeCapIndex].name.toUpperCase()} PREVIEW ]</span>
                        <span className="text-[7px] text-white/10 tracking-widest mt-1">960 × 600px (16:10)</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom: Feature Info */}
                <div className="space-y-2 px-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-0.5 rounded-full border border-cyan-400/20 uppercase tracking-widest italic">
                      {CAPABILITIES[activeCapIndex].id}
                    </span>
                    <h3 className="text-base font-black italic uppercase tracking-wider text-white">
                      {CAPABILITIES[activeCapIndex].name}
                    </h3>
                  </div>
                  <p className="text-[13px] text-white/50 leading-relaxed pl-0.5 h-[60px] sm:h-[42px] overflow-hidden">
                    {CAPABILITIES[activeCapIndex].brief}
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Navigation Dots & Chevron Arrows */}
            <div className="flex items-center justify-between w-full px-4 mt-2">
              <button
                onClick={() => setActiveCapIndex((prev) => (prev - 1 + CAPABILITIES.length) % CAPABILITIES.length)}
                className="p-3.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 transition-all text-white/70 hover:text-white shadow-lg"
                aria-label="Previous capability"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {CAPABILITIES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCapIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeCapIndex ? 'w-5.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'w-1.5 bg-white/20'}`}
                    aria-label={`Go to feature ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveCapIndex((prev) => (prev + 1) % CAPABILITIES.length)}
                className="p-3.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] active:scale-90 transition-all text-white/70 hover:text-white shadow-lg"
                aria-label="Next capability"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/*  CLOSE — Pricing + Final CTA                        */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        {/* Subtle aurora echo */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute w-[500px] h-[500px] rounded-full blur-[120px] md:blur-[180px] opacity-[0.07]"
            style={{ background: 'oklch(0.6 0.25 220)', top: '40%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        </div>

        <div className="relative z-10 max-w-md mx-auto text-center">
          {/* Mini orb */}
          <Reveal>
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full mx-auto mb-10"
              style={{
                background: 'radial-gradient(circle at 35% 35%, white, oklch(0.86 0.4 220) 55%, oklch(0.15 0.55 220))',
                boxShadow: '0 0 50px oklch(0.55 0.3 220 / 0.3)',
              }}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-[1] mb-5">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">$10.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">Lifetime.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="text-sm text-white/25 leading-relaxed mb-8">
              Everything included. Every future update.
              <br className="hidden sm:block" />
              No subscriptions, no upsells, no catches.
            </p>
          </Reveal>

          {/* Compact feature list */}
          <Reveal delay={0.2}>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {['All decks', 'Focus engine', 'Rank system', 'Live duels', 'Guilds', 'Analytics', 'Lifetime updates'].map((item, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full border border-white/[0.06] text-white/25 bg-white/[0.015]"
                >
                  {item}
                </span>
              ))}
            </div>
          </Reveal>

          {/* CTA */}
          <Reveal delay={0.25}>
            <button
              onClick={() => setShowAuth(true)}
              className="group relative flex items-center justify-center gap-3 w-full py-4.5 rounded-full font-bold text-sm tracking-[0.12em] uppercase overflow-hidden transition-transform duration-300 hover:scale-[1.03] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, oklch(0.68 0.22 220), oklch(0.48 0.28 240))',
                boxShadow: '0 0 50px oklch(0.5 0.25 220 / 0.3), 0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10">Awaken Your System</span>
              <ArrowRight size={15} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Reveal>

          <Reveal delay={0.3}>
            <p className="mt-4 text-[9px] text-white/10 tracking-[0.25em] font-mono uppercase">
              Secure payment · Instant access
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="py-8 px-6 border-t border-white/[0.03]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: 'radial-gradient(circle at 35% 35%, white, oklch(0.86 0.4 220) 60%, oklch(0.15 0.55 220))' }}
            />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/20 italic">
              Ascend
            </span>
          </div>
          <p className="text-[9px] text-white/10 font-mono tracking-wider">
            © 2025 Ascend. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ─────────── AUTH ─────────── */}
      {showAuth && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center overflow-auto"
        >
          <QuickStart initialPhase={2} onClose={() => setShowAuth(false)} />
        </motion.div>
      )}
    </div>
  );
}
