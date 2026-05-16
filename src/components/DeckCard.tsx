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
      className="group relative cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="bg-[#0A0C10] border border-white/5 p-8 h-full rounded-[2.5rem] group-hover:bg-white/[0.04] transition-all relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
        
        {/* Due badge */}
        {stats.due > 0 && (
          <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse italic tracking-widest">
            <Zap size={10} fill="currentColor" />
            {stats.due} DUE
          </div>
        )}

        <div className="flex flex-col h-full">
          <div className="flex gap-6 items-start mb-8">
            {/* Icon */}
            <div className="relative shrink-0">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
                className={cn(
                  'w-16 h-16 rounded-[1.75rem] bg-gradient-to-br flex items-center justify-center text-white border border-white/20 shadow-2xl relative group-hover:scale-105 transition-transform duration-500',
                  deck.color || DECK_COLORS[0]
                )}
              >
                <div className="absolute inset-0 bg-black/10 rounded-[1.75rem]" />
                <div className="absolute -inset-4 bg-inherit opacity-20 blur-2xl group-hover:opacity-40 transition-opacity" />
                <Box size={32} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] relative z-10" />
              </motion.div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-cyan-400/40 uppercase tracking-[0.4em] italic mb-2 block">{deck.subject || 'GENERAL'}</span>
              <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-none truncate italic group-hover:text-cyan-400 transition-colors">
                {deck.title}
              </h3>
            </div>
          </div>

          <div className="flex-1">
             <div className="flex flex-wrap gap-2 mb-8">
                {deck.tags.map(tag => (
                  <span key={tag} className="text-[8px] font-black text-white/20 bg-white/[0.02] border border-white/5 px-3 py-1 rounded-lg uppercase tracking-widest italic group-hover:border-white/10 transition-all">
                    {tag}
                  </span>
                ))}
             </div>

             {/* Mastery bar */}
             <div className="space-y-3 bg-black/40 p-5 rounded-[1.75rem] border border-white/5 shadow-inner">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] italic mb-1">
                  <span className="text-white/20">Archive Stability</span>
                  <span className="text-cyan-400">{stats.mastery}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-[1px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.mastery}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                    className="h-full rounded-full relative"
                    style={{ background: `linear-gradient(90deg, ${getMasteryColor('reviewing')}, ${getMasteryColor('mastered')})` }}
                  >
                    <div className="absolute inset-0 bg-white/20 blur-[2px]" />
                  </motion.div>
                </div>
             </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">
                <BookOpen size={12} className="text-cyan-400/50" /> {stats.total} Slices
              </div>
              {deck.lastStudiedAt && (
                <div className="hidden sm:flex items-center gap-2 text-[9px] font-black text-white/10 uppercase tracking-widest italic">
                  <Clock size={12} /> {getRelativeTime(deck.lastStudiedAt)}
                </div>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 group-hover:bg-white group-hover:text-black transition-all shadow-inner">
               <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
