import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 "
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white rounded-[24px] p-6 relative shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-blue-900 tracking-tighter uppercase drop-shadow-sm">Add Cards</h2>
            {addedCount > 0 && (
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 drop-shadow-sm">
                {addedCount} card{addedCount !== 1 ? 's' : ''} added ✓
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 border-2 border-blue-50 rounded-2xl mb-5 bg-blue-50/30">
          {(['single', 'bulk'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300",
                mode === m ? "bg-blue-600 text-white shadow-lg" : "text-blue-500 hover:bg-white/40")}>
              {m === 'single' ? <Plus size={16} /> : <Layers size={16} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{m === 'single' ? 'Single' : 'Bulk'}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'single' ? (
            <motion.div key="single" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900 mb-2 block">Front</label>
                <textarea placeholder="Question or term..." value={front} onChange={e => setFront(e.target.value)} rows={3} autoFocus
                  className={cn("w-full bg-blue-50/20 border-2 rounded-2xl py-3 px-4 outline-none focus:bg-white transition-all text-blue-950 placeholder:text-blue-400 font-bold text-sm resize-none",
                    errors.front ? "border-red-200" : "border-transparent focus:border-blue-400")} />
                {errors.front && <p className="text-[9px] text-red-500 font-black mt-1 ml-1">{errors.front}</p>}
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900 mb-2 block">Back</label>
                <textarea placeholder="Answer or definition..." value={back} onChange={e => setBack(e.target.value)} rows={3}
                  className={cn("w-full bg-blue-50/20 border-2 rounded-2xl py-3 px-4 outline-none focus:bg-white transition-all text-blue-950 placeholder:text-blue-400 font-bold text-sm resize-none",
                    errors.back ? "border-red-200" : "border-transparent focus:border-blue-400")} />
                {errors.back && <p className="text-[9px] text-red-500 font-black mt-1 ml-1">{errors.back}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddSingle} className="btn-system flex-1 py-3 text-sm shadow-lg"><Plus size={16} /> Add Card</button>
                <button onClick={onClose} className="px-5 py-3 rounded-2xl border-2 border-blue-50 bg-white text-blue-600 font-black text-sm hover:bg-blue-50 transition-all">Done</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="bulk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3 leading-relaxed uppercase tracking-wider">
                Format: First line = Front, rest = Back.<br />Separate cards with a blank line.
              </div>
              <textarea placeholder={`What is photosynthesis?\nPlants convert sunlight to energy.\n\nWhat is mitosis?\nCell division producing two identical cells.`}
                value={bulkText} onChange={e => { setBulkText(e.target.value); setBulkPreview([]); }} rows={7}
                className="w-full bg-blue-50/20 border-2 border-transparent rounded-2xl py-3 px-4 outline-none focus:border-blue-400 focus:bg-white transition-all text-blue-950 placeholder:text-blue-400 font-bold text-sm resize-none" />
              {bulkPreview.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest">{bulkPreview.length} cards detected:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                    {bulkPreview.slice(0, 3).map((c, i) => (
                      <div key={i} className="text-[10px] text-blue-700 bg-blue-50/50 border border-blue-50 rounded-xl px-3 py-2 truncate font-bold">
                        <span className="text-blue-500">{c.front.slice(0, 30)}…</span>
                        <ChevronRight size={10} className="inline mx-1 text-blue-300" />
                        {c.back.slice(0, 30)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={bulkPreview.length === 0 ? handleBulkPreview : handleAddBulk} className="btn-system flex-1 py-3 text-sm shadow-lg">
                  {bulkPreview.length === 0 ? 'Preview' : `Add ${bulkPreview.length} Cards`}
                </button>
                <button onClick={onClose} className="px-5 py-3 rounded-2xl border-2 border-blue-50 bg-white text-blue-600 font-black text-sm hover:bg-blue-50 transition-all">Done</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
