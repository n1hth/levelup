import { motion } from 'motion/react';
import { Clock, Trophy, Flame, Zap, Activity } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { formatDuration, getRelativeTime } from '@/src/lib/utils.ts';

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
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={<Clock size={16} className="text-blue-400" />} 
          label="Today" 
          value={todayTime > 0 ? formatDuration(todayTime) : '0m'} 
          sub={`${todaySessions} session${todaySessions !== 1 ? 's' : ''}`}
        />
        <StatCard 
          icon={<Trophy size={16} className="text-yellow-400" />} 
          label="Record" 
          value={longestSession > 0 ? formatDuration(longestSession) : '—'} 
          sub="Longest session"
        />
        <StatCard 
          icon={<Flame size={16} className="text-orange-400" />} 
          label="Streak" 
          value={`${focusStreak}`} 
          sub="Consecutive days"
        />
        <StatCard 
          icon={<Zap size={16} className="text-purple-400" />} 
          label="Total" 
          value={state.focusSessions.length.toString()} 
          sub="All sessions"
        />
      </div>

      {/* Weekly Activity Chart */}
      <div className="system-panel p-5 border-white/60">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={14} className="text-blue-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">This Week</h3>
        </div>
        <div className="flex items-end gap-2 h-20">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: d.minutes > 0 ? `${Math.max((d.minutes / maxMinutes) * 100, 8)}%` : '4px' }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className={`w-full rounded-lg ${
                  d.minutes > 0 
                    ? 'bg-gradient-to-t from-blue-500 to-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]' 
                    : 'bg-blue-100'
                }`}
                style={{ minHeight: d.minutes > 0 ? '8px' : '4px' }}
              />
              <span className="text-[8px] font-black text-blue-400">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 px-1 flex items-center gap-2">
            <Clock size={12} /> Recent Sessions
          </h3>
          {recentSessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 bg-white/40 border border-white/60 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[9px] font-black ${
                  session.isCompleted ? 'bg-emerald-500' : 'bg-blue-400'
                }`}>
                  {session.isCompleted ? '✓' : '—'}
                </div>
                <div>
                  <div className="text-xs font-black text-blue-900">
                    {formatDuration(session.actualDuration)}
                    {session.noPauseChallenge && session.pauseCount === 0 && (
                      <span className="ml-2 text-[8px] bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full font-black">NO-PAUSE</span>
                    )}
                  </div>
                  <div className="text-[9px] font-bold text-blue-400">{getRelativeTime(session.completedAt)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-blue-600">+{session.xpEarned} XP</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="system-panel p-4 border-white/50 relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center border border-blue-50">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black text-blue-900 mb-0.5">{value}</div>
      <div className="text-[9px] font-bold text-blue-300 uppercase truncate">{sub}</div>
    </div>
  );
}
