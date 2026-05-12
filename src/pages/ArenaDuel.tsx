import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Timer, Trophy, Shield, AlertCircle, Send, BookOpen, Check, X, Users, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils.ts';

type DuelPhase = 'LOBBY' | 'EXCHANGE' | 'TRIAL' | 'REVIEW' | 'COMMUNITY' | 'RESULTS';

export function ArenaDuel() {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  
  // FOR THE UI-FIRST BUILD: We will use a local state to toggle phases for your review
  const [phase, setPhase] = useState<DuelPhase>('LOBBY');
  const [duelMode, setDuelMode] = useState<'writing' | 'deck'>('writing');
  const [localInput, setLocalInput] = useState('');

  // UI-ONLY Mock Data
  const opponent = { name: 'Viper_Hunter_X', rank: 'S' };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
      {/* ═══ SYSTEM HEADER ═══ */}
      <header className="p-6 flex items-center justify-between z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Channel_Duel_{duelId?.slice(0,4)}</div>
            <h1 className="text-lg font-black uppercase italic tracking-tighter text-white">{phase}</h1>
          </div>
        </div>

        {/* Phase Debugger (Will be removed after you approve UI) */}
        <div className="flex gap-1">
          {['LOBBY', 'EXCHANGE', 'TRIAL', 'REVIEW', 'COMMUNITY'].map(p => (
            <button key={p} onClick={() => setPhase(p as DuelPhase)} className={cn("px-2 py-1 rounded text-[8px] font-black", phase === p ? "bg-white text-slate-950" : "bg-white/5 text-white/40")}>
              {p.charAt(0)}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col z-10 max-w-lg mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          
          {/* ═══ 1. LOBBY UI ═══ */}
          {phase === 'LOBBY' && (
            <motion.div key="lobby" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-64 h-64 rounded-full border-2 border-dashed border-blue-500/20 flex items-center justify-center" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-dashed border-red-500/10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-blue-600/10 border-4 border-blue-500 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                    <Loader2 size={48} className="text-blue-500 animate-spin mb-2" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Neural Link</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">Waiting for <br/> <span className="text-blue-500">Opponent...</span></h2>
                <div className="flex items-center justify-center gap-3 bg-white/5 py-3 px-6 rounded-2xl border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connection Stable</span>
                </div>
              </div>

              <button onClick={() => navigate('/battle')} className="w-full py-5 rounded-2xl bg-red-950/30 border-2 border-red-500/50 text-red-500 font-black uppercase text-[10px] tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all">Abort Combat Link</button>
            </motion.div>
          )}

          {/* ═══ 2. EXCHANGE UI ═══ */}
          {phase === 'EXCHANGE' && (
            <motion.div key="exchange" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col space-y-6">
              <div className="system-panel p-8 bg-blue-600/5 border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter text-white">Deploy <br/> Subject</h2>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Universal Mode: {duelMode}</p>
              </div>

              <div className="flex-1 flex flex-col space-y-4">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Neural Input Required</div>
                <textarea 
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="TYPE YOUR TOPIC OR SELECT DECK..."
                  className="flex-1 w-full bg-slate-900 border-2 border-white/5 rounded-[32px] p-8 text-xl font-black uppercase outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="system-panel p-5 border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase italic text-slate-500">You</span>
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="system-panel p-5 border-white/10 flex items-center justify-between opacity-50">
                  <span className="text-[10px] font-black uppercase italic text-slate-500">{opponent.name}</span>
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                </div>
              </div>

              <button className="w-full py-6 rounded-[32px] bg-blue-600 text-white font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl">Confirm Deployment</button>
            </motion.div>
          )}

          {/* ═══ 3. TRIAL UI ═══ */}
          {phase === 'TRIAL' && (
            <motion.div key="trial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col space-y-6">
              <div className="system-panel p-6 border-red-500/40 bg-red-950/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Target Protocol</span>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Subject: Genetic Algorithms</h3>
              </div>

              <textarea 
                placeholder="TYPE YOUR ANALYSIS..."
                className="flex-1 w-full bg-slate-900/50 border-2 border-white/5 rounded-[40px] p-10 text-xl font-bold outline-none focus:border-red-500 transition-all"
              />

              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-slate-500" />
                  <span className="text-lg font-black text-slate-500">01:24</span>
                </div>
                <button className="px-8 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest">Submit Trial</button>
              </div>
            </motion.div>
          )}

          {/* ═══ 4. REVIEW UI ═══ */}
          {phase === 'REVIEW' && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col space-y-6">
              <div className="system-panel p-8 border-purple-500/30 bg-purple-950/20">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4 italic">Opponent's Submission</h3>
                <p className="text-lg font-bold leading-relaxed text-slate-300">"Genetic algorithms are inspired by Darwin's theory of evolution. They use mutation and crossover..."</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Neural Grading</h3>
                <textarea 
                  placeholder="ENTER FEEDBACK..."
                  className="w-full h-32 bg-slate-900 border-2 border-white/5 rounded-3xl p-6 outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="py-5 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-black uppercase text-[10px] tracking-widest">Accept (Fair)</button>
                <button className="py-5 rounded-2xl bg-red-600/20 border border-red-500/50 text-red-400 font-black uppercase text-[10px] tracking-widest">Reject (Unfair)</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-600/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-600/10 to-transparent" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-red-500/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
