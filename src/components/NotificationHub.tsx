import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, UserPlus, Swords, Clock } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

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
      setTimeout(() => setLatestPopup(null), 5000); // 5s popup
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
        navigate(`/duels/${notif.duel_id}`);
      }
    }
    fetchNotifications();
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all active:scale-90",
          notifications.length > 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40" : "bg-white/60 text-blue-900/40 border border-white/80"
        )}
      >
        <Bell size={20} className={cn(notifications.length > 0 && "animate-pulse")} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white text-[9px] font-black flex items-center justify-center text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {/* PORTALED OVERLAYS */}
      {createPortal(
        <div id="notification-portal-root">
          {/* LATEST POPUP */}
          <AnimatePresence>
            {latestPopup && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-8 left-5 right-5 z-[10001] system-panel bg-blue-600 text-white p-4 shadow-2xl border-blue-400 flex items-center gap-4 cursor-pointer"
                onClick={() => setIsOpen(true)}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  {latestPopup.type === 'friend' ? <UserPlus size={24} /> : <Swords size={24} />}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Incoming Transmission</div>
                  <div className="text-sm font-black uppercase tracking-tight">{latestPopup.type === 'friend' ? 'Syndicate Link Request' : 'Duel Challenge Issued'}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL SCREEN OVERLAY */}
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[10002] flex items-center justify-center p-5">
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="absolute inset-0 bg-blue-950/40 backdrop-blur-xl" 
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-sm system-panel aero-gloss border-white/40 shadow-[0_30px_60px_rgba(0,0,0,0.3)] z-10 overflow-hidden flex flex-col max-h-[80vh]"
                >
                  <div className="p-6 border-b border-white/20 bg-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-blue-900 uppercase tracking-tighter">System Logs</h3>
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Notification History</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl bg-blue-50 text-blue-400 hover:bg-blue-100 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {notifications.length > 0 ? notifications.map(notif => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={notif.id} 
                        className="p-4 rounded-3xl bg-white/80 border border-white shadow-sm flex flex-col gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", 
                            notif.type === 'friend' ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-blue-500 to-blue-700"
                          )}>
                            {notif.type === 'friend' ? <UserPlus size={22} /> : <Swords size={22} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-blue-900 uppercase tracking-tight truncate">{notif.sender}</div>
                            <div className="text-[9px] font-black text-blue-400 uppercase tracking-[0.1em]">
                              {notif.type === 'friend' ? 'Syndicate Link Request' : 'Duel Challenge Issued'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAction(notif, 'accept')}
                            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                          >
                            Accept Protocol
                          </button>
                          <button 
                            onClick={() => handleAction(notif, 'decline')}
                            className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-200">
                          <Bell size={40} />
                        </div>
                        <div className="text-sm font-black text-blue-900 uppercase tracking-tighter">System Idle</div>
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">No alerts detected</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50/30 border-t border-white/20 text-center">
                    <p className="text-[8px] font-black text-blue-300 uppercase tracking-[0.3em]">Advanced Combat Link v1.0</p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  );
}
