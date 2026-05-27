import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Send, User, Swords, Timer, X } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/src/lib/store.tsx';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils.ts';
import { getOrbGradient, getOrbColors } from '@/src/lib/orb-color';
import { createDuelRetryCardContent, parseDuelRetryCardContent, type DuelRetryCardPayload } from '@/src/lib/duel-retry-card';

function SmallOrb({ hue = 200, state = 'idle', size = 36 }: { hue?: number; state?: string; size?: number }) {
  const palette = getOrbColors(hue, 'idle');
  const gradient = getOrbGradient(hue, 'idle', 'E');

  return (
    <div 
      className="rounded-full relative shrink-0 shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        boxShadow: `0 0 15px ${palette.glow}`,
        background: gradient
      }}
    >
      <div className="absolute inset-0 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)] rounded-full pointer-events-none" />
      <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[1px] -rotate-[35deg]" />
    </div>
  );
}

function getExpiryLabel(expiresAt: string, now: number) {
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return 'Expired';
  return `${Math.ceil(remaining / 60000)}m left`;
}

function DuelRetryMessageCard({
  payload,
  isMe,
  isExpired,
  isStarting,
  hasStarted,
  expiryLabel,
  accent,
  onStart
}: {
  payload: DuelRetryCardPayload;
  isMe: boolean;
  isExpired: boolean;
  isStarting: boolean;
  hasStarted: boolean;
  expiryLabel: string;
  accent: string;
  onStart: () => void;
}) {
  return (
    <div className={cn(
      "group relative w-[min(86vw,360px)] rounded-2xl border p-4 shadow-2xl transition-all",
      isMe
        ? "bg-white text-black border-white/20 rounded-tr-none"
        : "bg-cyan-500/[0.06] text-white border-cyan-400/20 rounded-tl-none"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isMe ? "bg-black text-white" : "bg-cyan-400/15 text-cyan-300"
        )}>
          <Swords size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn(
            "text-[9px] font-black uppercase tracking-[0.2em] mb-1",
            isMe ? "text-black/45" : "text-cyan-300/60"
          )}>
            Duel Retry Card
          </div>
          <div className={cn(
            "text-[12px] font-black uppercase italic tracking-tight leading-snug break-words",
            isMe ? "text-black" : "text-white"
          )}>
            {payload.message}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest italic",
          isExpired ? "text-red-400" : isMe ? "text-black/40" : "text-white/35"
        )}>
          <Timer size={11} />
          {expiryLabel}
        </div>
        <div className="flex-1" />
        {isMe ? (
          <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: isExpired ? '#f87171' : accent }}>
            {isExpired ? 'Closed' : 'Waiting'}
          </span>
        ) : (
          <button
            onClick={onStart}
            disabled={isExpired || isStarting || hasStarted}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.18em] transition-all active:scale-95 disabled:cursor-not-allowed",
              isExpired
                ? "bg-red-500/10 text-red-300/50"
                : hasStarted
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
            )}
          >
            {isExpired ? 'Expired' : hasStarted ? 'Opening' : isStarting ? 'Sending' : 'Duel'}
          </button>
        )}
      </div>
    </div>
  );
}

