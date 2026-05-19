import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { QuickStart } from '@/src/components/QuickStart';
import { Zap, ArrowRight, Star, Trophy, Swords, Users, Brain, Timer, Layers, Target, Shield, Flame } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// REVEAL WRAPPER — Fade-in on scroll into view
// ═══════════════════════════════════════════════════════════
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION LABEL — Consistent section headers
// ═══════════════════════════════════════════════════════════
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
      <span className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-cyan-400 uppercase">
        {children}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ANIMATED COUNTER — Count up on view
// ═══════════════════════════════════════════════════════════
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════
// FEATURE DATA
// ═══════════════════════════════════════════════════════════
const BENTO_FEATURES = [
  {
    title: 'Evolutionary Decks',
    description: 'SM-2 spaced repetition that adapts to your memory. Cards resurface at the exact moment before you forget.',
    icon: Layers,
    span: 'col-span-1 md:col-span-2',
    accent: 'from-cyan-500/20 to-blue-600/20',
  },
  {
    title: 'Deep Focus',
    description: 'Ambient breathing cycles and adaptive awareness checks that build an unbreakable flow state.',
    icon: Timer,
    span: 'col-span-1',
    accent: 'from-violet-500/20 to-purple-600/20',
  },
  {
    title: 'XP & Rank System',
    description: 'Every session feeds your progression. Ascend through hunter tiers — each rank transforms your orb.',
    icon: Trophy,
    span: 'col-span-1',
    accent: 'from-amber-500/20 to-orange-600/20',
  },
  {
    title: 'Arena Duels',
    description: 'Challenge friends in real-time flashcard battles. Your recall speed is your weapon, accuracy is your armor.',
    icon: Swords,
    span: 'col-span-1 md:col-span-2',
    accent: 'from-rose-500/20 to-red-600/20',
  },
  {
    title: 'Study Guilds',
    description: 'Assemble your squad. Share decks, coordinate focus sessions, and climb guild leaderboards together.',
    icon: Users,
    span: 'col-span-1',
    accent: 'from-emerald-500/20 to-green-600/20',
  },
  {
    title: 'Neural Analytics',
    description: 'Track retention curves, session streaks, and cognitive performance with precision dashboards.',
    icon: Brain,
    span: 'col-span-1',
    accent: 'from-sky-500/20 to-cyan-600/20',
  },
];

const STATS = [
  { value: 94, suffix: '%', label: 'Avg. Retention Rate' },
  { value: 2847, suffix: '+', label: 'Active Hunters' },
  { value: 12, suffix: 'M+', label: 'Cards Reviewed' },
  { value: 4.9, suffix: '★', label: 'User Rating' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Decks',
    description: 'Import or build flashcard decks for any subject. Our AI assists with card generation and optimization.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Enter Focus Mode',
    description: 'Launch deep study sessions with ambient timers, breathing cues, and distraction shields.',
    icon: Shield,
  },
  {
    step: '03',
    title: 'Level Up & Compete',
    description: 'Earn XP, climb ranks, challenge friends to duels, and watch your orb evolve with your knowledge.',
    icon: Flame,
  },
];

