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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-[#0A0C10]/60 border border-white/5 p-8 rounded-[2rem] group-hover:bg-white/[0.04] group-hover:border-white/10 transition-all relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-start justify-between mb-8">
           <div className={cn(
             'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white border border-white/10 shadow-2xl relative group-hover:scale-105 transition-transform duration-500',
             deck.color || DECK_COLORS[0]
           )}>
             <Box size={28} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] relative z-10" />
           </div>

           {stats.due > 0 ? (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">{stats.due} Fragments</span>
             </div>
           ) : (
             <div className="px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-full">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Optimized</span>
             </div>
           )}
        </div>

        <div className="space-y-2 mb-8">
           <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic block">{deck.subject || 'GENERAL ARCHIVE'}</span>
           <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-none truncate italic group-hover:text-cyan-400 transition-colors">
             {deck.title}
           </h3>
        </div>

        <div className="space-y-4">
           {/* Mastery Strip */}
           <div className="flex items-center gap-4">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${stats.mastery}%` }}
                   className="h-full bg-cyan-400" 
                 />
              </div>
              <span className="text-[10px] font-black text-white italic">{stats.mastery}%</span>
           </div>

           <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest italic">
                    <BookOpen size={12} /> {stats.total} SLICES
                 </div>
                 {deck.lastStudiedAt && (
                   <div className="flex items-center gap-2 text-[8px] font-black text-white/10 uppercase tracking-widest italic">
                      <Clock size={12} /> {getRelativeTime(deck.lastStudiedAt)}
                   </div>
                 )}
              </div>
              
              <ChevronRight size={16} className="text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
