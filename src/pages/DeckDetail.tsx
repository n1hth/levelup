import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Zap, Trash2, BookOpen, Box, Settings2, MoreHorizontal } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { CreateCardModal } from '@/src/components/CreateCardModal.tsx';
import { getMasteryColor, getMasteryLabel } from '@/src/lib/sm2.ts';
import { cn } from '@/src/lib/utils.ts';
import { getRelativeTime } from '@/src/lib/utils.ts';

export function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, getDeckCards, getDeckStats, deleteDeck, deleteCard } = useApp();
  const [showAddCard, setShowAddCard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deck = state.decks.find(d => d.id === id);
  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-white/40 font-black uppercase tracking-[0.5em] italic">System Error: Repository Not Found</p>
        <button onClick={() => navigate('/decks')} className="mt-8 px-8 py-4 bg-white/5 text-[10px] font-black tracking-[0.3em] uppercase italic border border-white/10 rounded-full hover:bg-white/10 transition-all">RETURN TO ARCHIVES</button>
      </div>
    );
  }

  const cards = getDeckCards(deck.id);
  const stats = getDeckStats(deck.id);

  const handleDeleteDeck = () => {
    deleteDeck(deck.id);
    navigate('/decks');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto space-y-12 pb-32"
      >
        {/* Minimal Navigation */}
        <nav className="flex items-center justify-between pt-4">
          <button
            onClick={() => navigate('/decks')}
            className="flex items-center gap-3 text-[9px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-white transition-colors italic"
          >
            <ArrowLeft size={14} /> Neural Archives
          </button>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <span className="text-[8px] font-black text-cyan-400/80 uppercase tracking-widest italic">Live Feed</span>
             </div>
          </div>
        </nav>

        {/* Hero Section: Clean & Typographic */}
        <section className="relative">
          <div className="flex items-end justify-between gap-8 border-b border-white/5 pb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic", deck.color.replace('bg-', 'text-').replace('from-', 'text-'))}>
                  {deck.subject || 'Core Domain'}
                </div>
                <div className="h-px w-8 bg-white/10" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">{stats.total} Neural Slices</span>
              </div>
              
              <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none mb-6">
                {deck.title}
              </h1>
              
              <div className="flex items-center gap-3">
                {deck.tags.map(tag => (
                  <span key={tag} className="text-[8px] font-black text-white/40 border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest hover:text-white hover:border-white/20 transition-all cursor-default italic">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className={cn("w-24 h-24 rounded-3xl bg-gradient-to-br flex items-center justify-center text-white border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] shrink-0", deck.color)}>
               <Box size={40} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </div>
          </div>

          {deck.description && (
            <p className="text-[11px] font-medium text-white/40 mt-6 leading-relaxed italic max-w-xl">
              {deck.description}
            </p>
          )}
        </section>

        {/* Neural Diagnostics Grid */}
        <section className="grid grid-cols-4 gap-6">
           <div className="space-y-1">
             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Archive Capacity</p>
             <p className="text-2xl font-black text-white tracking-tighter italic">{stats.total}</p>
           </div>
           <div className="space-y-1">
             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Sync Required</p>
             <p className={cn("text-2xl font-black tracking-tighter italic", stats.due > 0 ? "text-cyan-400" : "text-white/40")}>
               {stats.due}
             </p>
           </div>
           <div className="space-y-1">
             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Synaptic Strength</p>
             <p className="text-2xl font-black text-white tracking-tighter italic">{stats.mastery}%</p>
           </div>
           <div className="flex items-end pb-1">
             <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.mastery}%` }}
                  className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                />
             </div>
           </div>
        </section>

        {/* Refined Sync Action */}
        <section className="pt-4">
           {stats.due > 0 ? (
             <motion.button
               whileHover={{ scale: 1.01 }}
               whileTap={{ scale: 0.99 }}
               onClick={() => navigate(`/decks/${deck.id}/study`)}
               className="w-full h-16 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.5em] italic flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-cyan-400 transition-colors"
             >
               <Zap size={18} fill="currentColor" />
               Initiate Synaptic Sync
             </motion.button>
           ) : (
             <div className="w-full h-16 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center gap-4 group">
                <div className="w-2 h-2 rounded-full bg-cyan-400/20 group-hover:bg-cyan-400 transition-colors" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic group-hover:text-white/40 transition-colors">Neural Network Optimized</span>
             </div>
           )}
        </section>

        {/* Content Explorer */}
        <section className="space-y-6 pt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic flex items-center gap-3">
              <BookOpen size={14} className="opacity-40" /> Archive Explorer
            </h2>
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-3 px-5 py-2.5 bg-white text-black rounded-full hover:bg-cyan-400 transition-all active:scale-95 group"
            >
              <Plus size={14} className="stroke-[3px]" />
              <span className="text-[9px] font-black tracking-[0.1em] uppercase italic">Add Fragment</span>
            </button>
          </div>

          <div className="grid gap-3">
            {cards.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">Awaiting first neural fragment insertion</p>
              </div>
            ) : (
              cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: getMasteryColor(card.masteryState) }} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                       <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: getMasteryColor(card.masteryState) }}>
                          {getMasteryLabel(card.masteryState)}
                       </span>
                       {card.lastReviewedAt && (
                         <span className="text-[8px] text-white/10 font-black uppercase tracking-[0.1em] italic">
                           Synced {getRelativeTime(card.lastReviewedAt)}
                         </span>
                       )}
                    </div>
                    <p className="text-lg font-black text-white tracking-tighter italic uppercase truncate">{card.front}</p>
                    <p className="text-[10px] font-bold text-white/30 truncate italic mt-0.5">{card.back}</p>
                  </div>

                  <button
                    onClick={() => deleteCard(card.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-500 transition-all p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Minimal Danger Zone */}
        <section className="pt-24 border-t border-white/5">
           <div className="flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-4 text-red-500/80">
                 <Settings2 size={16} />
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Archive Termination</span>
              </div>
              
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-red-500 transition-colors italic underline underline-offset-4 decoration-white/5"
                >
                  Initiate Purge
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest italic animate-pulse">Confirming Wipe?</span>
                  <button onClick={() => setConfirmDelete(false)} className="text-[8px] font-black text-white/40 uppercase italic">Abort</button>
                  <button onClick={handleDeleteDeck} className="px-4 py-1.5 rounded-full bg-red-600 text-white text-[8px] font-black uppercase italic shadow-lg shadow-red-600/20">Final Purge</button>
                </div>
              )}
           </div>
        </section>
      </motion.div>

      <AnimatePresence>
        {showAddCard && <CreateCardModal deckId={deck.id} onClose={() => setShowAddCard(false)} />}
      </AnimatePresence>
    </>
  );
}
