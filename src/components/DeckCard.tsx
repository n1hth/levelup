import { motion } from 'motion/react';
import { BookOpen, Zap, Clock, ChevronRight, Box } from 'lucide-react';
import { cn, formatDuration, getRelativeTime } from '@/src/lib/utils.ts';
import { type Deck } from '@/src/lib/store.tsx';
import { getMasteryColor } from '@/src/lib/sm2.ts';

const DECK_COLORS = [
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-indigo-600',
  'from-orange-400 to-red-500',
  'from-pink-400 to-rose-600',
  'from-yellow-400 to-amber-500',
  'from-blue-400 to-violet-600',
  'from-teal-400 to-cyan-600',
];

export { DECK_COLORS };

interface DeckCardProps {
  deck: Deck;
  stats: { total: number; due: number; mastery: number };
  onClick: () => void;
  index?: number;
}

export function DeckCard({ deck, stats, onClick, index = 0 }: DeckCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      {/* Tilt shadow */}
      <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] -rotate-1 group-hover:rotate-0 transition-transform duration-500" />

      <div className="system-panel p-5 relative z-10 border-white/80 overflow-hidden hover:border-blue-200 transition-all shadow-lg">
        {/* Due badge */}
        {stats.due > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-orange-400 text-white text-[9px] font-black rounded-full shadow-md">
            <Zap size={9} fill="white" />
            {stats.due} DUE
          </div>
        )}

        <div className="flex gap-4 items-start">
          {/* Icon */}
          <div className="relative shrink-0">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
              className={cn(
                'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white border-2 border-white shadow-xl relative',
                deck.color
              )}
            >
              <div className="absolute inset-0 aero-gloss opacity-40 rounded-2xl" />
              <Box size={30} className="drop-shadow-lg relative z-10" />
            </motion.div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-black text-lg text-blue-950 tracking-tight leading-tight truncate mb-0.5">
              {deck.title}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{deck.subject}</span>
              {deck.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[8px] font-black text-blue-300 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            {/* Mastery bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase text-blue-400 tracking-[0.15em]">Mastery</span>
                <span className="text-[10px] font-black text-blue-900">{stats.mastery}%</span>
              </div>
              <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden border border-blue-100/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.mastery}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.08 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${getMasteryColor('reviewing')}, ${getMasteryColor('mastered')})` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[9px] font-black text-blue-400 uppercase tracking-widest">
              <BookOpen size={10} /> {stats.total} cards
            </div>
            {deck.lastStudiedAt && (
              <div className="flex items-center gap-1 text-[9px] font-black text-blue-300 uppercase tracking-widest">
                <Clock size={10} /> {getRelativeTime(deck.lastStudiedAt)}
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-blue-200 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
