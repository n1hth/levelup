import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Orbit, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export function Signup() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePaymentRedirect = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '?payment=success');
    window.location.href = `https://checkout.dodopayments.com/buy/pdt_0Nfs8Vm2dRC9Fwlg5skfL?quantity=1&redirect_url=${redirectUrl}`;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || formData.password.length < 6) {
      setErrorMsg("Please enter a valid email and a password of at least 6 characters.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg(null);

    try {
      localStorage.setItem('orbis_auth_intent', 'signup');
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      
      if (data?.user?.identities && data.user.identities.length === 0) {
        throw new Error("User already exists. Please log in instead.");
      }

      if (data?.user) {
        // Start redirect transition
        setIsRedirecting(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg(null);
      localStorage.setItem('orbis_used_google_auth', 'true');
      localStorage.setItem('orbis_auth_intent', 'signup');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Google Authentication failed");
      setIsGoogleLoading(false);
    }
  };

  // Automatically execute the redirect after a short delay
  useEffect(() => {
    if (isRedirecting) {
      const timer = setTimeout(() => {
        handlePaymentRedirect();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isRedirecting]);

  return (
    <div className="min-h-screen bg-[#030309] text-white font-sans antialiased overflow-x-hidden selection:bg-cyan-500/30 flex items-center justify-center p-6 relative">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '700ms' }} />

      <AnimatePresence mode="wait">
        {!isRedirecting ? (
          <motion.div
            key="signup-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm relative z-10"
          >
            <div className="text-center mb-8">
              <div className="relative mb-6 mx-auto w-16 h-16">
                 <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl scale-150 animate-pulse" />
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-600 relative z-10 border border-white/20 shadow-[0_0_30px_rgba(34,211,238,0.5)]" />
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-white drop-shadow-lg">
                ENTER ORBIS
              </h1>
              <p className="text-xs font-bold text-white/40 tracking-widest uppercase">
                Initialize Your Operator Identity
              </p>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-wider text-red-400 mb-6 flex gap-2 items-center text-left"
              >
                <Shield size={14} className="shrink-0" />
                <p className="leading-relaxed">{errorMsg}</p>
              </motion.div>
            )}

            <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center text-cyan-400">
                  <Mail size={18} />
                </div>
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-white/20 font-bold text-xs tracking-wider shadow-inner"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="relative pt-2">
                <div className="absolute inset-y-0 left-4 top-2 flex items-center text-cyan-400">
                  <Lock size={18} />
                </div>
                <input
                  required
                  minLength={6}
                  type="password"
                  placeholder="Create Password"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-12 pr-4 outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-white/20 font-bold text-xs tracking-wider shadow-inner"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-black text-xs tracking-[0.15em] uppercase overflow-hidden transition-transform duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-4"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.68 0.22 220), oklch(0.48 0.28 240))',
                  boxShadow: '0 0 30px oklch(0.5 0.25 220 / 0.2)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 text-[#030309]">{isLoading ? 'Initializing...' : 'Proceed'}</span>
                <ArrowRight size={14} className="relative z-10 text-[#030309] group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="relative py-4 flex items-center justify-center mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative bg-[#030309] px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                OR
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading}
              className="w-full py-4 rounded-2xl border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.15em] text-white/70 hover:text-white transition-all shadow-md flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="redirect-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center relative z-10 px-6"
          >
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 relative shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <Shield size={40} className="text-emerald-400 absolute" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin opacity-50" style={{ animationDuration: '2s' }} />
            </div>
            
            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-4 text-emerald-400 drop-shadow-md">
              Authentication Successful
            </h2>
            
            <p className="text-sm font-medium text-white/50 mb-10 leading-relaxed max-w-sm mx-auto">
              Your identity has been registered. You will be automatically redirected to the payment gateway to finalize your license.
            </p>
            
            <button
              onClick={handlePaymentRedirect}
              className="px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white transition-all"
            >
              Click here if you are not redirected
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
