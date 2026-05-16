import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils.ts';
import { RATING_LABELS, RATING_COLORS, RATING_XP, type Rating } from '@/src/lib/sm2.ts';

interface RatingBarProps {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

const RATINGS: Rating[] = [0, 1, 2, 3];

const BG_CLASSES: Record<Rating, string> = {
  0: 'bg-red-50 border-red-200 hover:bg-red-500 hover:border-red-500 hover:text-white',
  1: 'bg-amber-50 border-amber-200 hover:bg-amber-500 hover:border-amber-500 hover:text-white',
  2: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white',
  3: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-500 hover:border-cyan-500 hover:text-white',
};

export function RatingBar({ onRate, disabled }: RatingBarProps) {
  return (
    <div className="w-full space-y-2">
      <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] text-center">How well did you know this?</p>
      <div className="grid grid-cols-4 gap-2">
        {RATINGS.map((rating, i) => (
          <motion.button
            key={rating}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.95 }}
            disabled={disabled}
            onClick={() => onRate(rating)}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-200 group",
              BG_CLASSES[rating],
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            <span className="text-lg font-black leading-none" style={{ color: RATING_COLORS[rating] }}>
              {['✕', '~', '✓', '★'][rating]}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-800 group-hover:text-white transition-colors">
              {RATING_LABELS[rating]}
            </span>
            <span className="text-[8px] font-bold text-blue-400 group-hover:text-white/70 transition-colors">
              {RATING_XP[rating] > 0 ? `+${RATING_XP[rating]} XP` : 'No XP'}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
