import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { Zap, ChevronDown } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// PARTICLE SYSTEM — Canvas-based for buttery 60fps performance
// ═══════════════════════════════════════════════════════════
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
}

function useParticleCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mouseRef: React.RefObject<{ x: number; y: number }>,
  scrollProgress: number
) {
  const particles = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 0 : 80; // Disable particles completely on mobile for smoothness

    // Seed initial particles
    for (let i = 0; i < particleCount; i++) {
      particles.current.push(createParticle(canvas.width, canvas.height));
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw subtle connecting lines between nearby particles
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const dx = particles.current[i].x - particles.current[j].x;
          const dy = particles.current[i].y - particles.current[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.03 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles.current[i].x, particles.current[i].y);
            ctx.lineTo(particles.current[j].x, particles.current[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.current.forEach((p, idx) => {
        // Gentle drift toward center orb area
        const toCenterX = (cx - p.x) * 0.0003;
        const toCenterY = (cy - p.y) * 0.0003;

        // Mouse repulsion
        if (mouse) {
          const dmx = p.x - mouse.x;
          const dmy = p.y - mouse.y;
          const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy);
          if (mouseDist < 150) {
            const force = (150 - mouseDist) / 150 * 0.8;
            p.vx += (dmx / mouseDist) * force;
            p.vy += (dmy / mouseDist) * force;
          }
        }

        p.vx += toCenterX;
        p.vy += toCenterY;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio * p.opacity;

        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 70%, 0)`);
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 85%, ${alpha})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Recycle dead particles
        if (p.life <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) {
          particles.current[idx] = createParticle(canvas.width, canvas.height);
        }
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, mouseRef]);
}

function createParticle(w: number, h: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.2 + Math.random() * 0.3;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 0.5 + Math.random() * 1.5,
    opacity: 0.1 + Math.random() * 0.3,
    life: 300 + Math.random() * 500,
    maxLife: 300 + Math.random() * 500,
    hue: 190 + Math.random() * 30, // Cyan-blue range
  };
}

// ═══════════════════════════════════════════════════════════
// TYPEWRITER HOOK — Character-by-character text reveal
// ═══════════════════════════════════════════════════════════
function useTypewriter(text: string, speed: number = 40, delay: number = 0) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, started]);

  return { displayed, done };
}

// ═══════════════════════════════════════════════════════════
// FEATURE DATA
// ═══════════════════════════════════════════════════════════
const FEATURES = [
  {
    title: "EVOLUTIONARY DECKS",
    subtitle: "SM-2 Spaced Repetition",
    description: "Cards that evolve with your memory. Each review strengthens neural pathways, automatically scheduling the next wave at the optimal forgetting threshold.",
    icon: "◇",
    stat: "94% retention rate"
  },
  {
    title: "DEEP FOCUS PULSE",
    subtitle: "Cognitive Restriction Matrix",
    description: "Ambient breathing cycles dim the noise. Adaptive awareness checks monitor your flow state, building an unbreakable focus ritual.",
    icon: "◈",
    stat: "2.3x productivity"
  },
  {
    title: "XP & RANK SYSTEM",
    subtitle: "Dopamine Feedback Loop",
    description: "Every session feeds your progression. Ascend through hunter tiers — each rank evolution transforms your orb, making growth visible and addictive.",
    icon: "⬡",
    stat: "7 rank tiers"
  },
  {
    title: "ARENA DUELS",
    subtitle: "Real-Time Matchmaking",
    description: "Challenge friends or strangers. Race through flashcard grids under pressure. Your recall speed is your weapon — accuracy is your armor.",
    icon: "⚔",
    stat: "Live PvP"
  },
  {
    title: "NEURAL SYNDICATES",
    subtitle: "Study Guild Networks",
    description: "Assemble your squad. Coordinate focus lobbies, share decks, climb guild leaderboards. Studying alone is optional — winning together is inevitable.",
    icon: "⬢",
    stat: "Guild rankings"
  },
];

// ═══════════════════════════════════════════════════════════
// MAIN LANDING COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // Mouse tracking for parallax + particle interaction
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      mouseX.set((e.clientX - window.innerWidth / 2) / window.innerWidth);
      mouseY.set((e.clientY - window.innerHeight / 2) / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Scroll tracking
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [scrollProg, setScrollProg] = useState(0);

  useEffect(() => {
    return scrollYProgress.on('change', (v) => setScrollProg(v));
  }, [scrollYProgress]);

  // Initialize particle system
  useParticleCanvas(canvasRef, mouseRef, scrollProg);

  // Typewriter for the orb's greeting
  const { displayed: greeting, done: greetingDone } = useTypewriter(
    "Greetings, Hunter. Your neural core is dormant. Ready to awaken it?",
    35,
    2000
  );

  // Derive active feature index from scroll
  const activeFeature = useMemo(() => {
    if (scrollProg < 0.12) return -1; // Hero section
    if (scrollProg >= 0.85) return 5; // Pricing section
    return Math.min(Math.floor((scrollProg - 0.12) / 0.146), 4);
  }, [scrollProg]);

  // Orb visual transforms based on scroll
  const orbScale = useTransform(scrollYProgress, [0, 0.1, 0.12, 0.85, 0.92], [1, 1, 0.45, 0.45, 0.6]);
  const orbY = useTransform(scrollYProgress, [0, 0.1, 0.12, 0.85, 0.92], ['0%', '0%', '110%', '110%', '0%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const pricingOpacity = useTransform(scrollYProgress, [0.88, 0.93], [0, 1]);

  // Parallax orb rotation from mouse
  const orbRotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const orbRotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);

  return (
    <div ref={containerRef} className="relative bg-[#020208] text-white font-sans select-none" style={{ height: '525dvh' }}>

      {/* Canvas particle layer — fixed behind everything */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{ opacity: 0.7 }}
      />

      {/* Ambient depth fog */}
      <div className="fixed inset-0 z-[2] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#020208] via-transparent to-[#020208] opacity-60" />
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] md:blur-[200px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, oklch(0.3 0.15 220) 0%, transparent 70%)',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animationDuration: '6s',
            willChange: 'transform'
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* THE ORB — The living soul of the entire page       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-[10] pointer-events-none flex items-center justify-center">
        <motion.div
          style={{
            scale: orbScale,
            y: orbY,
            rotateX: orbRotateX,
            rotateY: orbRotateY,
            perspective: 800,
          }}
          className="relative"
        >
          {/* Outer aura field */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-20 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, oklch(0.76 0.25 220 / 0.3) 0%, transparent 70%)',
            }}
          />

          {/* Orbital ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-6 border border-white/[0.06] rounded-full border-dashed pointer-events-none"
          />

          {/* Second orbital ring — counter-rotating */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-12 border border-cyan-400/[0.04] rounded-full pointer-events-none"
            style={{ borderStyle: 'dotted' }}
          />

          {/* Main orb sphere — exact visual DNA from Orb.tsx transcendent rank */}
          <motion.div
            animate={{
              scale: [1, 1.03, 0.97, 1.03, 1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[200px] h-[200px] rounded-full relative overflow-hidden cursor-pointer pointer-events-auto"
            style={{
              background: 'radial-gradient(circle at 35% 35%, white 0%, oklch(0.98 0.05 220) 30%, oklch(0.86 0.4 220) 60%, oklch(0.1 0.6 220) 100%)',
              boxShadow: '0 0 80px oklch(0.76 0.25 220 / 0.5), 0 0 200px oklch(0.6 0.3 220 / 0.2)',
            }}
            onClick={() => {
              if (scrollProg < 0.1) {
                window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
              }
            }}
          >
            {/* Animated internal light sweep */}
            <motion.div
              animate={{
                background: [
                  'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                  'radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 0%, transparent 60%)',
                  'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none opacity-60"
            />

            {/* 3D depth — inner shadow */}
            <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.35)] rounded-full pointer-events-none z-10" />

            {/* Specular highlight — top-left glare */}
            <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[3px] -rotate-[35deg] z-10 pointer-events-none" />

            {/* Inner halo ring */}
            <div className="absolute -inset-2 border border-white/20 rounded-full blur-[1px] animate-pulse pointer-events-none" />

            {/* Cosmic particle field around orb */}
            <div className="absolute inset-[-40px] pointer-events-none z-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={`p-${i}`}
                  animate={{
                    x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100],
                    y: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100],
                    opacity: [0, 0.6, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                />
              ))}
            </div>

            {/* Left wing aura fragment */}
            <motion.div
              animate={{
                rotate: [-5, 5, -5],
                opacity: [0.3, 0.6, 0.3],
                x: [-5, -8, -5]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-transparent to-white/20 blur-[8px] rounded-l-full pointer-events-none"
              style={{ transformOrigin: 'right center' }}
            />

            {/* Right wing aura fragment */}
            <motion.div
              animate={{
                rotate: [5, -5, 5],
                opacity: [0.3, 0.6, 0.3],
                x: [5, 8, 5]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-l from-transparent to-white/20 blur-[8px] rounded-r-full pointer-events-none"
              style={{ transformOrigin: 'left center' }}
            />

            {/* Rising energy shards */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`s-${i}`}
                animate={{
                  y: [-15, -45, -15],
                  opacity: [0, 0.8, 0],
                  scale: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
                className="absolute w-1 h-3 bg-white blur-[0.5px] pointer-events-none"
                style={{
                  left: `${15 + i * 10}%`,
                  top: `${30 + (i % 2) * 20}%`,
                  boxShadow: '0 0 10px white'
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* HERO SECTION — Title + Typewriter greeting         */}
      {/* ═══════════════════════════════════════════════════ */}
      <motion.div
        style={{ opacity: heroOpacity }}
        className="fixed inset-0 z-[15] pointer-events-none flex flex-col items-center justify-between py-16"
      >
        {/* Top — Brand */}
        <div className="text-center space-y-3 mt-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-6xl sm:text-8xl font-black italic tracking-[-0.04em] uppercase leading-none"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/20">
              LEVEL
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-600">
              UP
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8 }}
            className="text-[9px] font-black tracking-[0.6em] text-white uppercase"
          >
            NEURAL STUDY OPERATING SYSTEM
          </motion.p>
        </div>

        {/* Center spacer — orb lives here visually */}
        <div className="flex-1" />

        {/* Bottom — Typewriter message from the orb */}
        <div className="w-full max-w-lg px-8 mb-8">
          <AnimatePresence>
            {greeting && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                {/* Speech bubble */}
                <div className="relative px-6 py-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
                  {/* Subtle top shine */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

                  <p className="text-sm sm:text-base font-medium text-white/80 leading-relaxed tracking-wide italic">
                    "{greeting}
                    {!greetingDone && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-cyan-400"
                      >
                        |
                      </motion.span>
                    )}
                    {greetingDone && '"'}
                  </p>

                  {/* Upward arrow pointing to orb */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 border-l border-t border-white/[0.08] bg-white/[0.03] rotate-45 backdrop-blur-xl" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll prompt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 5 }}
            className="flex flex-col items-center mt-8 gap-1 pointer-events-auto cursor-pointer"
            onClick={() => window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' })}
          >
            <span className="text-[8px] font-black tracking-[0.5em] uppercase">Scroll to awaken</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown size={14} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* FEATURE SECTIONS — Holographic glass panels         */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-[12] pointer-events-none flex items-center justify-center">
        <AnimatePresence mode="wait">
          {activeFeature >= 0 && activeFeature < 5 && (
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 80, rotateY: -15, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, x: -80, rotateY: 15, scale: 0.92 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg mx-6 pointer-events-auto"
              style={{ perspective: 1000, willChange: 'transform, opacity' }}
            >
              <div className="relative p-8 md:p-10 rounded-3xl border border-white/[0.06] bg-[#0a0b12]/90 md:bg-white/[0.02] backdrop-blur-sm md:backdrop-blur-xl overflow-hidden">
                {/* Top shimmer line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                {/* Bottom shimmer line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                {/* Ambient card glow */}
                <div
                  className="absolute -inset-10 rounded-full blur-[60px] md:blur-[80px] pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, oklch(0.5 0.2 220 / 0.15) 0%, transparent 70%)',
                  }}
                />

                {/* Feature number */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl opacity-20">{FEATURES[activeFeature].icon}</span>
                  <div>
                    <div className="text-[8px] font-black tracking-[0.5em] text-cyan-400/60 uppercase">
                      MODULE {String(activeFeature + 1).padStart(2, '0')} / 05
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black italic tracking-tight text-white uppercase mt-1">
                      {FEATURES[activeFeature].title}
                    </h3>
                  </div>
                </div>

                {/* Subtitle tag */}
                <div className="inline-block px-3 py-1 rounded-full border border-cyan-400/15 bg-cyan-400/[0.04] mb-4">
                  <span className="text-[9px] font-black tracking-[0.3em] text-cyan-400 uppercase">
                    {FEATURES[activeFeature].subtitle}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  {FEATURES[activeFeature].description}
                </p>

                {/* Stat badge */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
                    {FEATURES[activeFeature].stat}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature progress indicator — minimal dots */}
      <AnimatePresence>
        {activeFeature >= 0 && activeFeature < 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-[20] flex flex-col gap-3"
          >
            {FEATURES.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: i === activeFeature ? 24 : 6,
                  opacity: i === activeFeature ? 1 : 0.2,
                  backgroundColor: i === activeFeature ? 'oklch(0.76 0.25 220)' : 'white',
                }}
                className="w-1 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════ */}
      {/* PRICING SECTION — Final reveal                     */}
      {/* ═══════════════════════════════════════════════════ */}
      <motion.div
        style={{ opacity: pricingOpacity }}
        className="fixed inset-0 z-[14] pointer-events-none flex items-center justify-center px-6"
      >
        <motion.div
          initial={false}
          animate={activeFeature === 5 ? { scale: 1, y: 0 } : { scale: 0.9, y: 40 }}
          className="w-full max-w-md pointer-events-auto"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="relative p-10 rounded-3xl border border-cyan-400/20 bg-[#060a12]/95 md:bg-[#060a12]/90 backdrop-blur-sm md:backdrop-blur-xl overflow-hidden">
            {/* Top shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            {/* Ambient glow */}
            <div className="absolute -inset-20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle, oklch(0.5 0.3 220 / 0.2) 0%, transparent 70%)' }} />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              {/* Badge */}
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" />
                <span className="text-[8px] font-black tracking-[0.5em] text-cyan-400 uppercase">
                  Lifetime Neural License
                </span>
              </div>

              {/* Title */}
              <h3 className="text-3xl md:text-4xl font-black italic tracking-tight text-white uppercase">
                Awaken Access
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-500">
                  $10
                </span>
                <span className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase ml-1">
                  once, forever
                </span>
              </div>

              {/* Divider */}
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

              {/* Features list */}
              <div className="space-y-2 text-left w-full">
                {['Unlimited evolutionary decks', 'Deep focus pulse engine', 'All rank evolutions', 'Live arena matchmaking', 'Guild syndicate networks'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-cyan-400/60" />
                    <span className="text-xs text-white/40 tracking-wide">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowAuth(true)}
                className="w-full py-4 rounded-2xl font-black text-sm tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.7 0.25 220) 0%, oklch(0.5 0.3 220) 100%)',
                  boxShadow: '0 0 40px oklch(0.6 0.3 220 / 0.4)',
                }}
              >
                {/* Button shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative z-10 text-white">Awaken Neural System</span>
              </button>

              <p className="text-[8px] font-mono text-white/15 tracking-[0.3em]">
                SECURE PAYMENT BRIDGE • 256-BIT ENCRYPTED
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll sections — invisible spacers that drive the timeline */}
      <div className="relative z-0">
        {/* Hero spacer */}
        <div className="h-[75dvh]" />
        {/* Feature spacers */}
        {FEATURES.map((_, i) => (
          <div key={i} className="h-[75dvh]" />
        ))}
        {/* Pricing spacer */}
        <div className="h-[75dvh]" />
      </div>

      {/* Auth overlay */}
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
