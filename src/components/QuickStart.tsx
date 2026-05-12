import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Sparkles, 
  Target, 
  Zap, 
  Shield, 
  Hexagon, 
  Lock, 
  User as UserIcon, 
  Mail,
  Box,
  Brain,
  Flame,
  CheckCircle2,
  Search,
  Plus,
  School
} from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';

const MOCK_SCHOOLS = [
  "Dragon Academy of Arts",
  "Shadow Realm Institute",
  "Techno-Magic University",
  "Starlight Academy",
  "Void Runners College",
  "Celestial Sanctum",
];

export function QuickStart({ initialPhase = 0 }: { initialPhase?: number }) {
  const [phase, setPhase] = useState(initialPhase);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isAddingCustomSchool, setIsAddingCustomSchool] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    school: ''
  });
  const { state, setUser } = useApp();

  useEffect(() => {
    if (phase === 0) {
      const timer = setTimeout(() => setPhase(1), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Phase 7: Auto-redirect after grand finale
  useEffect(() => {
    if (phase === 7) {
      const timer = setTimeout(() => {
        // We just need to make sure the onboarding_completed is set in the database
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            const finalName = formData.name || user.user_metadata.full_name || user.email?.split('@')[0] || 'Operator';
            supabase.from('profiles').update({ 
              onboarding_completed: true, 
              school: formData.school,
              name: finalName
            }).eq('id', user.id).then(() => {
              // Update local state to trigger transition
              setUser({
                id: user.id,
                name: finalName,
                school: formData.school,
                onboardingCompleted: true,
                createdAt: user.created_at
              });
            }).catch(err => {
              console.error("Critical: Onboarding update failed", err);
              alert("System Error: Failed to finalize dossier. Check network connection.");
            });
          }
        });
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [phase, formData.school, authMode]);
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });
        if (error) throw error;
        setPhase(2.5); // Go to Name Entry
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      alert(err.message || "Authentication failed");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || "Google Authentication failed");
    }
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" className="mr-3">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative font-sans">
      <AnimatePresence mode="wait">
        
        {/* Phase 0: The Cold Open */}
        {phase === 0 && (
          <motion.div
            key="phase0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-full"
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '60vw' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-[1px] bg-blue-500 mb-8"
            />
            <motion.div className="flex gap-2">
              {"SYSTEM DETECTED".split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 + 0.5 }}
                  className="text-xs font-black tracking-[0.8em] text-blue-400"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Phase 1: The Invitation */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-full px-8 text-center"
          >
            {/* Pulsing Orb */}
            <div className="relative mb-20">
               <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500 rounded-full blur-3xl scale-150"
               />
               <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.5)',
                    '0 0 60px rgba(59, 130, 246, 0.8)',
                    '0 0 20px rgba(59, 130, 246, 0.5)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-300 to-blue-600 relative z-10 border border-white/20"
               />
            </div>

            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-black italic tracking-tighter mb-4"
            >
              "You've been chosen."
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-[10px] uppercase font-black tracking-[0.3em] leading-relaxed text-blue-200/60 max-w-xs mb-16"
            >
              The System has identified latent cognitive potential. Initiating the Awakening Protocol.
            </motion.p>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => setPhase(2)}
              className="group relative px-10 py-5 overflow-hidden rounded-2xl bg-blue-600 text-white font-black text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              ACCEPT THE LINK
            </motion.button>
          </motion.div>
        )}

        {/* Phase 2: Identity Registration (Auth) */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center justify-center h-full w-full px-8"
          >
            <div className="w-full max-w-sm">
              <div className="text-center mb-12">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <Hexagon size={48} className="text-blue-500" />
                </motion.div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">
                  {authMode === 'signup' ? 'Neural Core Registration' : 'Re-establish Neural Link'}
                </h2>
                <div className="h-1 w-12 bg-blue-500 mx-auto" />
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-blue-400">
                    <Mail size={18} />
                  </div>
                  <input
                    required
                    type="email"
                    placeholder="NEURAL ID (EMAIL)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-blue-200/30 font-black text-[10px] tracking-widest uppercase"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-blue-400">
                    <Lock size={18} />
                  </div>
                  <input
                    required
                    minLength={6}
                    type="password"
                    placeholder="ACCESS CIPHER"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-blue-200/30 font-black text-[10px] tracking-widest"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-system py-5 font-black text-xs tracking-widest uppercase mt-4"
                >
                  {authMode === 'signup' ? 'FORGE NEURAL LINK' : 'RE-ESTABLISH LINK'}
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[8px] font-black text-blue-400/40 tracking-[0.2em]">OR PROVIDE EXTERNAL ID</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-2xl py-4 transition-all active:scale-[0.98] group"
                >
                  <GoogleIcon />
                  <span className="text-[10px] font-black tracking-widest text-white group-hover:text-blue-200 transition-colors">AUTHENTICATE WITH GOOGLE</span>
                </button>
              </form>

              <div className="mt-8 text-center text-[9px] font-black tracking-widest text-blue-400/60 transition-all">
                {authMode === 'signup' ? (
                  <p>Returning Operator? <button onClick={() => setAuthMode('login')} className="text-blue-400 hover:text-white underline">Re-establish link</button></p>
                ) : (
                  <p>New candidate? <button onClick={() => setAuthMode('signup')} className="text-blue-400 hover:text-white underline">Initiate training</button></p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 2.5: Operator Designation (Name Entry) */}
        {phase === 2.5 && (
          <motion.div
            key="phase2.5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center h-full w-full px-8"
          >
            <div className="w-full max-w-sm text-center">
              <div className="mb-10">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <UserIcon size={32} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Operator Designation</h2>
                <p className="text-[10px] font-black tracking-widest text-blue-400/60 uppercase">How should the system address you?</p>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-4 flex items-center text-blue-400">
                  <Zap size={18} />
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="CHOOSE YOUR DESIGNATION"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-blue-200/30 font-black text-xs tracking-[0.2em] uppercase"
                  value={formData.name || (state.user?.name !== 'Operator' ? state.user?.name : '')}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && formData.name.length > 2 && setPhase(3)}
                />
              </div>

              <button
                disabled={!formData.name || formData.name.length < 2}
                onClick={() => setPhase(3)}
                className="w-full btn-system py-5 font-black text-xs tracking-widest uppercase disabled:opacity-30 transition-opacity"
              >
                CONFIRM DESIGNATION
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 3: School Selection */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center h-full w-full px-8"
          >
            <div className="w-full max-w-sm">
              <div className="text-center mb-10">
                <School size={40} className="text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Locate Your Sanctum</h2>
                <p className="text-[10px] font-black tracking-widest text-blue-400/60 uppercase">Select your educational institution</p>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                <input
                  type="text"
                  placeholder="SEARCH FOR SCHOOL..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-blue-200/30 font-black text-[10px] tracking-widest uppercase"
                  value={schoolSearch}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setIsAddingCustomSchool(false);
                  }}
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto mb-6 pr-2 scrollbar-hide">
                {MOCK_SCHOOLS.filter(s => s.toLowerCase().includes(schoolSearch.toLowerCase())).map((school) => (
                  <button
                    key={school}
                    onClick={() => {
                      setFormData({ ...formData, school });
                      setPhase(4);
                    }}
                    className={cn(
                      "w-full p-4 rounded-xl text-left font-black text-[10px] tracking-widest uppercase transition-all border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10",
                      formData.school === school ? "border-blue-500 bg-blue-500/20 text-white" : "text-white/40"
                    )}
                  >
                    {school}
                  </button>
                ))}
                
                {schoolSearch.length > 0 && !MOCK_SCHOOLS.some(s => s.toLowerCase() === schoolSearch.toLowerCase()) && (
                  <button
                    onClick={() => setIsAddingCustomSchool(true)}
                    className="w-full p-4 rounded-xl text-left font-black text-[10px] tracking-widest uppercase text-blue-400 flex items-center gap-2 hover:bg-blue-500/5"
                  >
                    <Plus size={16} />
                    ADD "{schoolSearch.toUpperCase()}"
                  </button>
                )}
              </div>

              {isAddingCustomSchool && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-blue-500/30 bg-blue-500/5 rounded-2xl mb-6 text-center"
                >
                  <p className="text-[9px] font-black text-blue-300 mb-4 tracking-widest">NO SYSTEM RECORD FOR THIS SANCTUM. INITIALIZING NEW ENTRY?</p>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, school: schoolSearch });
                      setPhase(4);
                    }}
                    className="btn-system py-3 px-6 text-[9px]"
                  >
                    CONFIRM NEW SANCTUM
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Phase 4: The Scan (Operator Profile) */}
        {phase === 4 && (
          <motion.div
            key="phase4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-full px-8"
          >
            <div className="w-full max-w-sm relative">
              <div className="text-center mb-12">
                 <motion.div
                   animate={{ opacity: [0, 1, 0, 1] }}
                   transition={{ duration: 0.5, repeat: 3 }}
                   className="text-[10px] font-black text-blue-400 tracking-[0.5em] uppercase"
                 >
                   ANALYZING COGNITIVE SIGNATURE...
                 </motion.div>
              </div>

              {/* Dossier Card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1 }}
                className="system-panel p-8 border-white/20 bg-blue-900/10 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <CheckCircle2 className="text-green-500" size={20} />
                </div>
                
                <div className="mb-8">
                  <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Operator ID</div>
                  <div className="text-2xl font-black italic tracking-tighter text-white">{formData.name || 'HUNTER'}</div>
                  <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{formData.school || 'INDEPENDENT'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Rank</div>
                    <div className="text-xl font-black text-white italic">E</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Level</div>
                    <div className="text-xl font-black text-white">01</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Core Density</div>
                    <div className="text-xl font-black text-white">0 EXP</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Status</div>
                    <div className="text-[10px] font-black text-green-400 uppercase tracking-widest">ACTIVE</div>
                  </div>
                </div>

                <button
                  onClick={() => setPhase(5)}
                  className="w-full btn-system py-4 font-black text-xs tracking-widest uppercase"
                >
                  CONFIRM IDENTITY
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Phase 5: The Arsenal Briefing */}
        {phase === 5 && (
          <motion.div
            key="phase5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-full px-8"
          >
            <div className="w-full max-w-sm space-y-4">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">The System Arsenal</h2>
                <p className="text-[10px] font-black tracking-widest text-blue-400/60 mt-2">FOUR PILLARS OF ASCENSION</p>
              </div>

              {[
                { icon: <Box className="text-blue-400" />, title: 'Extraction Hub', desc: 'Convert knowledge into Memory Fragments', color: 'from-blue-500/20' },
                { icon: <Zap className="text-yellow-400" />, title: 'Mana Cultivation', desc: 'Deep focus sessions that forge raw EXP', color: 'from-yellow-500/20' },
                { icon: <Brain className="text-purple-400" />, title: 'The Battlefront', desc: 'Test mastery in timed combat arenas', color: 'from-purple-500/20' },
                { icon: <Flame className="text-orange-400" />, title: 'Daily Missions', desc: 'Rule-based quests to maintain your streak', color: 'from-orange-500/20' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                  className={cn(
                    "system-panel p-4 flex items-center gap-4 bg-gradient-to-r to-transparent border-white/5",
                    item.color
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight">{item.title}</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{item.desc}</p>
                  </div>
                </motion.div>
              ))}

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                onClick={() => setPhase(6)}
                className="w-full btn-system py-5 font-black text-xs tracking-widest uppercase mt-6"
              >
                I UNDERSTAND THE ARSENAL
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Phase 6: The Oath */}
        {phase === 6 && (
          <motion.div
            key="phase6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-full px-12 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="space-y-6"
            >
              <div className="w-12 h-1 bg-blue-500 mx-auto" />
              <p className="text-lg font-black italic tracking-tighter text-white/90 leading-tight">
                "I will build my own weapon."<br />
                "The System will sharpen it."<br />
                "No shortcuts. No excuses."<br />
                "Only relentless extraction."
              </p>
              <div className="w-12 h-1 bg-blue-500 mx-auto" />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              onClick={() => setPhase(7)}
              className="mt-20 group relative px-12 py-5 bg-white text-black font-black text-xs tracking-[0.3em] uppercase rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] overflow-hidden"
            >
              <motion.div 
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-blue-400"
              />
              <span className="relative z-10">BEGIN THE HUNT</span>
            </motion.button>
          </motion.div>
        )}

        {/* Phase 7: The Awakening (Grand Finale) */}
        {phase === 7 && (
          <motion.div
            key="phase7"
            initial={{ backgroundColor: '#000' }}
            animate={{ backgroundColor: '#000' }}
            className="flex flex-col items-center justify-center h-full w-full relative"
          >
            {/* Particle Explosion Mockup (Radiating Rings) */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{ width: '200vw', height: '200vw', opacity: 0 }}
                    transition={{ duration: 3, delay: i * 0.2, ease: "easeOut" }}
                    className="absolute rounded-full border border-blue-400/50"
                  />
                ))}
            </div>

            <motion.h1
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-6xl font-black italic tracking-tighter text-white mb-6 text-center px-8"
            >
              HUNTER <br />
              <span className="text-blue-500">{formData.name || 'OPERATOR'}</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="flex items-center gap-4 text-xs font-black tracking-[0.4em] text-blue-400/80 uppercase"
            >
              <span>RANK E</span>
              <div className="w-1 h-1 rounded-full bg-blue-400" />
              <span>LEVEL 1</span>
              <div className="w-1 h-1 rounded-full bg-blue-400" />
              <span>THE HUNT BEGINS</span>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 3 }}
               className="mt-20 flex items-center gap-3"
            >
               <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
               <span className="text-[10px] font-black tracking-widest text-blue-200/40 uppercase">Synchronizing Neural Interface...</span>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-full h-full bg-blue-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-full h-full bg-cyan-600/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>
    </div>
  );
}
