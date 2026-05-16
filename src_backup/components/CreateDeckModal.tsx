import { useState } from 'react';
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
  const { addDeck } = useApp();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState(DECK_COLORS[0]);
  const [errors, setErrors] = useState<{ title?: string; subject?: string }>({});

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
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-32 sm:pb-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md bg-white rounded-[24px] p-6 relative shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-blue-900 tracking-tighter drop-shadow-sm">New Deck</h2>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5 drop-shadow-sm">Create your knowledge vault</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Color Picker */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900 flex items-center gap-2 mb-2">
                <Palette size={11} /> Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {DECK_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      `w-8 h-8 rounded-xl bg-gradient-to-br ${c} border-2 transition-all`,
                      color === c ? 'border-blue-900 scale-110 shadow-lg' : 'border-white hover:border-blue-100'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900 flex items-center gap-2 mb-2">
                <BookOpen size={11} /> Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Biology Chapter 1"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={cn(
                  "w-full bg-blue-50/20 border-2 rounded-2xl py-3 px-4 outline-none focus:bg-white transition-all text-blue-950 placeholder:text-blue-400 font-bold text-sm",
                  errors.title ? "border-red-200 focus:border-red-400" : "border-transparent focus:border-blue-400"
                )}
                autoFocus
              />
              {errors.title && <p className="text-[9px] text-red-500 font-black mt-1 ml-1">{errors.title}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900 mb-2 block">Subject *</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className={cn(
                    "w-full bg-blue-50/20 border-2 rounded-2xl py-3 px-4 outline-none focus:bg-white transition-all text-blue-950 font-bold text-sm appearance-none",
                    errors.subject ? "border-red-200" : "border-transparent focus:border-blue-400",
                    !subject && "text-blue-400"
                  )}
                >
                  <option value="" disabled>Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                  <Palette size={14} />
                </div>
              </div>
              {errors.subject && <p className="text-[9px] text-red-500 font-black mt-1 ml-1">{errors.subject}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900 mb-2 block">Description</label>
              <textarea
                placeholder="What's this deck about?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-blue-50/20 border-2 border-transparent rounded-2xl py-3 px-4 outline-none focus:border-blue-400 focus:bg-white transition-all text-blue-950 placeholder:text-blue-400 font-bold text-sm resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900 flex items-center gap-2 mb-2">
                <Tag size={11} /> Tags
              </label>
              <input
                type="text"
                placeholder="e.g. exam, chapter1, important"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full bg-blue-50/20 border-2 border-transparent rounded-2xl py-3 px-4 outline-none focus:border-blue-400 focus:bg-white transition-all text-blue-950 placeholder:text-blue-400 font-bold text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-blue-50 bg-white text-blue-600 font-black text-sm hover:bg-blue-50 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-system flex-1 py-3 shadow-lg">
              Create Deck
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
