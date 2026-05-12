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
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1200px', minHeight: '280px' }}
      onClick={handleFlip}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%', minHeight: '280px' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 system-panel p-8 flex flex-col items-center justify-center border-white/80 shadow-xl"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 aero-gloss opacity-30 rounded-[18px] pointer-events-none" />
          <div className="absolute top-4 left-4">
            <span
              className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full text-white"
              style={{ background: getMasteryColor(card.masteryState) }}
            >
              {getMasteryLabel(card.masteryState)}
            </span>
          </div>
          <div className="absolute top-4 right-4 text-[9px] font-black text-blue-300 uppercase tracking-widest">Front</div>

          <p className="text-center text-blue-900 font-black text-xl leading-relaxed relative z-10">
            {card.front}
          </p>

          <div className="absolute bottom-4 flex items-center gap-2 text-[9px] font-black text-blue-300 uppercase tracking-widest">
            <RotateCcw size={10} /> Tap to reveal
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 system-panel p-8 flex flex-col items-center justify-center border-blue-200/50 shadow-xl bg-gradient-to-br from-blue-50/80 to-white/80"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="absolute inset-0 aero-gloss opacity-20 rounded-[18px] pointer-events-none" />
          <div className="absolute top-4 right-4 text-[9px] font-black text-blue-300 uppercase tracking-widest">Back</div>

          <p className="text-center text-blue-800 font-bold text-lg leading-relaxed relative z-10">
            {card.back}
          </p>

          <div className="absolute bottom-4 text-[9px] font-black text-blue-300 uppercase tracking-widest">
            Rate your memory below
          </div>
        </div>
      </motion.div>
    </div>
  );
}