export function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, getMessages, sendMessage, setOrbHidden, getFriends, markMessagesAsRead, getOrbHue, createDuel } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [dmInput, setDmInput] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const [showDuelRetryComposer, setShowDuelRetryComposer] = useState(false);
  const [duelRetryDraft, setDuelRetryDraft] = useState('You tried to duel. Can we run it now?');
  const [now, setNow] = useState(Date.now());
  const [startingCardId, setStartingCardId] = useState<string | null>(null);
  const [startedCardIds, setStartedCardIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const retryInputRef = useRef<HTMLTextAreaElement>(null);
  
  const myHue = getOrbHue();
  const friendHue = friend?.orb_hue || 200;
  const friendPalette = useMemo(() => getOrbColors(friendHue, 'idle'), [friendHue]);
  const myPalette = useMemo(() => getOrbColors(myHue, 'idle'), [myHue]);

  useEffect(() => {
    setOrbHidden(true);
    return () => setOrbHidden(false);
  }, [setOrbHidden]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const retry = (location.state as any)?.duelRetry;
    if (!retry || !userId || retry.senderId !== userId) return;

    setDuelRetryDraft('You tried to duel. Can we run it now?');
    setShowDuelRetryComposer(true);
    navigate(location.pathname, { replace: true, state: null });
    setTimeout(() => retryInputRef.current?.focus(), 120);
  }, [location.pathname, location.state, navigate, userId]);

  useEffect(() => {
    if (userId) {
      getFriends().then(friends => {
        const found = friends.find((f: any) => f.id === userId);
        if (found) {
          setFriend(found);
        } else {
          // If not found in friends, could still be a valid user
          setFriend({ name: 'Direct Link', id: userId });
        }
      });

      getMessages(userId).then(data => {
        setMessages(data || []);
        markMessagesAsRead(userId);
      });

      const channel = supabase
        .channel(`messages:${userId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any;
            if ((newMsg.sender_id === userId && newMsg.receiver_id === state.user?.id) || 
                (newMsg.sender_id === state.user?.id && newMsg.receiver_id === userId)) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && newMsg.sender_id === state.user?.id))) {
                  // Replace optimistic update with real DB record
                  return prev.map(m => m.content === newMsg.content && m.sender_id === state.user?.id ? newMsg : m);
                }
                return [...prev, newMsg];
              });
              if (newMsg.sender_id === userId) {
                markMessagesAsRead(userId);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as any;
            console.log("Message Updated (Read Receipt):", updatedMsg);
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
            ));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, getMessages, state.user?.id, getFriends]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showDuelRetryComposer]);

  useEffect(() => {
    if (userId && messages.length > 0) {
      const hasUnread = messages.some(m => m.sender_id === userId && !m.is_read);
      if (hasUnread) {
        markMessagesAsRead(userId);
      }
    }
  }, [messages, userId, markMessagesAsRead]);

  const handleSend = async () => {
    if (dmInput && userId) {
      const content = dmInput;
      setDmInput('');
      
      // Optimistic UI update
      const tempId = Math.random().toString();
      setMessages(prev => [...prev, {
        id: tempId,
        sender_id: state.user!.id,
        receiver_id: userId,
        content: content,
        created_at: new Date().toISOString(),
        is_read: false
      }]);

      await sendMessage(userId, content);
      
      // Force input to stay focused
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleSendDuelRetryCard = async () => {
    if (!userId || !state.user) return;

    const content = createDuelRetryCardContent(duelRetryDraft);
    const createdAt = new Date().toISOString();
    const tempId = `duel-retry-${Date.now()}`;

    setShowDuelRetryComposer(false);
    setMessages(prev => [...prev, {
      id: tempId,
      sender_id: state.user!.id,
      receiver_id: userId,
      content,
      created_at: createdAt,
      is_read: false
    }]);

    await sendMessage(userId, content);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleStartDuelFromCard = async (msg: any, payload: DuelRetryCardPayload) => {
    if (!state.user || state.user.id === msg.sender_id) return;
    if (new Date(payload.expiresAt).getTime() <= Date.now()) return;

    const cardId = String(msg.id || payload.createdAt);
    setStartingCardId(cardId);
    try {
      const duelId = await createDuel('writing', msg.sender_id);
      if (!duelId) throw new Error('Could not create duel invite.');
      setStartedCardIds(prev => new Set(prev).add(cardId));
      navigate(`/duels/${duelId}`);
    } catch (err: any) {
      alert(err?.message || 'Could not send duel invite.');
    } finally {
      setStartingCardId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="p-6 pt-12 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors">
            <ChevronRight size={22} className="rotate-180" />
          </button>
          <div className="flex items-center gap-3">
            <SmallOrb hue={friendHue} size={40} />
            <div>
              <div className="text-[13px] font-black text-white uppercase italic tracking-tight leading-none mb-1">
                {friend?.name || 'Direct Link'}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ background: friendPalette.accent }} />
                <div className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: friendPalette.accent, opacity: 0.5 }}>Direct Message</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => navigate(`/profile/${userId}`)}
            className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest italic text-white/60 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-2"
          >
            <User size={12} />
            View Profile
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar">
        {(messages || []).filter(Boolean).map((msg, i) => {
          const isMe = msg.sender_id === state.user?.id;
          const isLastMessage = i === messages.length - 1;
          const duelRetryCard = parseDuelRetryCardContent(msg.content);
          const cardId = String(msg.id || duelRetryCard?.createdAt || i);
          const isExpired = duelRetryCard ? new Date(duelRetryCard.expiresAt).getTime() <= now : false;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id || i} 
              className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
            >
              {duelRetryCard ? (
                <DuelRetryMessageCard
                  payload={duelRetryCard}
                  isMe={isMe}
                  isExpired={isExpired}
                  isStarting={startingCardId === cardId}
                  hasStarted={startedCardIds.has(cardId)}
                  expiryLabel={getExpiryLabel(duelRetryCard.expiresAt, now)}
                  accent={myPalette.accent}
                  onStart={() => handleStartDuelFromCard(msg, duelRetryCard)}
                />
              ) : (
                <div className={cn(
                  "group relative max-w-[85%] px-5 py-4 rounded-2xl text-[11px] font-black uppercase italic tracking-tight leading-relaxed transition-all shadow-xl break-words",
                  isMe 
                    ? "bg-white text-black rounded-tr-none" 
                    : "bg-white/[0.03] text-white/90 border border-white/5 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              )}
              <div className={cn("mt-1.5 flex items-center gap-1.5", isMe ? "justify-end" : "justify-start")}>
                <span className="text-[7px] font-black text-white/10 uppercase tracking-widest italic">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMe && isLastMessage && (
                  <span className={cn(
                    "text-[7px] font-black uppercase tracking-widest italic",
                    !msg.is_read && "text-white/20"
                  )}
                  style={msg.is_read ? { color: myPalette.accent } : undefined}
                  >
                    {msg.is_read ? 'Seen' : 'Sent'}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-6 pb-10 bg-black border-t border-white/5">
        <AnimatePresence>
          {showDuelRetryComposer && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] p-4 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/15 text-cyan-300 flex items-center justify-center shrink-0">
                  <Swords size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300/70">Missed Duel Reply</div>
                    <button
                      onClick={() => setShowDuelRetryComposer(false)}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] text-white/35 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <textarea
                    ref={retryInputRef}
                    value={duelRetryDraft}
                    onChange={e => setDuelRetryDraft(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[11px] font-black uppercase italic tracking-tight leading-relaxed text-white outline-none focus:border-cyan-300/30"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest italic text-white/35">
                      <Timer size={11} />
                      Expires after 15m
                    </div>
                    <div className="flex-1" />
                    <button
                      onClick={handleSendDuelRetryCard}
                      className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-[9px] font-black uppercase tracking-[0.18em] hover:bg-cyan-300 transition-all active:scale-95"
                    >
                      Send Card
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative flex items-center gap-4">
          <div className="flex-1 relative">
            <input 
              ref={inputRef}
              type="text" 
              value={dmInput}
              onChange={e => setDmInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent mobile keyboard from closing
                  handleSend();
                }
              }}
              placeholder="Type message..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-full py-4.5 px-6 outline-none focus:border-cyan-400/20 focus:bg-white/[0.04] transition-all text-white placeholder:text-white/10 font-black text-[11px] uppercase italic tracking-widest"
            />
          </div>
          <button 
            onMouseDown={e => e.preventDefault()}
            onTouchStart={e => e.preventDefault()}
            onClick={handleSend}
            className="group relative"
          >
            <SmallOrb hue={myHue} state={dmInput ? "active" : "idle"} size={52} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-active:scale-90 transition-transform">
              <Send size={18} className={cn("stroke-[2.5] transition-colors", dmInput ? "text-black" : "text-white/40")} />
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
