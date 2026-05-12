import { Moon, Waves, TreePine, Wind, Music } from 'lucide-react';
import { cn } from '@/src/lib/utils.ts';

const SOUNDS = [
  { id: 'none', label: 'Silence', icon: Moon },
  { id: 'rain', label: 'Rain', icon: Waves },
  { id: 'forest', label: 'Forest', icon: TreePine },
  { id: 'wind', label: 'Wind', icon: Wind },
  { id: 'lofi', label: 'Lo-Fi', icon: Music },
] as const;

export type SoundId = typeof SOUNDS[number]['id'];

interface AmbientSelectorProps {
  selected: SoundId;
  onSelect: (id: SoundId) => void;
  disabled?: boolean;
}

export function AmbientSelector({ selected, onSelect, disabled }: AmbientSelectorProps) {
  return (
    <div className="w-full system-panel p-5 border-white/80 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-50/30 pointer-events-none" />
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4 px-1 flex items-center gap-3 relative z-10">
        <Waves size={14} /> Ambient Soundscape
      </h3>
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
                "flex flex-col items-center gap-2 py-3 px-1 rounded-2xl border transition-all duration-500 group relative overflow-hidden",
                disabled && "opacity-50 cursor-not-allowed",
                isSelected 
                  ? "bg-blue-900 text-white border-blue-800 shadow-xl" 
                  : "bg-white/40 text-blue-400 border-white/60 hover:bg-white/80"
              )}
            >
              {isSelected && <div className="absolute inset-0 aero-gloss opacity-20" />}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                isSelected ? "bg-white/15" : "bg-blue-50 group-hover:bg-blue-100"
              )}>
                <Icon size={16} />
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase leading-tight">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
