import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils.ts';
import { type Card } from '@/src/lib/store.tsx';
import { getMasteryColor, getMasteryLabel } from '@/src/lib/sm2.ts';
import { RotateCcw } from 'lucide-react';

interface FlashCardProps {
  card: Card;
  onFlip?: () => void;
}

export function FlashCard({ card, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(f => !f);
    if (!isFlipped) onFlip?.();
  };

  return (
    <div
      className="w-full cursor-pointer select-none group"
      style={{ perspective: '2000px', minHeight: '380px' }}
      onClick={handleFlip}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%', minHeight: '380px' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 system-panel p-12 flex flex-col items-center justify-center text-center modular-card !bg-white/[0.03]"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Card Accent lines */}
          <div className="absolute top-10 left-12 right-12 flex justify-between items-center opacity-30">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-400" />
            <div className="w-2 h-2 rounded-full bg-cyan-400 mx-4 shadow-[0_0_10px_rgba(34,211,238,1)]" />
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>

          <div className="absolute top-10 left-12">
            <span
              className="text-[9px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full text-white border border-white/10 italic"
              style={{ background: `${getMasteryColor(card.masteryState)}30`, borderColor: `${getMasteryColor(card.masteryState)}40` }}
            >
              {getMasteryLabel(card.masteryState)}
            </span>
          </div>

          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] mb-8 italic">Neural Stimulus</span>
          <p className="text-4xl  font-black text-white italic tracking-tighter leading-tight uppercase text-shadow-glow">
            {card.front}
          </p>

          <div className="absolute bottom-10 flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic animate-pulse">
            <RotateCcw size={14} className="text-cyan-400" /> Tap to Access
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 system-panel p-12 flex flex-col items-center justify-center text-center modular-card !bg-white/[0.05] border-emerald-500/20"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Card Accent lines */}
          <div className="absolute top-10 left-12 right-12 flex justify-between items-center opacity-30">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-emerald-400" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 mx-4 shadow-[0_0_10px_rgba(16,185,129,1)]" />
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-emerald-400" />
          </div>

          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.6em] mb-8 italic text-shadow-glow">Response Decrypted</span>
          <p className="text-4xl  font-black text-white italic tracking-tighter leading-tight uppercase">
            {card.back}
          </p>

          <div className="absolute bottom-10 text-[9px] font-black text-emerald-400/40 uppercase tracking-[0.4em] italic leading-tight uppercase">
            Verify Recognition Accuracy Range
          </div>
        </div>
      </motion.div>
    </div>
  );
}
