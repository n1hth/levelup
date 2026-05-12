import { motion } from 'motion/react';
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
          ? "bg-blue-500/15 blur-[60px] scale-125 opacity-100" 
          : "bg-blue-500/5 blur-[40px] scale-100 opacity-40"
      )} />

      {/* Hex grid background */}
      <div className="absolute inset-[-15%] opacity-[0.06] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <defs>
            <pattern id="hex-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M5 0 L10 2.5 L10 7.5 L5 10 L0 7.5 L0 2.5 Z" fill="none" stroke="#2563eb" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hex-grid)" />
        </svg>
      </div>

      {/* SVG Ring */}
      <svg 
        className={cn("absolute inset-0 -rotate-90", isActive && "timer-ring-active")}
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle 
          cx={center} cy={center} r={radius}
          className="timer-ring-track"
        />

        {/* Progress */}
        <motion.circle 
          cx={center} cy={center} r={radius}
          className="timer-ring-progress"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          initial={false}
        />

        {/* Decorative inner ring */}
        <circle 
          cx={center} cy={center} r={radius - 16}
          fill="none"
          stroke="rgba(59, 130, 246, 0.06)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
      </svg>

      {/* Center Panel */}
      <div className="system-panel aero-gloss rounded-full flex flex-col items-center justify-center relative z-10 overflow-hidden"
        style={{ width: size - 56, height: size - 56 }}
      >
        {/* Subtle pulse when active */}
        {isActive && (
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full animate-ping bg-blue-400 rounded-full" style={{ animationDuration: '4s' }} />
          </div>
        )}

        <div className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-3">
          {isCompleted ? 'Complete' : isActive ? 'Core Density' : 'Duration'}
        </div>
        
        <span className="text-6xl font-black tracking-tighter tabular-nums text-blue-900 drop-shadow-sm leading-none">
          {formatTime(timeLeft)}
        </span>
        
        <motion.div 
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "mt-5 flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all duration-500",
            isActive 
              ? "bg-blue-900 border-blue-800 shadow-xl" 
              : isCompleted 
                ? "bg-emerald-500 border-emerald-400 shadow-xl"
                : "bg-blue-100 border-blue-200"
          )}
        >
          <Zap className={cn(
            "h-3 w-3 transition-all",
            isActive ? "text-cyan-400 animate-pulse" : isCompleted ? "text-white" : "text-blue-400 opacity-40"
          )} />
          <span className={cn(
            "text-[9px] uppercase font-black tracking-[0.3em]",
            isActive ? "text-white" : isCompleted ? "text-white" : "text-blue-500"
          )}>
            {isCompleted ? 'Synchronized' : isActive ? 'Synchronizing' : 'Stable'}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
