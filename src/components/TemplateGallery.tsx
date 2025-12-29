import { templateVariants } from '@/data/templateLayouts';
import { NEWS_TYPE_CONFIG, NewsType } from '@/types/template';
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

const colorMap: Record<string, string> = {
  'news-red': 'from-red-600 to-red-800',
  'news-purple': 'from-purple-600 to-purple-800',
  'news-orange': 'from-orange-500 to-orange-700',
  'news-cyan': 'from-cyan-500 to-cyan-700',
  'news-blue': 'from-blue-500 to-blue-700',
  'news-yellow': 'from-yellow-500 to-yellow-700',
  'news-green': 'from-green-500 to-green-700',
};

interface TemplateGalleryProps {
  onSelect: (type: NewsType) => void;
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const totalTemplates = Object.values(templateVariants).reduce(
    (acc, variants) => acc + variants.length, 
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-xl text-foreground uppercase tracking-wider">
          Template Library
        </h3>
        <span className="text-sm text-muted-foreground">
          {totalTemplates} templates across {Object.keys(NEWS_TYPE_CONFIG).length} categories
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(NEWS_TYPE_CONFIG) as [NewsType, typeof NEWS_TYPE_CONFIG[NewsType]][]).map(
          ([type, config]) => {
            const Icon = iconMap[config.icon as keyof typeof iconMap];
            const gradientClass = colorMap[config.color] || 'from-red-600 to-red-800';
            const variantCount = templateVariants[type]?.length || 0;

            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className="group relative aspect-video rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-elevated"
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity",
                  gradientClass
                )} />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                  <Icon className="w-8 h-8 text-white drop-shadow-lg" />
                  <span className="text-sm font-headline text-white text-center uppercase tracking-wider drop-shadow-lg">
                    {config.label}
                  </span>
                  <span className="text-xs text-white/70 font-body">
                    {variantCount} style{variantCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors" />
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
