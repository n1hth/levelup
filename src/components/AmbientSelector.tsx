import { Moon, Waves, TreePine, Wind, Music } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';

const SOUNDS = [
  { id: 'none', label: 'VOID', icon: Moon },
  { id: 'rain', label: 'FLUX', icon: Waves },
  { id: 'forest', label: 'BIOME', icon: TreePine },
  { id: 'wind', label: 'AETHER', icon: Wind },
  { id: 'lofi', label: 'CORE', icon: Music },
] as const;

export type SoundId = typeof SOUNDS[number]['id'];

interface AmbientSelectorProps {
  selected: SoundId;
  onSelect: (id: SoundId) => void;
  disabled?: boolean;
}

export function AmbientSelector({ selected, onSelect, disabled }: AmbientSelectorProps) {
  return (
    <div className="w-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2 relative z-10 italic">
          <Waves size={14} className="text-cyan-400" /> Neural Audio Stream
        </h3>
        {selected !== 'none' && (
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Protocol: StreamActive</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2 relative z-10">
        {SOUNDS.map((s) => {
          const Icon = s.icon;
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => !disabled && onSelect(s.id)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                disabled && "opacity-10 cursor-not-allowed",
                isSelected 
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                  : "bg-white/[0.015] text-white/10 border-white/5 hover:text-white/40 hover:bg-white/[0.03]"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                isSelected ? "text-cyan-400" : "text-white/20 group-hover:text-white/40"
              )}>
                <Icon size={14} />
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase italic leading-none">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
