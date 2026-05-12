import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, BookOpen, Sparkles } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { DeckCard } from '@/src/components/DeckCard.tsx';
import { CreateDeckModal } from '@/src/components/CreateDeckModal.tsx';
import { cn } from '@/src/lib/utils.ts';

export function Decks() {
  const navigate = useNavigate();
  const { state, getDeckStats } = useApp();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');

  const subjects = [...new Set(state.decks.map(d => d.subject))].filter(Boolean);

  const filtered = state.decks.filter(d => {
    const matchesSearch = !search || 
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = !filterSubject || d.subject === filterSubject;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-8"
      >
        {/* Header */}
        <div className="flex justify-between items-end px-1">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase">Knowledge Vault</span>
            <h1 className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Smart Decks</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreate(true)}
            className="w-14 h-14 bg-blue-600 text-white flex items-center justify-center rounded-[2rem] shadow-[0_10px_25px_rgba(37,99,235,0.4)] border-4 border-white"
          >
            <Plus size={28} />
          </motion.button>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search decks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/60 border border-blue-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white transition-all text-blue-900 shadow-inner placeholder:text-blue-300"
            />
          </div>
          {subjects.length > 0 && (
            <div className="relative">
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className={cn(
                  "h-full bg-white/60 border border-blue-100 rounded-2xl px-4 py-3.5 text-[10px] font-black outline-none focus:border-blue-400 focus:bg-white transition-all appearance-none pr-8",
                  filterSubject ? "text-blue-600" : "text-blue-300"
                )}
              >
                <option value="">All</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Deck list */}
        {state.decks.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-blue-300">
            <Search size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-black">No decks match your search</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((deck, i) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                stats={getDeckStats(deck.id)}
                index={i}
                onClick={() => navigate(`/decks/${deck.id}`)}
              />
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <CreateDeckModal
            onClose={() => setShowCreate(false)}
            onCreated={(id) => { setShowCreate(false); navigate(`/decks/${id}`); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-lg"
      >
        <BookOpen size={40} className="text-blue-300" />
      </motion.div>
      <h2 className="text-xl font-black text-blue-900 tracking-tighter mb-2">Your vault is empty</h2>
      <p className="text-sm font-bold text-blue-400 mb-8 max-w-xs leading-relaxed">
        Create your first deck to start building your knowledge system and earning XP.
      </p>
      <button onClick={onCreate} className="btn-system px-8 py-4">
        <Sparkles size={16} /> Create First Deck
      </button>
    </motion.div>
  );
}
