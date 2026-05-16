import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-lg"
      >
        <Lock size={36} className="text-blue-300" />
      </motion.div>
      
      <h2 className="text-2xl font-black text-blue-900 tracking-tighter mb-2">{feature}</h2>
      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Coming Soon</p>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
        <Sparkles size={12} className="text-blue-400" />
        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Under Construction</span>
      </div>
    </motion.div>
  );
}
