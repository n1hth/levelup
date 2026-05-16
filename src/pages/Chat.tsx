import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Send, Trash2, AtSign, Check, CheckCheck } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/src/lib/store.tsx';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils.ts';

function SmallOrb({ state = 'idle', size = 36 }: { state?: string; size?: number }) {
  const getGlowColor = () => {
    switch(state) {
      case 'active': return 'rgba(34,211,238,0.5)';
      case 'battle': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(34,211,238,0.2)';
    }
  };

  const getOrbGradient = () => {
    switch(state) {
      case 'active': return 'radial-gradient(circle at 30% 30%, #ffffff 0%, #a5f3fc 20%, #06b6d4 50%, #0891b2 100%)';
      case 'battle': return 'radial-gradient(circle at 30% 30%, #ffffff 0%, #fecaca 20%, #ef4444 50%, #b91c1c 100%)';
      default: return 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e2e8f0 20%, #94a3b8 50%, #475569 100%)';
    }
  };

  return (
    <div 
      className="rounded-full relative shrink-0 shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        boxShadow: `0 0 15px ${getGlowColor()}`,
        background: getOrbGradient()
      }}
    >
      <div className="absolute inset-0 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)] rounded-full pointer-events-none" />
      <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/60 blur-[1px] -rotate-[35deg]" />
    </div>
  );
}

export function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { state, getMessages, sendMessage, setOrbHidden, getFriends, markMessagesAsRead } = useApp();
  const [messages, setMessages] = useState<{ id: string; sender_id: string; receiver_id: string; content: string; created_at: string; is_read: boolean }[]>([]);
  const [dmInput, setDmInput] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrbHidden(true);
    return () => setOrbHidden(false);
  }, [setOrbHidden]);

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
  }, [messages]);

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

  return createPortal(
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
            <div className="w-10 h-10 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center font-black text-sm text-cyan-400 italic">
              {friend?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <div className="text-[13px] font-black text-white uppercase italic tracking-tight leading-none mb-1">
                {friend?.name || 'Direct Link'}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-cyan-400" />
                <div className="text-[8px] font-black text-cyan-400/40 uppercase tracking-widest italic">Encrypted Connection</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button className="p-2.5 text-white/20 hover:text-white transition-colors"><AtSign size={18} /></button>
          <button className="p-2.5 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar">
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === state.user?.id;
          const isLastMessage = i === messages.length - 1;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id || i} 
              className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
            >
              <div className={cn(
                "group relative max-w-[85%] px-5 py-4 rounded-2xl text-[11px] font-black uppercase italic tracking-tight leading-relaxed transition-all shadow-xl",
                isMe 
                  ? "bg-white text-black rounded-tr-none" 
                  : "bg-white/[0.03] text-white/90 border border-white/5 rounded-tl-none"
              )}>
                {msg.content}
              </div>
              <div className={cn("mt-1.5 flex items-center gap-1.5", isMe ? "justify-end" : "justify-start")}>
                <span className="text-[7px] font-black text-white/10 uppercase tracking-widest italic">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMe && isLastMessage && (
                  <span className={cn(
                    "text-[7px] font-black uppercase tracking-widest italic",
                    msg.is_read ? "text-cyan-400" : "text-white/20"
                  )}>
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
            <SmallOrb state={dmInput ? "active" : "idle"} size={52} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-active:scale-90 transition-transform">
              <Send size={18} className={cn("stroke-[2.5] transition-colors", dmInput ? "text-black" : "text-white/40")} />
            </div>
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
