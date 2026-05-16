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
      className="group relative cursor-pointer "
      onClick={onClick}
    >
      {/* MOBILE: OLD DESIGN */}
      <div className=" bg-[#0A0C10] border border-white/5 p-8 rounded-[2.5rem] group-hover:bg-white/[0.04] transition-all relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
        
        {stats.due > 0 && (
          <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse italic tracking-widest">
            <Zap size={10} fill="currentColor" />
            {stats.due} DUE
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex gap-6 items-start mb-8">
            <div className={cn(
              'w-16 h-16 rounded-[1.75rem] bg-gradient-to-br flex items-center justify-center text-white border border-white/20 shadow-2xl relative',
              deck.color || DECK_COLORS[0]
            )}>
              <Box size={32} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] relative z-10" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-cyan-400/40 uppercase tracking-[0.4em] italic mb-2 block">{deck.subject || 'GENERAL'}</span>
              <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-none truncate italic">
                {deck.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {deck.tags.map(tag => (
              <span key={tag} className="text-[8px] font-black text-white/20 bg-white/[0.02] border border-white/5 px-3 py-1 rounded-lg uppercase tracking-widest italic">
                {tag}
              </span>
            ))}
          </div>

          <div className="space-y-3 bg-black/40 p-5 rounded-[1.75rem] border border-white/5 shadow-inner mb-8">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] italic mb-1">
              <span className="text-white/20">Mastery</span>
              <span className="text-cyan-400">{stats.mastery}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div className="h-full rounded-full relative" style={{ width: `${stats.mastery}%`, background: `linear-gradient(90deg, ${getMasteryColor('reviewing')}, ${getMasteryColor('mastered')})` }}>
                <div className="absolute inset-0 bg-white/20 blur-[2px]" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">
                <BookOpen size={12} className="text-cyan-400/50" /> {stats.total} Cards
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 shadow-inner">
               <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP: NEW DESIGN */}
      <div className="hidden  bg-[#0A0C10]/60 border border-white/5 p-8 rounded-[2rem] group-hover:bg-white/[0.04] group-hover:border-white/10 transition-all relative overflow-hidden backdrop-blur-xl h-full flex-col justify-between">
        <div>
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
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest italic">{stats.due} Due</span>
               </div>
             ) : (
               <div className="px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-full">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Mastered</span>
               </div>
             )}
          </div>

          <div className="space-y-2 mb-8">
             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic block">{deck.subject || 'GENERAL SUBJECT'}</span>
             <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-none truncate italic group-hover:text-cyan-400 transition-colors">
               {deck.title}
             </h3>
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-4">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${stats.mastery}%` }}
                   className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]" 
                 />
              </div>
              <span className="text-[10px] font-black text-white italic">{stats.mastery}%</span>
           </div>

           <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest italic">
                    <BookOpen size={12} className="opacity-40" /> {stats.total} CARDS
                 </div>
                 {deck.lastStudiedAt && (
                   <div className="flex items-center gap-2 text-[8px] font-black text-white/10 uppercase tracking-widest italic">
                      <Clock size={12} className="opacity-40" /> {getRelativeTime(deck.lastStudiedAt)}
                   </div>
                 )}
              </div>
              
              <ChevronRight size={14} className="text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
