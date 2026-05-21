import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Orbit,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TourStep {
  title: string;
  content: string;
  targetId?: string;
  path?: string;
  position: 'top' | 'bottom' | 'center' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "SYSTEM INITIALIZED",
    content: "Welcome to Ascend. You have been selected by the System to ascend your potential. Let's synchronize your interface.",
    position: 'center'
  },
  {
    title: "NEURAL CORE",
    content: "This is your personal Neural Core. Tapping it accesses your Hunter Rank, detailed stats, and inventory.",
    targetId: 'profile-orb',
    path: '/home',
    position: 'bottom'
  },
  {
    title: "INTERFACE BRIDGE",
    content: "Tap the central Interface Bridge to expand your neural link and access all system sectors.",
    targetId: 'nav-orb',
    path: '/home',
    position: 'top'
  },
  {
    title: "DISTRICT HUB",
    content: "Your tactical dashboard. Monitor active quests, focus streaks, and daily evolution metrics at a glance.",
    path: '/home',
    position: 'bottom'
  },
  {
    title: "NEURAL STABILIZER",
    content: "Engage Focus Mode to enter a flow state. The system filters distractions and rewards cognitive endurance.",
    path: '/focus',
    position: 'bottom'
  },
  {
    title: "KNOWLEDGE ARCHIVE",
    content: "Deploy study decks here. Reviewing data fragments earns XP and evolves your mental agility.",
    path: '/decks',
    position: 'bottom'
  },
  {
    title: "TACTICAL ARENAS",
    content: "Select an arena to test your mastery. Neural Arenas are perfect for refining individual fragments.",
    path: '/battle?tab=practice',
    position: 'bottom'
  },
  {
    title: "ACTIVE DUELS",
    content: "Challenge other hunters to real-time duels. Stake your rank in lexical conflict or spelling clashes.",
    path: '/battle?tab=duels',
    position: 'bottom'
  },
  {
    title: "RANKINGS",
    content: "Check the global Leaderboards. See where you stand among the top hunters.",
    path: '/social?tab=leaderboard',
    position: 'bottom'
  },
  {
    title: "GUILD & REVIEW",
    content: "Visit the Guild to review community duels. Enforce link morality and earn XP by verifying combat logs.",
    path: '/social?tab=community',
    position: 'bottom'
  },
  {
    title: "HUNTER NETWORK",
    content: "Monitor active agents, coordinate with allies, and issue direct challenges through the Social grid.",
    path: '/social?tab=friends',
    position: 'bottom'
  },
  {
    title: "EVOLUTION READY",
    content: "Synchronization complete. You are now authorized to begin your ascent. Good luck, Hunter.",
    position: 'center'
  }
];

export function AppTour() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('levelup_tour_seen');
    if (!hasSeenTour) {
      // Use a custom event or a slightly longer delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateTargetRect = useCallback(() => {
    if (isTransitioning) return;
    
    const step = TOUR_STEPS[currentStep];
    if (step?.targetId) {
      const element = document.getElementById(step.targetId);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        // Retry a few times if element not found (page might be loading)
        setTimeout(() => {
          const reElement = document.getElementById(step.targetId!);
          if (reElement) setTargetRect(reElement.getBoundingClientRect());
        }, 300);
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isTransitioning]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [updateTargetRect]);

  const handleStepChange = async (nextIdx: number) => {
    setIsTransitioning(true);
    const nextStepObj = TOUR_STEPS[nextIdx];
    
    if (nextStepObj.path) {
      navigate(nextStepObj.path);
      // Brief wait for route transition animation to start
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    setCurrentStep(nextIdx);
    setIsTransitioning(false);
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      handleStepChange(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    localStorage.setItem('levelup_tour_seen', 'true');
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Content Card with Intelligent Positioning (Smaller & Subtler) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', y: 10, x: '-50%' }}
              animate={{ 
                opacity: isTransitioning ? 0 : 1, 
                scale: isTransitioning ? 0.95 : 1,
                filter: isTransitioning ? 'blur(10px)' : 'blur(0px)',
                y: isTransitioning ? 10 : 0,
                x: '-50%'
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                left: '50%',
                top: step?.position === 'bottom' ? 'auto' : 
                     !targetRect ? '35%' : 
                     (targetRect.top + targetRect.height / 2 > window.innerHeight / 2) ? 'auto' : `${targetRect.bottom + 20}px`,
                bottom: step?.position === 'bottom' ? '32px' :
                        targetRect && (targetRect.top + targetRect.height / 2 > window.innerHeight / 2) ? `${(window.innerHeight - targetRect.top) + 20}px` : 'auto',
                transformOrigin: 'center center'
              }}
              className="w-[calc(100%-64px)] max-w-[280px] bg-[#0A0C10]/98 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_40px_100px_rgba(0,0,0,0.9),0_0_40px_rgba(34,211,238,0.2)] pointer-events-auto z-[210]"
            >
              <button 
                onClick={completeTour}
                className="absolute top-3 right-3 text-white/20 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 pr-4">
                  <h3 className="text-xs font-black text-cyan-400 italic uppercase tracking-widest">
                    {step?.title}
                  </h3>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {step?.content}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex gap-1">
                    {TOUR_STEPS.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-1 rounded-full transition-colors ${i === currentStep ? 'bg-cyan-400' : 'bg-white/10'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <button 
                        onClick={prevStep}
                        className="text-[9px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Prev
                      </button>
                    )}
                    <button 
                      onClick={nextStep}
                      disabled={isTransitioning}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-black italic uppercase tracking-widest text-[9px] flex items-center gap-1.5 hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                      <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Target Highlight Ring */}
            {targetRect && !isTransitioning && (
              <motion.div
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ 
                  opacity: 1, 
                  scale: [1, 1.05, 1],
                }}
                exit={{ opacity: 0, scale: 1.2 }}
                layoutId="spotlight"
                transition={{ 
                  opacity: { duration: 0.3 },
                  scale: { 
                    repeat: Infinity, 
                    duration: 2, 
                    ease: "easeInOut" 
                  }
                }}
                className="absolute border-2 border-cyan-400 shadow-[0_0_60px_rgba(34,211,238,0.8),inset_0_0_30px_rgba(34,211,238,0.4)] bg-cyan-400/5 backdrop-filter backdrop-brightness-[1.25] rounded-full z-[201]"
                style={{
                  left: targetRect.left + (targetRect.width / 2) - ((Math.max(targetRect.width, targetRect.height) + 24) / 2),
                  top: targetRect.top + (targetRect.height / 2) - ((Math.max(targetRect.width, targetRect.height) + 24) / 2),
                  width: Math.max(targetRect.width, targetRect.height) + 24,
                  height: Math.max(targetRect.width, targetRect.height) + 24,
                }}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
