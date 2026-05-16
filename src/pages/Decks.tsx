import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, BookOpen, Sparkles, LayoutGrid } from 'lucide-react';
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
        className="max-w-6xl mx-auto space-y-12 pb-24 px-4"
      >
        {/* Refined Header */}
        <header className="flex items-center justify-between pt-12 border-b border-white/5 pb-8 px-2 ">
           <div>
             <div className="flex items-center gap-3 mb-2 text-white/20">
                <LayoutGrid size={14} className="hidden " />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] italic">Storage</span>
             </div>
             <h1 className="text-2xl  font-black text-white italic tracking-tighter uppercase leading-none">
               Decks
             </h1>
           </div>
           
           <button
             onClick={() => setShowCreate(true)}
             className="flex items-center justify-center w-12 h-12   bg-white text-black rounded-full hover:bg-cyan-400 transition-all active:scale-95 group shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
           >
             <Plus size={24} className="stroke-[3]" />
           </button>
        </header>

        {/* Search & Intelligence Controls */}
        <section className="flex flex-col  gap-4 px-2 ">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-400 transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search decks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[11px] font-black outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all text-white placeholder:text-white/5 italic uppercase tracking-widest"
            />
          </div>
          
          <div className="flex gap-4">
            {subjects.length > 0 && (
              <div className="relative flex-1 ">
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className={cn(
                    "w-full h-full bg-white/[0.02] border border-white/5 rounded-2xl px-8 py-4 text-[9px] font-black outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all appearance-none pr-12 italic uppercase tracking-[0.2em]",
                    filterSubject ? "text-cyan-400" : "text-white/40"
                  )}
                >
                  <option value="" className="bg-[#050608]">All Subjects</option>
                  {subjects.map(s => <option key={s} value={s} className="bg-[#050608]">{s.toUpperCase()}</option>)}
                </select>
                <Filter size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none" />
              </div>
            )}
          </div>
        </section>

        {/* Result Grid */}
        <section className="px-2 ">
          {state.decks.length === 0 ? (
            <motion.div variants={itemVariants}>
              <EmptyState onCreate={() => setShowCreate(true)} />
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div variants={itemVariants} className="text-center py-32 border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
              <Search size={40} className="mx-auto mb-6 text-white/5" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No gate patterns found</p>
            </motion.div>
          ) : (
            <div className="flex flex-col    gap-6  pb-20">
              {filtered.map((deck, i) => (
                <motion.div
                  variants={itemVariants}
                  key={deck.id}
                  className="w-full "
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
            </div>
          )}
        </section>
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
        className="flex flex-col items-center justify-center py-32 px-10 text-center bg-white/[0.01] border border-white/5 rounded-[3rem] shadow-2xl mx-4"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full bg-black border border-white/5 flex items-center justify-center mb-10 shadow-inner relative group"
        >
          <div className="absolute inset-0 bg-cyan-400/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <BookOpen size={40} className="text-white/5 group-hover:text-cyan-400/40 transition-colors relative z-10" />
        </motion.div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase italic leading-none">No <span className="text-white/20">Decks</span></h2>
        <p className="text-[11px] font-black text-white/20 leading-relaxed uppercase tracking-[0.2em] italic mb-12 max-w-sm">
          You haven't created any study decks yet. Start your journey by creating your first deck.
        </p>
        <button 
          onClick={onCreate} 
          className="px-10 py-5 bg-white text-black rounded-full hover:bg-cyan-400 transition-all font-black italic tracking-widest text-[10px] uppercase shadow-2xl active:scale-95 flex items-center gap-4"
        >
          <Sparkles size={16} fill="currentColor" /> Create New Deck
        </button>
      </motion.div>
  );
}
