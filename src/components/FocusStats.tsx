import { motion } from 'motion/react';
import { Clock, Trophy, Flame, Zap, Activity } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { formatDuration, getRelativeTime, cn } from '@/src/lib/utils.ts';

export function FocusStats() {
  const { 
    state, 
    getTodayFocusTime, 
    getTodaySessionCount, 
    getLongestSession, 
    getFocusStreak,
    getWeeklyFocusData,
  } = useApp();

  const todayTime = getTodayFocusTime();
  const todaySessions = getTodaySessionCount();
  const longestSession = getLongestSession();
  const focusStreak = getFocusStreak();
  const weeklyData = getWeeklyFocusData();
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);

  const recentSessions = state.focusSessions.slice(0, 5);

  return (
    <div className="space-y-10">
      {/* Quick Stats Grid - More elegant, less boxed */}
      <div className="grid grid-cols-4 gap-4 px-1">
        <StatCard 
          icon={<Clock size={12} className="text-cyan-400" />} 
          label="TODAY" 
          value={todayTime > 0 ? formatDuration(todayTime) : '0M'} 
        />
        <StatCard 
          icon={<Trophy size={12} className="text-cyan-400" />} 
          label="RECORD" 
          value={longestSession > 0 ? formatDuration(longestSession) : '—'} 
        />
        <StatCard 
          icon={<Flame size={12} className="text-cyan-400" />} 
          label="STREAK" 
          value={`${focusStreak}`} 
        />
        <StatCard 
          icon={<Zap size={12} className="text-cyan-400" />} 
          label="TOTAL" 
          value={state.focusSessions.length.toString()} 
        />
      </div>

      {/* Weekly Activity Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 italic">Activity Protocol</h3>
          </div>
          <span className="text-[10px] font-black text-white/20 tabular-nums italic">{todayTime > 0 ? formatDuration(todayTime) : '0M'}</span>
        </div>
        
        <div className="flex items-end gap-2.5 h-16 group/chart px-2">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
               <div className="w-full relative flex flex-col items-center justify-end h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: d.minutes > 0 ? `${Math.max((d.minutes / maxMinutes) * 100, 10)}%` : '2px' }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className={cn(
                      "w-full rounded-sm transition-all duration-500",
                      d.minutes > 0 
                        ? 'bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                        : 'bg-white/5 opacity-50 group-hover/chart:opacity-100'
                    )}
                  />
               </div>
               <span className="text-[7px] font-black text-white/10 uppercase tracking-tighter italic">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 px-1">
            <Clock size={12} className="text-white/20" />
            <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">Transaction Logs</h3>
          </div>
          <div className="space-y-2">
            {recentSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl group hover:border-cyan-400/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border text-[9px] font-black shadow-inner",
                    session.isCompleted ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-white/5 border-white/10 text-white/40'
                  )}>
                    {session.isCompleted ? '✓' : '—'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white italic flex items-center gap-2">
                      {formatDuration(session.actualDuration)}
                      {session.noPauseChallenge && session.pauseCount === 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,1)]" />
                      )}
                    </div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-0.5">{getRelativeTime(session.completedAt)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-cyan-400 italic">+{session.xpEarned} XP</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center group">
      <div className="mb-2 opacity-20 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100">{icon}</div>
      <div className="text-sm  font-black text-white italic tabular-nums leading-none mb-1.5">{value}</div>
      <div className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] italic leading-none">{label}</div>
    </div>
  );
}
