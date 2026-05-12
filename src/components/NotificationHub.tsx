import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, UserPlus, Swords, Clock } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { useNavigate } from 'react-router-dom';

export function NotificationHub() {
  const { getNotifications, acceptFriendRequest, acceptDuelInvite } = useApp();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [latestPopup, setLatestPopup] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const data = await getNotifications();
    if (data.length > notifications.length) {
      const newOne = data[0];
      setLatestPopup(newOne);
      setTimeout(() => setLatestPopup(null), 3000);
    }
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  const handleAction = async (notif: any, action: 'accept' | 'decline') => {
    if (action === 'accept') {
      if (notif.type === 'friend') {
        await acceptFriendRequest(notif.id);
      } else {
        await acceptDuelInvite(notif.id);
        navigate(`/duels/${notif.id}/${notif.deck_id || 'Syndicate Challenge'}`);
      }
    }
    fetchNotifications();
  };

  return (
    <div className="relative">
      {/* Latest Popup Alert (1 sec) */}
      <AnimatePresence>
        {latestPopup && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[280px] system-panel bg-blue-600 text-white p-4 shadow-2xl border-blue-400 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {latestPopup.type === 'friend' ? <UserPlus size={20} /> : <Swords size={20} />}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80">New Incoming</div>
              <div className="text-sm font-black uppercase">{latestPopup.type === 'friend' ? 'Friend Link' : 'Duel Request'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all",
          notifications.length > 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-white/60 text-blue-900/40 border border-white/80"
        )}
      >
        <Bell size={20} className={cn(notifications.length > 0 && "animate-pulse")} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white text-[9px] font-black flex items-center justify-center text-white">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-72 system-panel aero-gloss border-white/80 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/40 bg-white/20 flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Notification Hub</span>
                <Clock size={14} className="text-blue-400" />
              </div>

              <div className="max-h-[350px] overflow-y-auto p-2 space-y-2 no-scrollbar">
                {notifications.length > 0 ? notifications.map(notif => (
                  <div key={notif.id} className="p-3 rounded-2xl bg-white/60 border border-white shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", notif.type === 'friend' ? "bg-emerald-500" : "bg-blue-600")}>
                        {notif.type === 'friend' ? <UserPlus size={18} /> : <Swords size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-blue-900 uppercase truncate">{notif.sender}</div>
                        <div className="text-[8px] font-bold text-blue-400 uppercase tracking-tight">{notif.type === 'friend' ? 'Wants to Link' : 'Challenged You'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAction(notif, 'accept')}
                        className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleAction(notif, 'decline')}
                        className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-40">
                    <Bell size={32} className="mx-auto mb-2" />
                    <div className="text-[10px] font-black uppercase tracking-widest">No Alerts Detected</div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
