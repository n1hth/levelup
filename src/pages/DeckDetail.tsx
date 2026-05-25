import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <p className="text-white/40 font-black uppercase tracking-[0.5em] italic">System Error: Gate Not Found</p>
        <button onClick={() => navigate('/decks')} className="mt-8 px-8 py-4 bg-white/5 text-[10px] font-black tracking-[0.3em] uppercase italic border border-white/10 rounded-full hover:bg-white/10 transition-all">RETURN TO VAULT</button>
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
        className="max-w-3xl mx-auto space-y-12 pb-32 px-4"
      >
        {/* Minimal Navigation */}
        <nav className="flex items-center justify-between pt-4">
          <button
            onClick={() => navigate('/decks')}
            className="flex items-center gap-3 text-[9px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-white transition-colors italic"
          >
            <ArrowLeft size={14} /> Back to Decks
          </button>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <span className="text-[8px] font-black text-cyan-400/80 uppercase tracking-widest italic">Live Feed</span>
             </div>
          </div>
        </nav>

        {/* Compact Split Header & Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-white/5 pb-8">
          
          {/* Left Column: Icon & Meta Info (Title, Category, Tags, Description) */}
          <div className="md:col-span-5 flex items-start gap-4">
            {/* The 3D Gradient Icon */}
            <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white border border-white/10 shadow-[0_10px_30px_rgba(0,229,255,0.15)] shrink-0", deck.color || 'from-cyan-400 to-blue-500')}>
               <Box size={28} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest italic border bg-white/5 border-white/10 text-white">
                  {deck.subject || 'General'}
                </span>
                <span className="text-[8.5px] font-mono font-black text-cyan-400/80 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20 uppercase tracking-widest italic">
                  {stats.total} Cards
                </span>
              </div>
              
              <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none truncate">
                {deck.title}
              </h1>

              <div className="flex flex-wrap items-center gap-1">
                {deck.tags.map(tag => (
                  <span key={tag} className="text-[7.5px] font-black text-white/40 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest hover:text-white hover:border-white/15 transition-all cursor-default italic">
                    #{tag}
                  </span>
                ))}
              </div>

              {deck.description && (
                <p className="text-[10px] font-medium text-white/35 leading-relaxed italic max-w-sm pt-1">
                  {deck.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Diagnostics Stats & Study Raid Button */}
          <div className="md:col-span-7 flex flex-col justify-between gap-5 bg-white/[0.015] border border-white/5 rounded-3xl p-5 backdrop-blur-2xl">
             
             {/* Diagnostics Stats */}
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Total Cards</p>
                  <p className="text-xl font-black text-white tracking-tighter italic">{stats.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Due Today</p>
                  <p className={cn("text-xl font-black tracking-tighter italic", stats.due > 0 ? "text-cyan-400" : "text-white/40")}>
                    {stats.due}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Mastery</p>
                  <p className="text-xl font-black text-white tracking-tighter italic">{stats.mastery}%</p>
                </div>
             </div>

             {/* Mastery progress bar */}
             <div className="flex items-center gap-3">
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${stats.mastery}%` }}
                     className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                  />
               </div>
             </div>

             {/* Action Button: Start Study Raid */}
             <div className="pt-0.5">
                {stats.due > 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(`/study/${deck.id}`)}
                    className="w-full h-11 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-[0.4em] italic flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.08)] hover:bg-cyan-400 transition-colors"
                  >
                    <Zap size={13} fill="currentColor" />
                    Start Study Raid
                  </motion.button>
                ) : (
                  <div className="w-full h-11 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/20" />
                     <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] italic">Deck Mastered</span>
                  </div>
                )}
             </div>
          </div>
        </section>

        {/* Explorer */}
        <section className="space-y-6 pt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic flex items-center gap-3">
              <BookOpen size={14} className="opacity-40" /> Card Explorer
            </h2>
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-3 px-5 py-2.5 bg-white text-black rounded-full hover:bg-cyan-400 transition-all active:scale-95 group"
            >
              <Plus size={14} className="stroke-[3px]" />
              <span className="text-[9px] font-black tracking-[0.1em] uppercase italic">Add Card</span>
            </button>
          </div>

          <div className="grid gap-3">
            {cards.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">No cards added to this deck</p>
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
                           Reviewed {getRelativeTime(card.lastReviewedAt)}
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

        {/* Danger Zone */}
        <section className="pt-24 border-t border-white/5">
           <div className="flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-4 text-red-500/80">
                 <Settings2 size={16} />
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Danger Zone</span>
              </div>
              
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 text-[9px] font-black uppercase tracking-widest italic transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.05)] pointer-events-auto"
                >
                  <Trash2 size={12} />
                  Delete Deck
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest italic animate-pulse">Confirm?</span>
                  <button 
                    onClick={() => setConfirmDelete(false)} 
                    className="px-3.5 py-2 rounded-xl border border-white/5 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 text-[9px] font-black uppercase italic transition-all pointer-events-auto"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleDeleteDeck} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase italic shadow-lg shadow-red-600/30 hover:shadow-red-500/40 transition-all duration-300 pointer-events-auto active:scale-95"
                  >
                    <Trash2 size={12} />
                    Confirm Delete
                  </button>
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