// ═══════════════════════════════════════════════════════════
// MAIN LANDING
// ═══════════════════════════════════════════════════════════
export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-[#020208] text-white font-sans antialiased overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════ */}
      {/* NAVBAR                                                  */}
      {/* ════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Mini orb logo */}
            <div
              className="w-7 h-7 rounded-full flex-shrink-0"
              style={{
                background: 'radial-gradient(circle at 35% 35%, white 0%, oklch(0.86 0.4 220) 60%, oklch(0.1 0.6 220) 100%)',
                boxShadow: '0 0 20px oklch(0.6 0.3 220 / 0.4)',
              }}
            />
            <span className="text-sm font-black tracking-wider uppercase italic">
              Level<span className="text-cyan-400">Up</span>
            </span>
          </div>

          <button
            onClick={() => setShowAuth(true)}
            className="text-xs font-bold tracking-wider uppercase px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-colors duration-200"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — HERO                                        */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full"
            style={{
              background: 'radial-gradient(circle, oklch(0.25 0.15 220 / 0.5) 0%, transparent 65%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* The Orb — hero size */}
          <Reveal>
            <motion.div
              animate={{ scale: [1, 1.04, 1], rotate: [0, 1, -1, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full relative mb-10"
              style={{
                background: 'radial-gradient(circle at 35% 35%, white 0%, oklch(0.98 0.05 220) 30%, oklch(0.86 0.4 220) 60%, oklch(0.1 0.6 220) 100%)',
                boxShadow: '0 0 80px oklch(0.76 0.25 220 / 0.5), 0 0 200px oklch(0.6 0.3 220 / 0.15)',
              }}
            >
              {/* Specular highlight */}
              <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[3px] -rotate-[35deg]" />
              {/* Inner shadow for 3D depth */}
              <div className="absolute inset-0 rounded-full shadow-[inset_0_-10px_20px_rgba(0,0,0,0.35)]" />
            </motion.div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={0.1}>
            <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-black italic tracking-[-0.03em] leading-[0.95] mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                Study Like Your
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500">
                Life Depends On It
              </span>
            </h1>
          </Reveal>

          {/* Subheadline */}
          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg md:text-xl text-white/40 max-w-xl leading-relaxed mb-10">
              The gamified study system that turns focus into power, knowledge into XP, and
              every session into a rank-climbing obsession.
            </p>
          </Reveal>

          {/* CTA Row */}
          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => setShowAuth(true)}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:scale-[1.03] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.7 0.25 220) 0%, oklch(0.5 0.3 220) 100%)',
                  boxShadow: '0 0 40px oklch(0.6 0.3 220 / 0.3), 0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <span>Start Your Awakening</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <span className="text-xs text-white/25 font-medium tracking-wide">
                $10 one-time • Lifetime access
              </span>
            </div>
          </Reveal>

          {/* Social proof strip */}
          <Reveal delay={0.5}>
            <div className="mt-14 flex items-center gap-4">
              {/* Stacked avatars */}
              <div className="flex -space-x-2.5">
                {['🧠', '⚡', '🎯', '🔥'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#020208] bg-white/[0.06] flex items-center justify-center text-xs"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-white/30 font-medium">
                  Loved by 2,800+ hunters worldwide
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020208] to-transparent pointer-events-none" />
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — STATS BAR                                   */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="relative py-16 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STATS.map((stat, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight text-white mb-1">
                  {typeof stat.value === 'number' && stat.value > 10
                    ? <Counter target={stat.value} suffix={stat.suffix} />
                    : <>{stat.value}{stat.suffix}</>
                  }
                </div>
                <div className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-white/25 uppercase">
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — THE PROBLEM                                 */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <SectionLabel>The Problem</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-[1.1] mb-8">
              <span className="text-white/90">Traditional studying is </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">
                boring, lonely, and forgettable.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { emoji: '😴', problem: 'You re-read the same notes and forget everything by exam day.' },
                { emoji: '📱', problem: 'Your phone steals your focus every 5 minutes. You never get deep.' },
                { emoji: '😐', problem: 'There\'s no reward, no progress bar, no reason to keep going.' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015]"
                >
                  <span className="text-2xl mb-3 block">{item.emoji}</span>
                  <p className="text-sm text-white/40 leading-relaxed">{item.problem}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-10 text-lg sm:text-xl font-semibold text-white/60 max-w-2xl">
              We built LevelUp to make studying feel like the most addictive game you've ever played.
              <span className="text-cyan-400"> Every session matters. Every card counts.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — PRODUCT SHOWCASE (Bento Grid)               */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionLabel>The System</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-[1.1] mb-4">
              Everything you need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400"> dominate.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-base text-white/30 mb-14 max-w-xl">
              Six interconnected systems designed to make knowledge acquisition feel like a progression RPG.
            </p>
          </Reveal>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BENTO_FEATURES.map((feature, i) => (
              <Reveal key={i} delay={i * 0.08} className={feature.span}>
                <div className="group relative h-full p-7 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all duration-500 overflow-hidden">
                  {/* Hover glow */}
                  <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`} />

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-white/[0.12] transition-colors">
                    <feature.icon size={18} className="text-white/50 group-hover:text-cyan-400 transition-colors" />
                  </div>

                  {/* Text */}
                  <h3 className="text-lg font-bold text-white/90 mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{feature.description}</p>

                  {/* Product screenshot placeholder */}
                  {(feature.span.includes('col-span-2') || i === 0) && (
                    <div className="mt-6 w-full h-40 md:h-48 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] flex items-center justify-center">
                      <span className="text-[10px] font-bold tracking-[0.3em] text-white/15 uppercase">Product Screenshot</span>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 5 — HOW IT WORKS                                */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionLabel>How It Works</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-[1.1] mb-16">
              Three steps to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400"> neural dominance.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="relative">
                  {/* Connector line (desktop only) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[calc(100%+4px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-white/10 to-transparent" />
                  )}

                  {/* Step number */}
                  <div className="text-6xl md:text-7xl font-black italic text-white/[0.04] leading-none mb-4 tracking-tight">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
                    <item.icon size={20} className="text-cyan-400/80" />
                  </div>

                  <h3 className="text-xl font-bold text-white/90 mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 6 — PRODUCT PREVIEW                             */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <SectionLabel>See It In Action</SectionLabel>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-[1.1]">
                Built for hunters who
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400"> mean business.</span>
              </h2>
            </div>
          </Reveal>

          {/* Large product screenshot placeholder */}
          <Reveal delay={0.15}>
            <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-md bg-white/[0.03] flex items-center justify-center">
                  <span className="text-[9px] font-mono text-white/15 tracking-wider">levelup.app</span>
                </div>
              </div>

              {/* Screenshot area */}
              <div className="w-full aspect-[16/9] flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, white 0%, oklch(0.86 0.4 220) 60%, oklch(0.1 0.6 220) 100%)',
                      boxShadow: '0 0 40px oklch(0.6 0.3 220 / 0.3)',
                    }}
                  />
                  <span className="text-[11px] font-bold tracking-[0.3em] text-white/15 uppercase">App Screenshots Coming Soon</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 7 — PRICING                                     */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 border-t border-white/[0.04]">
        <div className="max-w-xl mx-auto text-center">
          <Reveal>
            <SectionLabel>Pricing</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-[1.1] mb-4">
              One price.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400"> Forever.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-base text-white/30 mb-12">
              No subscriptions. No hidden fees. Pay once and own the entire neural system for life.
            </p>
          </Reveal>

          {/* Pricing Card */}
          <Reveal delay={0.2}>
            <div className="relative p-10 md:p-12 rounded-3xl border border-cyan-400/15 bg-white/[0.015] overflow-hidden">
              {/* Top shimmer */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

              {/* Ambient glow behind card */}
              <div
                className="absolute -inset-20 -z-10 rounded-full blur-[100px] opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(circle, oklch(0.4 0.2 220) 0%, transparent 70%)' }}
              />

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/15 bg-cyan-400/[0.05] mb-8">
                <Zap size={12} className="text-cyan-400" />
                <span className="text-[9px] font-black tracking-[0.4em] text-cyan-400 uppercase">Lifetime Access</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-7xl md:text-8xl font-black italic tracking-tighter text-white">
                  $10
                </span>
              </div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/20 uppercase mb-10">
                One-time payment • No recurring fees
              </p>

              {/* Feature checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10">
                {[
                  'Unlimited flashcard decks',
                  'Deep focus engine',
                  'All 7 rank evolutions',
                  'Real-time arena duels',
                  'Guild & social features',
                  'Neural analytics dashboard',
                  'Priority feature requests',
                  'Lifetime updates',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-sm text-white/45">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowAuth(true)}
                className="group w-full flex items-center justify-center gap-3 py-4.5 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.7 0.25 220) 0%, oklch(0.5 0.3 220) 100%)',
                  boxShadow: '0 0 40px oklch(0.6 0.3 220 / 0.3)',
                }}
              >
                <span>Awaken Your Neural System</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>

              <p className="mt-4 text-[9px] font-mono text-white/15 tracking-[0.2em]">
                SECURE 256-BIT ENCRYPTED PAYMENT
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* SECTION 8 — FINAL CTA                                   */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            {/* Small orb */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full mx-auto mb-10"
              style={{
                background: 'radial-gradient(circle at 35% 35%, white 0%, oklch(0.86 0.4 220) 60%, oklch(0.1 0.6 220) 100%)',
                boxShadow: '0 0 60px oklch(0.6 0.3 220 / 0.3)',
              }}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-[1.1] mb-6">
              Ready to stop studying
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                and start leveling up?
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-base text-white/30 mb-10 max-w-md mx-auto">
              Join thousands of hunters who've turned their study grind into an addictive progression system.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <button
              onClick={() => setShowAuth(true)}
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-base tracking-wider uppercase transition-all duration-300 hover:scale-[1.03] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, oklch(0.7 0.25 220) 0%, oklch(0.5 0.3 220) 100%)',
                boxShadow: '0 0 50px oklch(0.6 0.3 220 / 0.35), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <span>Get Lifetime Access — $10</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                  */}
      {/* ════════════════════════════════════════════════════════ */}
      <footer className="py-10 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 35%, white 0%, oklch(0.86 0.4 220) 60%, oklch(0.1 0.6 220) 100%)',
              }}
            />
            <span className="text-xs font-bold tracking-wider uppercase text-white/30 italic">
              Level<span className="text-cyan-400/50">Up</span>
            </span>
          </div>
          <p className="text-[10px] text-white/15 font-mono tracking-wider">
            © 2025 LevelUp Neural Systems. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════ */}
      {/* AUTH OVERLAY                                             */}
      {/* ════════════════════════════════════════════════════════ */}
      {showAuth && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] overflow-auto bg-black/95 flex items-center justify-center"
        >
          <QuickStart initialPhase={2} onClose={() => setShowAuth(false)} />
        </motion.div>
      )}
    </div>
  );
}
