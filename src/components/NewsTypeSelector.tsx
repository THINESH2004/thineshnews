import { NewsType, NEWS_TYPE_CONFIG } from '@/types/template';
import { cn } from '@/lib/utils';
import { 
  Zap, Landmark, Trophy, Cloud, Mic, Vote, Star, PartyPopper 
} from 'lucide-react';

const iconMap = {
  Zap,
  Landmark,
  Trophy,
  Cloud,
  Mic,
  Vote,
  Star,
  PartyPopper,
};

interface NewsTypeSelectorProps {
  selected: NewsType;
  onChange: (type: NewsType) => void;
}

export function NewsTypeSelector({ selected, onChange }: NewsTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground uppercase tracking-wider">
        News Type
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(NEWS_TYPE_CONFIG) as [NewsType, typeof NEWS_TYPE_CONFIG[NewsType]][]).map(
          ([type, config]) => {
            const Icon = iconMap[config.icon as keyof typeof iconMap];
            const isSelected = selected === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange(type)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300",
                  "hover:scale-105 hover:border-primary/50",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-glow-red"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center transition-colors",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {config.label}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
