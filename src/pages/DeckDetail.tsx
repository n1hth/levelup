import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Zap, Trash2, BookOpen, Box } from 'lucide-react';
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
        <button onClick={() => navigate('/decks')} className="btn-system mt-8 px-8 py-4 bg-white/5 tracking-[0.3em]">RETURN TO ARCHIVES</button>
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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8 pb-32"
      >
        {/* Back */}
        <button
          onClick={() => navigate('/decks')}
          className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-cyan-400 transition-colors italic group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Archives
        </button>

        {/* Deck Header */}
        <div className="system-panel p-6 border-white/5 relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl group">
          <div className={cn("absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity", deck.color)} />
          <div className="flex items-start gap-6 relative z-10">
            <div className={cn("w-20 h-20 rounded-[2rem] bg-gradient-to-br flex items-center justify-center text-white border border-white/20 shadow-2xl shrink-0 group-hover:scale-105 transition-transform", deck.color)}>
              <div className="absolute inset-0 bg-black/10 rounded-[2rem]" />
              <Box size={40} className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic">{deck.subject || 'Unclassified Domain'}</span>
              <h1 className="text-4xl font-black text-white tracking-tighter leading-none italic uppercase mt-1 mb-3">{deck.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                {deck.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-black text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-3 py-1 rounded-lg uppercase tracking-widest italic">{tag}</span>
                ))}
              </div>
              {deck.description && (
                <p className="text-[11px] font-bold text-white/40 mt-4 leading-relaxed italic border-l-2 border-white/5 pl-4">{deck.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Total Slices" value={stats.total.toString()} />
          <StatBox label="Pending Sync" value={stats.due.toString()} accent={stats.due > 0} />
          <StatBox label="Optimization" value={`${stats.mastery}%`} />
        </div>

        {/* Mastery Breakdown */}
        {stats.total > 0 && (
          <div className="system-panel p-5 border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex justify-between items-center px-1">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] italic">Neural Distribution</p>
              <span className="text-[10px] font-black text-cyan-400 italic">HEALTHY</span>
            </div>
            <div className="flex gap-1.5 h-3 rounded-full overflow-hidden p-0.5 bg-white/[0.03] border border-white/5">
              {(['new', 'learning', 'reviewing', 'mastered'] as const).map(state => {
                const count = stats.masteryBreakdown[state];
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return pct > 0 ? (
                  <motion.div 
                    key={state} 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className="h-full rounded-full shadow-[0_0_10px_currentColor]/20" 
                    style={{ background: getMasteryColor(state), color: getMasteryColor(state) }} 
                  />
                ) : null;
              })}
            </div>
            <div className="flex gap-4 flex-wrap px-1">
              {(['new', 'learning', 'reviewing', 'mastered'] as const).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ background: getMasteryColor(s), color: getMasteryColor(s) }} />
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.1em] italic">{getMasteryLabel(s)} <span className="text-white/40">{stats.masteryBreakdown[s]}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study CTA */}
        <motion.button
          whileHover={{ scale: 1.01, boxShadow: stats.due > 0 ? '0 0 40px rgba(6,182,212,0.2)' : 'none' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/decks/${deck.id}/study`)}
          disabled={stats.due === 0}
          className={cn(
            "w-full py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.5em] italic flex items-center justify-center gap-4 transition-all relative overflow-hidden group",
            stats.due > 0 
              ? "bg-cyan-600 text-white border border-cyan-400/30 shadow-2xl" 
              : "bg-white/[0.02] text-white/10 border border-white/5 cursor-not-allowed shadow-none"
          )}
        >
          {stats.due > 0 && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
          <Zap size={20} className={stats.due > 0 ? "text-white" : "text-white/10"} />
          <span>{stats.due > 0 ? `INITIATE SYNC: ${stats.due} FRAGMENTS` : 'NO DATA PENDING'}</span>
        </motion.button>

        {stats.due === 0 && stats.total > 0 && (
          <p className="text-center text-[10px] font-black text-cyan-400/40 uppercase tracking-[0.3em] italic -mt-4">
            System Optimized. Awaiting next synchronization cycle.
          </p>
        )}

        {/* Card List */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 italic flex items-center gap-3">
              <BookOpen size={14} className="text-cyan-400/50" /> ARCHIVED SLICES <span className="text-white/5 text-[10px]">({stats.total})</span>
            </h2>
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.08] hover:border-cyan-400/30 transition-all group"
            >
              <Plus size={14} className="text-cyan-400 group-hover:rotate-90 transition-transform" />
              <span className="text-[9px] font-black text-white tracking-[0.2em] uppercase italic">Add Fragment</span>
            </button>
          </div>

          {cards.length === 0 ? (
            <div className="system-panel p-16 text-center border-white/5 bg-white/[0.01]">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-6">
                <BookOpen size={32} className="text-white/5" />
              </div>
              <p className="text-xs font-black text-white/20 uppercase tracking-[0.3em] italic mb-8 underline decoration-white/5 decoration-dashed underline-offset-8">No Slices archvied in this domain</p>
              <button onClick={() => setShowAddCard(true)} className="btn-system px-8 py-4 bg-cyan-600/20 text-cyan-400 border border-cyan-400/20 text-[10px] tracking-[0.3em] uppercase italic">
                <Plus size={14} /> INSERT FIRST FRAGMENT
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="system-panel p-5 border-white/5 bg-white/[0.02] flex items-start gap-5 hover:border-white/10 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/[0.02] to-cyan-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_currentColor]" style={{ background: getMasteryColor(card.masteryState), color: getMasteryColor(card.masteryState) }} />
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-base font-black text-white tracking-tighter italic uppercase">{card.front}</p>
                    <p className="text-[11px] font-bold text-white/40 mt-1 leading-relaxed italic">{card.back}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: getMasteryColor(card.masteryState) }}>
                        {getMasteryLabel(card.masteryState)}
                      </span>
                      {card.lastReviewedAt && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-white/5" />
                          <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.1em] italic">Last Synced: {getRelativeTime(card.lastReviewedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="text-white/5 hover:text-red-500 transition-colors p-2 shrink-0 group-hover:text-white/20 relative z-10"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-12">
          <div className="system-panel p-6 border-red-500/10 bg-red-500/[0.02] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-red-500 uppercase tracking-[0.4em] italic leading-none">Termination Protocol</h3>
                <p className="text-[10px] font-bold text-red-500/30 uppercase mt-2 italic">Purge this knowledge domain from neural network</p>
              </div>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-6 py-3 rounded-xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all italic active:scale-95"
                >
                  INITIATE PURGE
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(false)} className="px-5 py-3 rounded-xl border border-white/5 bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest italic">Abort</button>
                  <button onClick={handleDeleteDeck} className="px-5 py-3 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 italic">Confirm Purge</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddCard && <CreateCardModal deckId={deck.id} onClose={() => setShowAddCard(false)} />}
      </AnimatePresence>
    </>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      "system-panel p-5 text-center border-white/5 relative group overflow-hidden transition-all bg-white/[0.02]",
      accent && "border-red-500/20 bg-red-500/[0.01]"
    )}>
      <div className={cn(
        "text-3xl font-black italic tracking-tighter leading-none mb-2", 
        accent ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse" : "text-white"
      )}>{value}</div>
      <div className={cn(
        "text-[9px] font-black uppercase tracking-[0.3em] italic leading-none",
        accent ? "text-red-500/60" : "text-white/20"
      )}>{label}</div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
