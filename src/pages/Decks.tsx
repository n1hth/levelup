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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

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
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-8"
      >
      <div className="pt-8 px-6 flex items-center justify-between">
         <div className="text-left">
           <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
             Neural Archives
           </h1>
           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1.5 italic">Knowledge Repository Active</p>
         </div>
         <motion.button
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={() => setShowCreate(true)}
           className="p-2.5 rounded-xl transition-all border bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
         >
           <Plus size={16} className="stroke-[3]" />
         </motion.button>
      </div>

      {/* Search & Filter */}
      <motion.div variants={itemVariants} className="px-6 flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-400 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Query neural database..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-[11px] font-black outline-none focus:border-cyan-400/20 focus:bg-white/[0.04] transition-all text-white shadow-inner placeholder:text-white/5 italic uppercase tracking-widest"
          />
        </div>
        {subjects.length > 0 && (
          <div className="relative">
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className={cn(
                "h-full bg-white/[0.02] border border-white/5 rounded-2xl px-8 py-3 text-[9px] font-black outline-none focus:border-cyan-400/20 focus:bg-white/[0.04] transition-all appearance-none pr-12 italic uppercase tracking-[0.2em]",
                filterSubject ? "text-cyan-400" : "text-white/20"
              )}
            >
              <option value="" className="bg-[#050608]">DOMAINS</option>
              {subjects.map(s => <option key={s} value={s} className="bg-[#050608]">{s.toUpperCase()}</option>)}
            </select>
            <Filter size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none" />
          </div>
        )}
      </motion.div>

        {/* Deck list */}
        {state.decks.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState onCreate={() => setShowCreate(true)} />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-20 border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <Search size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">No neural patterns matched the query</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {filtered.map((deck, i) => (
              <motion.div
                variants={itemVariants}
                key={deck.id}
              >
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  stats={getDeckStats(deck.id)}
                  index={i}
                  onClick={() => navigate(`/decks/${deck.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
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
        className="flex flex-col items-center justify-center py-20 px-10 text-center bg-[#07090D] border border-white/5 rounded-[2.5rem] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] mx-6"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-[3rem] bg-black border border-white/5 flex items-center justify-center mb-8 shadow-2xl relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <BookOpen size={40} className="text-white/10 group-hover:text-cyan-400 transition-colors relative z-10" />
        </motion.div>
        <h2 className="text-xl font-black text-white tracking-tighter mb-3 uppercase italic leading-none">Archives <span className="text-white/20">Quiescent</span></h2>
        <p className="text-[11px] font-black text-white/10 leading-relaxed uppercase tracking-[0.2em] italic opacity-60 mb-10 max-w-xs">
          Neural transmissions are Currently Synchronized. Awaiting repository initialization.
        </p>
        <button 
          onClick={onCreate} 
          className="px-12 py-5 bg-white/[0.03] text-white border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all font-black italic tracking-widest text-xs shadow-2xl active:scale-95 flex items-center gap-3"
        >
          <Sparkles size={16} className="text-cyan-400" /> INITIALIZE REPO
        </button>
      </motion.div>
  );
}
