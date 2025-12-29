import { templateVariants, TemplateVariant, TemplateStyle } from '@/data/templateLayouts';
import { NewsType, NEWS_TYPE_CONFIG } from '@/types/template';
import { cn } from '@/lib/utils';
import { Check, Layers } from 'lucide-react';

interface TemplateStyleSelectorProps {
  newsType: NewsType;
  selectedVariant: string;
  onChange: (variantId: string) => void;
}

const styleColors: Record<TemplateStyle, { bg: string; border: string; text: string }> = {
  classic: { bg: 'bg-news-red/10', border: 'border-news-red/50', text: 'text-news-red' },
  modern: { bg: 'bg-news-blue/10', border: 'border-news-blue/50', text: 'text-news-blue' },
  bold: { bg: 'bg-news-orange/10', border: 'border-news-orange/50', text: 'text-news-orange' },
  minimal: { bg: 'bg-muted', border: 'border-muted-foreground/30', text: 'text-muted-foreground' },
};

export function TemplateStyleSelector({ newsType, selectedVariant, onChange }: TemplateStyleSelectorProps) {
  const variants = templateVariants[newsType];
  const config = NEWS_TYPE_CONFIG[newsType];

  if (!variants || variants.length <= 1) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <label className="text-sm font-medium text-foreground uppercase tracking-wider">
          Template Style
        </label>
        <span className="text-xs text-muted-foreground">
          ({variants.length} variations)
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {variants.map((variant) => {
          const isSelected = selectedVariant === variant.id;
          const colors = styleColors[variant.style];

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onChange(variant.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-300",
                "hover:scale-105",
                isSelected
                  ? `${colors.border} ${colors.bg} shadow-lg`
                  : "border-border bg-card hover:bg-muted hover:border-primary/30"
              )}
            >
              {/* Mini Preview */}
              <div className={cn(
                "w-full aspect-video rounded-md overflow-hidden",
                "bg-gradient-to-br",
                variant.style === 'classic' && "from-gray-900 to-gray-800",
                variant.style === 'modern' && "from-gray-900 via-gray-800 to-gray-900",
                variant.style === 'bold' && "from-primary/80 to-gray-900",
                variant.style === 'minimal' && "from-gray-100 to-white"
              )}>
                {/* Mini layout visualization */}
                <div className="w-full h-full p-1 flex flex-col justify-end">
                  <div className={cn(
                    "w-1/3 h-1 rounded mb-1",
                    variant.style === 'minimal' ? "bg-primary" : "bg-primary/80"
                  )} />
                  <div className={cn(
                    "w-full h-2 rounded",
                    variant.style === 'minimal' ? "bg-gray-800" : "bg-white/20"
                  )} />
                </div>
              </div>

              <span className={cn(
                "text-xs font-medium transition-colors",
                isSelected ? colors.text : "text-muted-foreground"
              )}>
                {variant.name}
              </span>

              {isSelected && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                  "bg-primary text-primary-foreground"
                )}>
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
