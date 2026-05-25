import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';
import { useApp } from '@/src/lib/store.tsx';

type Mode = 'single' | 'bulk';

interface CreateCardModalProps {
  deckId: string;
  onClose: () => void;
}

export function CreateCardModal({ deckId, onClose }: CreateCardModalProps) {
  const { addCard, addCards } = useApp();
  const [mode, setMode] = useState<Mode>('single');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [addedCount, setAddedCount] = useState(0);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<{ front: string; back: string }[]>([]);

  const handleAddSingle = () => {
    const e: typeof errors = {};
    if (!front.trim()) e.front = 'Front is required';
    if (!back.trim()) e.back = 'Back is required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    addCard({ deckId, front: front.trim(), back: back.trim() });
    setFront(''); setBack(''); setErrors({});
    setAddedCount(c => c + 1);
  };

  const parseBulk = (text: string) =>
    text.split(/\n\n+/)
      .map(b => b.split('\n').filter(Boolean))
      .filter(b => b.length >= 2)
      .map(b => ({ front: b[0].trim(), back: b.slice(1).join('\n').trim() }))
      .filter(c => c.front && c.back);

  const handleBulkPreview = () => setBulkPreview(parseBulk(bulkText));

  const handleAddBulk = () => {
    const parsed = parseBulk(bulkText);
    if (!parsed.length) return;
    addCards(parsed.map(c => ({ deckId, front: c.front, back: c.back })));
    setAddedCount(c => c + parsed.length);
    setBulkText(''); setBulkPreview([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-[#0A0E17]/95 border border-white/10 rounded-[28px] p-6 relative shadow-[0_30px_80px_rgba(0,0,0,0.8),0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-3xl"
      >
        {/* Glow accent */}
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 tracking-tighter uppercase italic">Add Cards</h2>
            {addedCount > 0 && (
              <p className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest mt-0.5 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                {addedCount} card{addedCount !== 1 ? 's' : ''} added ✓
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 border border-white/5 rounded-2xl mb-6 bg-white/[0.02] relative z-10">
          {(['single', 'bulk'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 pointer-events-auto",
                mode === m 
                  ? "bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] border border-cyan-400/20" 
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white/70 border border-transparent")}
            >
              {m === 'single' ? <Plus size={15} /> : <Layers size={15} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{m === 'single' ? 'Single' : 'Bulk'}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'single' ? (
            <motion.div key="single" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4 relative z-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80 mb-2 block">Front</label>
                <textarea 
                  placeholder="Question or term..." 
                  value={front} 
                  onChange={e => setFront(e.target.value)} 
                  rows={3} 
                  autoFocus
                  className={cn("w-full bg-white/[0.02] border border-white/10 rounded-2xl py-3 px-4 outline-none focus:bg-white/[0.04] text-white placeholder:text-white/20 font-medium text-sm resize-none transition-all",
                    errors.front ? "border-red-500/50 focus:border-red-500" : "focus:border-cyan-400/50")} 
                />
                {errors.front && <p className="text-[9px] text-red-400 font-mono mt-1 ml-1">{errors.front}</p>}
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80 mb-2 block">Back</label>
                <textarea 
                  placeholder="Answer or definition..." 
                  value={back} 
                  onChange={e => setBack(e.target.value)} 
                  rows={3}
                  className={cn("w-full bg-white/[0.02] border border-white/10 rounded-2xl py-3 px-4 outline-none focus:bg-white/[0.04] text-white placeholder:text-white/20 font-medium text-sm resize-none transition-all",
                    errors.back ? "border-red-500/50 focus:border-red-500" : "focus:border-cyan-400/50")} 
                />
                {errors.back && <p className="text-[9px] text-red-400 font-mono mt-1 ml-1">{errors.back}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleAddSingle} 
                  className="flex-1 py-3 rounded-2xl font-black text-sm tracking-[0.1em] uppercase text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.35)]"
                  style={{ background: 'linear-gradient(135deg, oklch(0.68 0.22 220) 0%, oklch(0.48 0.28 240) 100%)' }}
                >
                  <Plus size={15} /> Add Card
                </button>
                <button 
                  onClick={onClose} 
                  className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/80 font-black text-sm hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="bulk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 relative z-10">
              <div className="text-[10px] font-black text-cyan-400/90 bg-cyan-400/5 border border-cyan-400/15 rounded-xl p-3 leading-relaxed uppercase tracking-wider font-mono">
                Format: First line = Front, rest = Back.<br />Separate cards with a blank line.
              </div>
              <textarea 
                placeholder={`What is photosynthesis?\nPlants convert sunlight to energy.\n\nWhat is mitosis?\nCell division producing two identical cells.`}
                value={bulkText} 
                onChange={e => { setBulkText(e.target.value); setBulkPreview([]); }} 
                rows={7}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-3 px-4 outline-none focus:bg-white/[0.04] focus:border-cyan-400/50 text-white placeholder:text-white/20 font-medium text-sm resize-none transition-all" 
              />
              {bulkPreview.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-cyan-400/80 uppercase tracking-widest font-mono">{bulkPreview.length} cards detected:</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                    {bulkPreview.slice(0, 3).map((c, i) => (
                      <div key={i} className="text-[10px] text-white/70 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 truncate font-bold flex items-center justify-between">
                        <span className="text-cyan-400">{c.front.slice(0, 25)}…</span>
                        <ChevronRight size={10} className="text-white/20 mx-1 shrink-0" />
                        <span className="text-white/50">{c.back.slice(0, 25)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={bulkPreview.length === 0 ? handleBulkPreview : handleAddBulk} 
                  className="flex-1 py-3 rounded-2xl font-black text-sm tracking-[0.1em] uppercase text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.35)]"
                  style={{ background: 'linear-gradient(135deg, oklch(0.68 0.22 220) 0%, oklch(0.48 0.28 240) 100%)' }}
                >
                  {bulkPreview.length === 0 ? 'Preview' : `Add ${bulkPreview.length} Cards`}
                </button>
                <button 
                  onClick={onClose} 
                  className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/80 font-black text-sm hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
