import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AtSign,
  User
} from 'lucide-react';
import { useApp } from '@/src/lib/store.tsx';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { generateOrbHue, getOrbColors, getOrbGradient } from '@/src/lib/orb-color';

export function QuickStart({ initialPhase = 0, onClose }: { initialPhase?: number; onClose?: () => void }) {
  const [phase, setPhase] = useState(initialPhase);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [generatedHue, setGeneratedHue] = useState<number | null>(null);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    username: '',
  });
  const { state, setUser, isUsernameAvailable } = useApp();
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [canBypass, setCanBypass] = useState(false);
  const [prevUser, setPrevUser] = useState<{ email: string; name: string; username: string; orbHue: number } | null>(null);
  const [usePrevUser, setUsePrevUser] = useState(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [rateLimitActive, setRateLimitActive] = useState(false);

  const triggerNotification = (text: string, type: 'success' | 'error' = 'error') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    } else if (cooldown === 0) {
      setRateLimitActive(false);
    }
  }, [cooldown]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('orbis_previous_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          setPrevUser(parsed);
          setFormData(prev => ({ ...prev, email: parsed.email }));
          setAuthMode('login');
        }
      }
    } catch (e) {
      console.error("[QuickStart] Failed to load previous user:", e);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      if (formData.username.length < 3) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('checking');
      const available = await isUsernameAvailable(formData.username);
      setUsernameStatus(available ? 'available' : 'taken');
    };
    const timer = setTimeout(checkUser, 500);
    return () => clearTimeout(timer);
  }, [formData.username, isUsernameAvailable]);

  useEffect(() => {
    if (phase === 0) {
      const timer = setTimeout(() => setPhase(1), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Phase 7: Auto-redirect after grand finale
  useEffect(() => {
    if (phase === 7) {
      // Let bypass appear after 3.5s
      const bypassTimer = setTimeout(() => setCanBypass(true), 3500);

      const finalize = async () => {
        try {
          // If we are in AI Studio, supabase might not be fully configured or slow
          // We set a race condition: finalize or bypass
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const finalName = formData.name || user.user_metadata.full_name || user.email?.split('@')[0] || 'Operator';
            const finalUsername = formData.username || finalName.toLowerCase().replace(/\s/g, '_');
            const orbHue = generatedHue ?? generateOrbHue(user.id);

            await supabase.from('profiles').update({ 
              onboarding_completed: true, 
              name: finalName,
              username: finalUsername,
              orb_hue: orbHue
            }).eq('id', user.id).select().single();

            setUser({
              id: user.id,
              name: finalName,
              orbHue,
              onboardingCompleted: true,
              createdAt: user.created_at
            });
          } else {
            // No auth user, proceed with local
            setUser({
              id: 'local-operator',
              name: formData.name || 'Hunter',
              orbHue: generatedHue ?? 200,
              onboardingCompleted: true,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Onboarding finalization failed, falling back to local:", err);
          setUser({
            id: 'local-operator',
            name: formData.name || 'Hunter',
            orbHue: generatedHue ?? 200,
            onboardingCompleted: true,
            createdAt: new Date().toISOString()
          });
        }
      };

      // Cinematic slow-read timeout (6.5 seconds)
      const timer = setTimeout(finalize, 6500);
      return () => {
        clearTimeout(timer);
        clearTimeout(bypassTimer);
      };
    }
  }, [phase, formData, setUser]);

  const forceBypass = () => {
    setUser({
      id: 'debug-user',
      name: formData.name || 'Hunter',
      orbHue: generatedHue ?? 200,
      onboardingCompleted: true,
      createdAt: new Date().toISOString()
    });
  };

  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleResetPassword = async () => {
    if (!formData.email) {
      triggerNotification("Please enter your email address first.");
      return;
    }
    if (cooldown > 0) {
      triggerNotification(`Please wait ${cooldown} seconds before resending.`);
      return;
    }
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      triggerNotification("Password reset link sent to your email!", "success");
      setCooldown(60);
      setRateLimitActive(false);
    } catch (err: any) {
      const errMsg = err.message?.toLowerCase() || '';
      if (
        errMsg.includes('rate limit') || 
        errMsg.includes('too many') || 
        errMsg.includes('limit reached') || 
        errMsg.includes('exceeded') || 
        errMsg.includes('security') ||
        err.status === 429
      ) {
        triggerNotification("Rate limit reached. Please wait 60 seconds.");
        setCooldown(60);
        setRateLimitActive(true);
      } else {
        triggerNotification(err.message || "Failed to send reset link.");
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    try {
      if (authMode === 'login' || (prevUser && usePrevUser)) {
        // --- Explicit LOGIN Flow ---
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          const errMsg = signInError.message.toLowerCase();
          if (errMsg.includes('invalid') || errMsg.includes('credentials') || errMsg.includes('not found')) {
            throw new Error("Invalid email or password. If you registered via Google, you don't have a password set yet. Please log in with Google, or click 'Forgot / Set Password' below to configure a password.");
          }
          throw signInError;
        }

        // Successful SignIn of an existing user!
        if (signInData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', signInData.user.id)
            .single();

          if (!profile || !profile.onboarding_completed) {
            // New user who registered but didn't finish onboarding -> start them at Phase 0!
            setPhase(0);
          }
        }
      } else {
        // --- Explicit SIGNUP Flow ---
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
            throw new Error("This email is already registered. Please switch to Log In or authenticate with Google.");
          }
          throw signUpError;
        }

        if (signUpData?.user && signUpData.user.identities?.length === 0) {
          throw new Error("This email is already registered. Please switch to Log In or authenticate with Google.");
        }

        // Successful SignUp of a new user -> go to SYSTEM DETECTED (Phase 0)!
        setPhase(0);
      }
    } catch (err: any) {
      triggerNotification(err.message || "Authentication failed");
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
      triggerNotification(err.message || "Google Authentication failed");
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
    <div className="min-h-screen w-screen bg-black text-white overflow-y-auto overflow-x-hidden relative font-sans flex flex-col">
      {/* Background Ambience - MOVED TO TOP */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-full h-full bg-blue-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-full h-full bg-cyan-600/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <AnimatePresence mode="wait">
        
        
        
        {/* Phase 0: The Cold Open */}
        {phase === 0 && (
          <motion.div
            key="phase0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 text-center"
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

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={() => setPhase(2.5)}
              className="mt-12 text-[8px] font-black tracking-widest text-white/20 hover:text-white transition-colors"
            >
              SKIP INTRO
            </motion.button>
          </motion.div>
        )}

        {/* Phase 1: The Invitation */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 text-center"
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
              onClick={() => setPhase(2.5)}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-12"
          >
            <motion.div 
              layout
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full max-w-sm relative bg-[#06060c]/90 border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Custom Inline Notification Banner */}
              <AnimatePresence>
                {notification && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className={cn(
                      "absolute top-0 left-0 right-0 p-4 text-center text-[10px] font-black uppercase tracking-wider border-b z-50 shadow-2xl backdrop-blur-md",
                      notification.type === 'success' 
                        ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/20 border-red-500/20 text-red-400"
                    )}
                  >
                    {notification.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-all text-xs font-black p-2 hover:bg-white/5 rounded-xl border border-white/10 z-10"
                >
                  ✕
                </button>
              )}

              <AnimatePresence mode="wait">
                {prevUser && usePrevUser ? (
                  <motion.div
                    key="prev-user-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-white">
                        LOG BACK IN
                      </h2>
                      <div className="h-0.5 w-8 bg-cyan-400 mx-auto" />
                    </div>

                    <div className="system-panel p-6 border-white/10 bg-cyan-950/10 backdrop-blur-xl relative overflow-hidden flex flex-col items-center text-center mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />
                      
                      {/* Glowing Custom Orb Avatar */}
                      <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 rounded-full blur-[20px] pointer-events-none"
                          style={{ 
                            background: getOrbColors(prevUser.orbHue, 'idle').glow,
                            width: 80,
                            height: 80,
                          }}
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 rounded-full relative overflow-hidden shadow-2xl z-10 border border-white/20"
                          style={{ background: getOrbGradient(prevUser.orbHue, 'idle', 'E') }}
                        >
                          <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/40 blur-[2px] -rotate-[35deg]" />
                          <div className="absolute inset-0 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.3)]" />
                        </motion.div>
                      </div>

                      <div>
                        <div className="text-[7px] font-black text-cyan-400/60 uppercase tracking-[0.3em] mb-1">PREVIOUS SESSION</div>
                        <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">{prevUser.name}</h3>
                        {prevUser.username && (
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-0.5">@{prevUser.username}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUsePrevUser(false);
                          setFormData(prev => ({ ...prev, email: '' }));
                          setAuthMode('login'); // Switch to standard Log In mode!
                        }}
                        className="mt-4 text-[8px] font-black tracking-widest text-cyan-400/40 hover:text-cyan-300 transition-colors uppercase italic border-t border-white/5 pt-3 w-full"
                      >
                        Use a different account
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center text-cyan-400">
                        <Lock size={18} />
                      </div>
                      <input
                        required
                        minLength={6}
                        type="password"
                        placeholder="Password"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all text-white placeholder:text-white/20 font-bold text-xs tracking-wider"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    {/* Rate Limit Alert */}
                    {rateLimitActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider text-amber-300 space-y-2 text-left"
                      >
                        <div className="flex items-center gap-2 text-amber-400">
                          <Shield size={14} className="animate-pulse" />
                          <span>Security Cooldown</span>
                        </div>
                        <p className="text-white/60 leading-normal lowercase first-letter:uppercase">
                          Supabase email limit reached. If you originally registered via Google, you do not have an email password yet. Simply click "Sign in with Google" below to log in instantly, then configure your password in settings!
                        </p>
                      </motion.div>
                    )}

                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isSendingReset || cooldown > 0}
                      className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.2em] italic text-cyan-400 hover:text-cyan-300 transition-all shadow-md overflow-hidden block disabled:opacity-50"
                    >
                      {isSendingReset ? "Sending Reset Link..." : cooldown > 0 ? `Try again in ${cooldown}s` : "Forgot / Set Password"}
                    </button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        if (formData.email && formData.password.length >= 6) {
                          handleAuthSubmit(e as any);
                        }
                      }}
                      className="w-full btn-system py-5 font-black text-xs tracking-widest uppercase mt-4 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] text-black"
                    >
                      Log In
                    </motion.button>

                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[8px] font-black text-blue-400/40 tracking-[0.2em]">or</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-2xl py-4 transition-all active:scale-[0.98] group"
                    >
                      <GoogleIcon />
                      <span className="text-[10px] font-black tracking-widest text-white group-hover:text-blue-200 transition-colors">Sign in with Google</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`standard-auth-${authMode}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-8">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-4"
                      >
                        <Hexagon size={48} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      </motion.div>
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-white">
                        {authMode === 'login' ? "LOG IN" : "SIGN UP"}
                      </h2>
                      <div className="h-0.5 w-8 bg-cyan-400 mx-auto" />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center text-cyan-400">
                        <Mail size={18} />
                      </div>
                      <input
                        required
                        type="email"
                        placeholder="Email"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all text-white placeholder:text-white/20 font-bold text-xs tracking-wider"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center text-cyan-400">
                        <Lock size={18} />
                      </div>
                      <input
                        required
                        minLength={6}
                        type="password"
                        placeholder="Password"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all text-white placeholder:text-white/20 font-bold text-xs tracking-wider"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    {/* Rate Limit Alert */}
                    {authMode === 'login' && rateLimitActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider text-amber-300 space-y-2 text-left"
                      >
                        <div className="flex items-center gap-2 text-amber-400">
                          <Shield size={14} className="animate-pulse" />
                          <span>Security Cooldown</span>
                        </div>
                        <p className="text-white/60 leading-normal lowercase first-letter:uppercase">
                          Supabase email limit reached. If you originally registered via Google, you do not have an email password yet. Simply click "Sign in with Google" below to log in instantly, then configure your password in settings!
                        </p>
                      </motion.div>
                    )}

                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={isSendingReset || cooldown > 0}
                        className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.2em] italic text-cyan-400 hover:text-cyan-300 transition-all shadow-md overflow-hidden block disabled:opacity-50"
                      >
                        {isSendingReset ? "Sending Reset Link..." : cooldown > 0 ? `Try again in ${cooldown}s` : "Forgot / Set Password"}
                      </button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        if (formData.email && formData.password.length >= 6) {
                          handleAuthSubmit(e as any);
                        }
                      }}
                      className="w-full btn-system py-5 font-black text-xs tracking-widest uppercase mt-4 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] text-black"
                    >
                      {authMode === 'login' ? "Log In" : "Sign Up"}
                    </motion.button>

                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[8px] font-black text-blue-400/40 tracking-[0.2em]">or</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 rounded-2xl py-4 transition-all active:scale-[0.98] group"
                    >
                      <GoogleIcon />
                      <span className="text-[10px] font-black tracking-widest text-white group-hover:text-blue-200 transition-colors">Sign in with Google</span>
                    </button>

                    <div className="mt-6 text-center text-[10px] font-black uppercase tracking-wider text-white/40">
                      {authMode === 'signup' ? (
                        <>
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={() => setAuthMode('login')}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors ml-1 uppercase font-black"
                          >
                            Log In
                          </button>
                        </>
                      ) : (
                        <>
                          Don't have an account?{" "}
                          <button
                            type="button"
                            onClick={() => setAuthMode('signup')}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors ml-1 uppercase font-black"
                          >
                            Sign Up
                          </button>
                        </>
                      )}
                    </div>

                    {prevUser && (
                      <div className="mt-4 pt-4 border-t border-white/5 text-center">
                        <button 
                          type="button"
                          onClick={() => {
                            setUsePrevUser(true);
                            setFormData(prev => ({ ...prev, email: prevUser.email }));
                          }} 
                          className="text-cyan-400/60 hover:text-cyan-300 text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 mx-auto font-black italic"
                        >
                          <span 
                            className="w-2 h-2 rounded-full animate-pulse" 
                            style={{ background: getOrbGradient(prevUser.orbHue, 'idle', 'E') }}
                          />
                          Log back in as {prevUser.name}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* Phase 2.5: Operator Designation (Name Entry) */}
        {phase === 2.5 && (
          <motion.div
            key="phase2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-8 overflow-y-auto"
          >
            <div className="w-full max-w-sm text-center">
              <div className="mb-6 md:mb-10">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <UserIcon size={24} className="text-blue-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase mb-1.5 md:mb-2">Operator Designation</h2>
                <p className="text-[9px] md:text-[10px] font-black tracking-widest text-blue-400/60 uppercase">How should the system address you?</p>
              </div>

              <div className="relative mb-3 md:mb-4">
                <div className="absolute inset-y-0 left-4 flex items-center text-blue-400">
                  <UserIcon size={16} />
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="FULL NAME"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 md:py-5 pl-12 pr-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder:text-blue-200/30 font-black text-xs tracking-[0.2em] uppercase"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="relative mb-6 md:mb-8">
                <div className="absolute inset-y-0 left-4 flex items-center text-blue-400">
                  <AtSign size={16} />
                </div>
                <input
                  type="text"
                  placeholder="USERNAME"
                  className={cn(
                    "w-full bg-white/5 border rounded-2xl py-4 md:py-5 pl-12 pr-4 outline-none transition-all text-white placeholder:text-blue-200/30 font-black text-xs tracking-[0.2em] uppercase",
                    usernameStatus === 'available' ? "border-emerald-500/50 focus:border-emerald-500" : 
                    usernameStatus === 'taken' ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500"
                  )}
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                  {usernameStatus === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                  {usernameStatus === 'taken' && <Zap size={16} className="text-red-500" />}
                </div>
              </div>

              <button
                disabled={!formData.name || !formData.username || usernameStatus !== 'available'}
                onClick={() => {
                  // Generate the user's unique orb hue
                  const hue = generateOrbHue(formData.username + formData.name + Date.now());
                  setGeneratedHue(hue);
                  setPhase(3.5);
                }}
                className="w-full btn-system py-4 md:py-5 font-black text-xs tracking-widest uppercase disabled:opacity-30 transition-opacity"
              >
                CONFIRM IDENTITY
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 3.5: Core Crystallization (Orb Birth) */}
        {phase === 3.5 && generatedHue != null && (() => {
          const palette = getOrbColors(generatedHue, 'idle');
          const gradient = getOrbGradient(generatedHue, 'idle', 'E');
          return (
            <motion.div
              key="phase3.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-6 overflow-hidden"
            >
              {/* Background pulse in user's color */}
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-[120px] pointer-events-none -z-10"
                style={{ background: palette.primary }}
              />

              {/* Scanning text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-[9px] font-black tracking-[0.4em] uppercase mb-8 md:mb-16"
                style={{ color: palette.accent }}
              >
                CRYSTALLIZING NEURAL CORE...
              </motion.div>

              {/* The Orb materializes */}
              <div className="relative mb-8 md:mb-16 flex items-center justify-center w-48 h-48">
                {/* Outer glow ring */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 2.2, 1.8], opacity: [0, 0.7, 0.35] }}
                  transition={{ duration: 2.2, delay: 1.5 }}
                  className="absolute inset-0 rounded-full blur-[40px] pointer-events-none z-0"
                  style={{ background: palette.glow, width: 160, height: 160, left: 16, top: 16 }}
                />

                {/* The orb itself */}
                <motion.div
                  initial={{ scale: 0, opacity: 0, filter: 'blur(20px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 1.5, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full relative overflow-hidden shadow-2xl z-10"
                  style={{ background: gradient }}
                >
                  {/* Inner highlight */}
                  <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/50 blur-[3px] -rotate-[35deg]" />
                  <div className="absolute inset-0 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.3)]" />
                  
                  {/* Breathing animation */}
                  <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: `radial-gradient(circle at 40% 40%, ${palette.highlight} 0%, transparent 60%)` }}
                  />
                </motion.div>

                {/* Radiating rings - MUCH LARGER & SMOOTHER DECAY */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 112, height: 112, opacity: 0 }}
                    animate={{ width: [112, 480], height: [112, 480], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 3.5, delay: 2 + i * 0.6, repeat: Infinity, repeatDelay: 0.5, ease: "easeOut" }}
                    className="absolute rounded-full border pointer-events-none z-0"
                    style={{ borderColor: palette.accent }}
                  />
                ))}
              </div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="text-lg md:text-2xl font-black italic tracking-tighter uppercase mb-2 text-white text-center px-4"
              >
                YOUR CORE HAS BEEN FORGED
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="text-[8px] md:text-[9px] font-black tracking-[0.25em] uppercase mb-8 md:mb-12 text-center"
                style={{ color: palette.accent }}
              >
                THIS COLOR IS YOUR PERMANENT IDENTITY
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5 }}
                onClick={() => setPhase(4)}
                className="px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-xs tracking-widest uppercase text-white transition-all hover:scale-105 active:scale-95 relative z-20"
                style={{ background: palette.primary, boxShadow: `0 0 30px ${palette.glow}` }}
              >
                BIND TO CORE
              </motion.button>
            </motion.div>
          );
        })()}

        {/* Phase 4: The Scan (Operator Profile) */}
        {phase === 4 && (
          <motion.div
            key="phase4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 overflow-y-auto"
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
                
                <div className="mb-8 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg shrink-0" 
                    style={{ background: generatedHue != null ? getOrbGradient(generatedHue, 'idle', 'E') : 'radial-gradient(circle, #fff 0%, #94a3b8 100%)' }}>
                    <div className="w-full h-full relative">
                      <div className="absolute top-[15%] left-[20%] w-[30%] h-[15%] rounded-full bg-white/50 blur-[2px] -rotate-[35deg]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Operator ID</div>
                    <div className="text-2xl font-black italic tracking-tighter text-white">{formData.name || 'HUNTER'}</div>
                    <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">@{formData.username || 'operator'}</div>
                  </div>
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
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 overflow-y-auto"
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
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 text-center overflow-y-auto"
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
              className="mt-10 md:mt-20 group relative px-8 py-4 md:px-12 md:py-5 bg-white text-black font-black text-xs tracking-[0.3em] uppercase rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] overflow-hidden"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-8 overflow-y-auto"
          >
            {/* Particle Explosion Mockup (Radiating Rings) */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{ width: '200vw', height: '200vw', opacity: 0 }}
                    transition={{ duration: 4, delay: i * 0.25, ease: "easeOut" }}
                    className="absolute rounded-full border border-blue-400/30"
                  />
                ))}
            </div>

            <motion.h1
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter text-white mb-4 md:mb-6 text-center px-4"
            >
              HUNTER <br />
              <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)] block break-words max-w-full">
                {formData.name || 'OPERATOR'}
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-black tracking-[0.3em] sm:tracking-[0.4em] text-cyan-400/50 uppercase italic px-4 text-center"
            >
              <span>RANK E</span>
              <div className="w-1 h-1 rounded-full bg-cyan-400" />
              <span>LEVEL 1</span>
              <div className="w-1 h-1 rounded-full bg-cyan-400" />
              <span>THE HUNT BEGINS</span>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 2.8 }}
               className="mt-10 md:mt-20 flex flex-col items-center gap-6 px-4"
            >
               <div className="flex items-center gap-3 sm:gap-4 text-center">
                 <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin shrink-0" />
                 <span className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] sm:tracking-[0.5em] text-cyan-400/30 uppercase italic">Synchronizing Neural Interface...</span>
               </div>

               {canBypass && (
                 <motion.button
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   whileHover={{ scale: 1.05, color: '#fff' }}
                   onClick={forceBypass}
                   className="px-5 py-2.5 sm:px-6 sm:py-3 border border-white/5 bg-white/[0.02] rounded-xl text-[8px] sm:text-[9px] font-black tracking-[0.3em] text-white/20 hover:border-cyan-400/30 transition-all uppercase italic"
                 >
                   System Override &gt;&gt;
                 </motion.button>
               )}
            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
