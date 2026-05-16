import { motion } from 'framer-motion';
import { cn } from '@/src/lib/utils.ts';
import { formatTime } from '@/src/lib/utils.ts';
import { Zap } from 'lucide-react';

interface FocusTimerProps {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  isCompleted: boolean;
}

export function FocusTimer({ timeLeft, totalTime, isActive, isCompleted }: FocusTimerProps) {
  const size = 280;
  const strokeWidth = 6;
  const center = size / 2;
  const radius = center - strokeWidth - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const dashOffset = circumference - (circumference * progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Atmospheric glow */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-1000",
        isActive 
          ? "bg-cyan-500/20 blur-[80px] scale-125 opacity-100" 
          : "bg-blue-500/5 blur-[40px] scale-100 opacity-40"
      )} />

      {/* Hex grid background */}
      <div className="absolute inset-[-15%] opacity-[0.06] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <defs>
            <pattern id="hex-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M5 0 L10 2.5 L10 7.5 L5 10 L0 7.5 L0 2.5 Z" fill="none" stroke="#22d3ee" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hex-grid)" />
        </svg>
      </div>

      {/* SVG Ring */}
      <svg 
        className={cn("absolute inset-0 -rotate-90 transition-transform duration-1000", isActive && "scale-105")}
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle 
          cx={center} cy={center} r={radius}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress */}
        <motion.circle 
          cx={center} cy={center} r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          initial={false}
          stroke="url(#timer-gradient)"
          filter={isActive ? "url(#glow)" : "none"}
        />

        {/* Data points */}
        {isActive && [...Array(8)].map((_, i) => (
          <motion.circle
            key={i}
            cx={center + radius * Math.cos((i * 45) * Math.PI / 180)}
            cy={center + radius * Math.sin((i * 45) * Math.PI / 180)}
            r="1"
            fill="#22d3ee"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}

        {/* Decorative inner ring */}
        <circle 
          cx={center} cy={center} r={radius - 12}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.5"
          strokeDasharray="2 6"
        />
      </svg>

      {/* Center Panel */}
      <div className="rounded-full flex flex-col items-center justify-center relative z-10 overflow-hidden bg-white/[0.02] border border-white/5 backdrop-blur-md"
        style={{ width: size - 56, height: size - 56 }}
      >
        {/* Subtle pulse when active */}
        {isActive && (
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full animate-ping bg-cyan-400 rounded-full" style={{ animationDuration: '4s' }} />
          </div>
        )}

        <div className="text-[10px] font-black text-cyan-400/40 uppercase tracking-[0.3em] mb-4">
          {isCompleted ? 'SYNC COMPLETE' : isActive ? 'NEURAL COMPILATION' : 'CYCLE LENGTH'}
        </div>
        
        <span className="text-6xl font-black tracking-tighter tabular-nums text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none">
          {formatTime(timeLeft)}
        </span>
        
        <motion.div 
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "mt-6 flex items-center gap-2 px-5 py-2 rounded-xl border transition-all duration-500",
            isActive 
              ? "bg-white/5 border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
              : isCompleted 
                ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-white/[0.02] border-white/5"
          )}
        >
          <Zap className={cn(
            "h-3 w-3 transition-all",
            isActive ? "text-cyan-400 animate-pulse drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" : isCompleted ? "text-emerald-400" : "text-white/20"
          )} />
          <span className={cn(
            "text-[9px] uppercase font-black tracking-[0.4em] italic",
            isActive ? "text-white" : isCompleted ? "text-emerald-400" : "text-white/30"
          )}>
            {isCompleted ? 'TRANSFERRED' : isActive ? 'SYNCING' : 'IDLE'}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
