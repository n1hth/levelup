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
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-blue-400 font-black">Deck not found</p>
        <button onClick={() => navigate('/decks')} className="btn-system mt-4 px-6 py-3">Back to Decks</button>
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
        className="space-y-6 pb-8"
      >
        {/* Back */}
        <button
          onClick={() => navigate('/decks')}
          className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={14} /> All Decks
        </button>

        {/* Deck Header */}
        <div className="system-panel p-5 border-white/80 relative overflow-hidden">
          <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 -translate-y-8 translate-x-8", deck.color)} />
          <div className="flex items-start gap-4 relative z-10">
            <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white border-2 border-white shadow-xl shrink-0", deck.color)}>
              <div className="absolute inset-0 aero-gloss opacity-40 rounded-2xl" />
              <Box size={26} className="relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-blue-900 tracking-tighter leading-tight">{deck.title}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{deck.subject}</span>
                {deck.tags.map(tag => (
                  <span key={tag} className="text-[8px] font-black text-blue-300 bg-blue-50 px-1.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              {deck.description && (
                <p className="text-xs font-bold text-blue-500 mt-2 leading-relaxed">{deck.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Cards" value={stats.total.toString()} />
          <StatBox label="Due" value={stats.due.toString()} accent={stats.due > 0} />
          <StatBox label="Mastery" value={`${stats.mastery}%`} />
        </div>

        {/* Mastery Breakdown */}
        {stats.total > 0 && (
          <div className="system-panel p-4 border-white/60 space-y-2">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Mastery Breakdown</p>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              {(['new', 'learning', 'reviewing', 'mastered'] as const).map(state => {
                const count = stats.masteryBreakdown[state];
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return pct > 0 ? (
                  <div key={state} className="h-full rounded-full" style={{ width: `${pct}%`, background: getMasteryColor(state) }} />
                ) : null;
              })}
            </div>
            <div className="flex gap-3 flex-wrap">
              {(['new', 'learning', 'reviewing', 'mastered'] as const).map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: getMasteryColor(s) }} />
                  <span className="text-[8px] font-black text-blue-400 uppercase">{getMasteryLabel(s)} {stats.masteryBreakdown[s]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study CTA */}
        <button
          onClick={() => navigate(`/decks/${deck.id}/study`)}
          disabled={stats.due === 0}
          className={cn(
            "btn-system w-full py-5 text-base",
            stats.due === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <Zap size={20} fill="white" />
          {stats.due > 0 ? `Study ${stats.due} Due Card${stats.due !== 1 ? 's' : ''}` : 'No Cards Due'}
        </button>

        {stats.due === 0 && stats.total > 0 && (
          <p className="text-center text-[10px] font-bold text-blue-300 -mt-4">
            All caught up! Come back later for your next review.
          </p>
        )}

        {/* Card List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-900 flex items-center gap-2">
              <BookOpen size={12} /> All Cards ({stats.total})
            </h2>
            <button
              onClick={() => setShowAddCard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 btn-system text-[9px] py-2"
            >
              <Plus size={12} /> Add Cards
            </button>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={32} className="text-blue-200 mx-auto mb-3" />
              <p className="text-sm font-black text-blue-400">No cards yet</p>
              <button onClick={() => setShowAddCard(true)} className="mt-4 btn-system px-6 py-3 text-sm">
                <Plus size={14} /> Add First Card
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="system-panel p-4 border-white/60 flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: getMasteryColor(card.masteryState) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-blue-900 truncate">{card.front}</p>
                    <p className="text-xs font-bold text-blue-400 truncate mt-0.5">{card.back}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: getMasteryColor(card.masteryState) }}>
                        {getMasteryLabel(card.masteryState)}
                      </span>
                      {card.lastReviewedAt && (
                        <span className="text-[8px] text-blue-300 font-bold">· {getRelativeTime(card.lastReviewedAt)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="text-blue-200 hover:text-red-400 transition-colors p-1 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Deck */}
        <div className="pt-4 border-t border-blue-50">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 text-red-400 text-sm font-black hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} /> Delete Deck
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-2xl border border-blue-100 bg-white/40 text-blue-400 font-black text-sm">Cancel</button>
              <button onClick={handleDeleteDeck} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm">Delete</button>
            </div>
          )}
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
    <div className={cn("system-panel p-3 text-center border-white/50", accent && "border-orange-200 bg-orange-50/50")}>
      <div className={cn("text-xl font-black", accent ? "text-orange-500" : "text-blue-900")}>{value}</div>
      <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
