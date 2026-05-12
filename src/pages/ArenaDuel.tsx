import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Timer, Trophy, Shield, AlertCircle, Send } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';
import { supabase } from '@/src/lib/supabase';

export function ArenaDuel() {
  const { opponentId, topic } = useParams();
  const navigate = useNavigate();
  const { state, addXp } = useApp();
  
  const [timeLeft, setTimeLeft] = useState(90);
  const [answer, setAnswer] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [opponentProgress, setOpponentProgress] = useState(0); // 0-100%

  useEffect(() => {
    // Fetch opponent name
    if (opponentId) {
      supabase.from('profiles').select('name').eq('id', opponentId).single().then(({ data }) => {
        if (data) setOpponentName(data.name);
      });
    }

    // Timer logic
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Mock opponent progress (in a real app, this would be real-time sync)
    const progInterval = setInterval(() => {
      setOpponentProgress(p => Math.min(p + Math.random() * 5, 100));
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(progInterval);
    };
  }, [opponentId]);

  const handleFinish = () => {
    setIsFinished(true);
    addXp(500); // Massive XP for completing a duel
    alert("Duel Completed! Reviewing results...");
    navigate('/battle');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col font-sans">
      {/* HUD */}
      <header className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center border border-white/20 shadow-lg shadow-blue-500/20">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Syndicate Duel</h3>
            <p className="text-lg font-black tracking-tight uppercase italic">Arena #{Math.floor(Math.random() * 9999)}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-20 h-20 rounded-full border-4 flex items-center justify-center relative",
            timeLeft < 20 ? "border-red-500 animate-pulse" : "border-blue-500"
          )}>
            <Timer className={cn("absolute -top-2 bg-slate-900 px-1", timeLeft < 20 ? "text-red-500" : "text-blue-500")} size={20} />
            <span className={cn("text-2xl font-black", timeLeft < 20 ? "text-red-500" : "text-white")}>{timeLeft}s</span>
          </div>
        </div>

        <div className="text-right">
          <h3 className="text-xs font-black text-red-400 uppercase tracking-widest">Target</h3>
          <p className="text-lg font-black tracking-tight uppercase italic">{opponentName}</p>
        </div>
      </header>

      {/* Main Duel Interface */}
      <main className="flex-1 flex flex-col gap-6">
        <div className="bg-slate-800/50 border border-white/10 rounded-[32px] p-8 relative overflow-hidden backdrop-blur-xl">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
           
           <div className="flex items-center gap-2 mb-4">
             <AlertCircle size={14} className="text-blue-400" />
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Intelligence Briefing</span>
           </div>
           
           <h2 className="text-2xl font-black mb-2 tracking-tight uppercase italic">Topic: {topic || 'Universal Logic'}</h2>
           <p className="text-sm text-slate-400 font-medium leading-relaxed">
             Provide a comprehensive explanation and analysis of the subject above. Your response will be peer-reviewed by the community for accuracy and depth.
           </p>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-400 px-1">
              <span>You (Operator)</span>
              <span>{Math.round((answer.length / 500) * 100)}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min((answer.length / 500) * 100, 100)}%` }}
                 className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
               />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-400 px-1">
              <span>{opponentName} (Target)</span>
              <span>{Math.round(opponentProgress)}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${opponentProgress}%` }}
                 className="h-full bg-gradient-to-r from-red-600 to-orange-400"
               />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-1 flex flex-col gap-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isFinished}
            placeholder="SYSTEM READY... START TYPING YOUR RESPONSE..."
            className="flex-1 w-full bg-slate-800/80 border-2 border-white/5 rounded-[24px] p-6 text-lg font-bold placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all resize-none shadow-2xl no-scrollbar"
          />
          
          <button
            onClick={handleFinish}
            disabled={isFinished || answer.length < 20}
            className={cn(
              "w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95",
              answer.length >= 20 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20" : "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
            )}
          >
            <Send size={20} />
            Transmit Data
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-6 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-yellow-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reward: 500 XP</span>
        </div>
        <div className="flex items-center gap-2">
          <Swords size={14} className="text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bet: Rank Points</span>
        </div>
      </footer>
    </div>
  );
}
