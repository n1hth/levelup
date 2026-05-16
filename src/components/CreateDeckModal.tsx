import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Tag, Palette } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';
import { useApp } from '@/src/lib/store.tsx';
import { DECK_COLORS } from './DeckCard.tsx';

const SUBJECTS = [
  'Mathematics', 'Science', 'History', 'Language', 'Computer Science',
  'Physics', 'Chemistry', 'Biology', 'Economics', 'Philosophy',
  'Literature', 'Art', 'Music', 'Psychology', 'Medicine', 'Law', 'Other'
];

interface CreateDeckModalProps {
  onClose: () => void;
  onCreated: (deckId: string) => void;
}

export function CreateDeckModal({ onClose, onCreated }: CreateDeckModalProps) {
  const { addDeck, setOrbHidden } = useApp();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState(DECK_COLORS[0]);
  const [errors, setErrors] = useState<{ title?: string; subject?: string }>({});

  useEffect(() => {
    setOrbHidden(true);
    return () => setOrbHidden(false);
  }, [setOrbHidden]);

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!subject) e.subject = 'Subject is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const deck = await addDeck({
      title: title.trim(),
      subject,
      description: description.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      color,
    });
    onCreated(deck.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-[#0A0C10] border border-white/5 rounded-[3rem] p-8 relative shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col md:flex-row gap-8"
        >
          {/* Left panel for branding/visuals */}
          <div className="hidden md:flex md:w-1/3 flex-col justify-between border-r border-white/5 pr-8">
            <div>
              <div className="w-16 h-16 bg-white/[0.01] border border-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
                <BookOpen size={32} className="text-cyan-400" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter leading-none italic uppercase mb-2">Knowledge <span className="text-cyan-400">Vault</span></h2>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-relaxed">Initialize a new neural repository for lexical storage</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                   <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic">Sync Status</span>
                </div>
                <div className="text-[10px] font-black text-cyan-400 italic uppercase">Awaiting Matrix Configuration...</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between md:hidden mb-4">
              <h2 className="text-2xl font-black text-white tracking-tighter leading-none italic uppercase">New Archive</h2>
              <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Color Picker */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic flex items-center gap-2">
                  <Palette size={12} className="text-cyan-400" /> Archive Core Signature
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  {DECK_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-lg bg-gradient-to-br transition-all relative",
                        c,
                        color === c ? 'ring-2 ring-white ring-offset-4 ring-offset-black scale-110' : 'opacity-40 hover:opacity-80'
                      )}
                    >
                      {color === c && <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Archive Designation</label>
                <input
                  type="text"
                  placeholder="E.G. NEURAL BIOLOGY UNIT 01"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={cn(
                    "w-full bg-white/[0.02] border rounded-2xl py-4 px-6 outline-none transition-all text-sm font-black italic uppercase tracking-widest placeholder:text-white/5",
                    errors.title ? "border-red-500/50 bg-red-500/5" : "border-white/5 focus:border-cyan-400/30 focus:bg-white/[0.04]"
                  )}
                  autoFocus
                />
              </div>

              {/* Subject */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Primary Domain</label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className={cn(
                      "w-full bg-white/[0.02] border rounded-2xl py-4 px-6 outline-none transition-all text-sm font-black italic uppercase tracking-widest appearance-none",
                      errors.subject ? "border-red-500/50" : "border-white/5 focus:border-cyan-400/30 focus:bg-white/[0.04]",
                      !subject ? "text-white/10" : "text-white"
                    )}
                  >
                    <option value="" disabled className="bg-black">SELECT ARCHIVE DOMAIN...</option>
                    {SUBJECTS.map(s => <option key={s} value={s} className="bg-black text-white font-black italic">{s.toUpperCase()}</option>)}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/10">
                    <Palette size={14} />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic flex items-center gap-2">
                  <Tag size={12} /> Search Metadata
                </label>
                <input
                  type="text"
                  placeholder="EXAM, UNIT1, CRITICAL"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 outline-none focus:border-cyan-400/30 focus:bg-white/[0.04] transition-all text-sm font-black italic uppercase tracking-widest text-white placeholder:text-white/5"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button 
                onClick={onClose} 
                className="flex-1 py-4 rounded-2xl border border-white/5 text-white/30 font-black text-[11px] uppercase tracking-widest italic hover:bg-white/5 hover:text-white transition-all shadow-xl active:scale-95"
              >
                ABORT
              </button>
              <button 
                onClick={handleSubmit} 
                className="flex-[2] py-4 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.4em] italic hover:bg-cyan-400 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 active:shadow-none"
              >
                INITIALIZE
              </button>
            </div>
          </div>
          
          <button onClick={onClose} className="hidden md:flex absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-black border border-white/10 items-center justify-center text-white/20 hover:text-white hover:border-white transition-all shadow-3xl">
            <X size={24} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
