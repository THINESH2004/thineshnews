import { useEffect, useRef, useState } from 'react';
import { NewsFormData } from '@/types/template';
import { templateVariants } from '@/data/templateLayouts';
import { Button } from './ui/button';
import { Download, Send, Maximize2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TemplatePreviewProps {
  data: NewsFormData | null;
  variantId: string;
  isGenerating: boolean;
}

export function TemplatePreview({ data, variantId, isGenerating }: TemplatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find the layout from variants
    const variants = templateVariants[data.newsType];
    const variant = variants?.find(v => v.id === variantId) || variants?.[0];
    if (!variant) return;

    const layout = variant.layout;
    canvas.width = layout.width;
    canvas.height = layout.height;

    // Clear and draw background
    ctx.fillStyle = layout.backgroundColor;
    ctx.fillRect(0, 0, layout.width, layout.height);

    // Draw gradient overlay
    if (layout.gradientOverlay) {
      const gradient = ctx.createLinearGradient(0, 0, layout.width, layout.height);
      // Parse gradient colors based on type
      if (layout.type === 'breaking') {
        gradient.addColorStop(0, 'rgba(220,38,38,0.3)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
      } else if (layout.type === 'sports') {
        gradient.addColorStop(0, 'rgba(249,115,22,0.25)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      } else if (layout.type === 'weather') {
        gradient.addColorStop(0, 'rgba(6,182,212,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
      } else if (layout.type === 'political') {
        gradient.addColorStop(0, 'rgba(139,92,246,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
      } else if (layout.type === 'interview') {
        gradient.addColorStop(0, 'rgba(59,130,246,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
      } else if (layout.type === 'election') {
        gradient.addColorStop(0, 'rgba(234,179,8,0.25)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      } else if (layout.type === 'special') {
        gradient.addColorStop(0, 'rgba(220,38,38,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
      } else if (layout.type === 'festival') {
        gradient.addColorStop(0, 'rgba(234,179,8,0.3)');
        gradient.addColorStop(0.5, 'rgba(220,38,38,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }

    // Process each element
    const imagePromises: Promise<void>[] = [];

    // Draw images first (they should be behind text)
    layout.elements
      .filter(el => el.type === 'image' || el.type === 'logo')
      .forEach((element) => {
        const value = element.binding ? data[element.binding] : null;

        if (element.type === 'image' && typeof value === 'string' && value) {
          const promise = new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              ctx.save();
              roundRect(ctx, element.x, element.y, element.width, element.height, element.style.borderRadius || 0);
              ctx.clip();
              
              const scale = Math.max(element.width / img.width, element.height / img.height);
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              const offsetX = element.x + (element.width - scaledWidth) / 2;
              const offsetY = element.y + (element.height - scaledHeight) / 2;
              
              ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
              ctx.restore();
              resolve();
            };
            img.onerror = () => resolve();
            img.src = value;
          });
          imagePromises.push(promise);
        }

        if (element.type === 'logo' && typeof value === 'string' && value) {
          const promise = new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              let drawWidth = element.width;
              let drawHeight = element.height;
              
              if (aspectRatio > element.width / element.height) {
                drawHeight = drawWidth / aspectRatio;
              } else {
                drawWidth = drawHeight * aspectRatio;
              }
              
              ctx.drawImage(
                img,
                element.x + (element.width - drawWidth) / 2,
                element.y + (element.height - drawHeight) / 2,
                drawWidth,
                drawHeight
              );
              resolve();
            };
            img.onerror = () => resolve();
            img.src = value;
          });
          imagePromises.push(promise);
        }
      });

    // Wait for images then draw text elements
    Promise.all(imagePromises).then(() => {
      layout.elements
        .filter(el => el.type !== 'image' && el.type !== 'logo')
        .forEach((element) => {
          const value = element.binding ? data[element.binding] : element.content;

          if (element.type === 'badge') {
            ctx.fillStyle = element.style.backgroundColor || '#dc2626';
            roundRect(ctx, element.x, element.y, element.width, element.height, element.style.borderRadius || 4);
            ctx.fill();

            ctx.fillStyle = element.style.color || '#ffffff';
            ctx.font = `${element.style.fontWeight || 'bold'} ${element.style.fontSize || 28}px ${element.style.fontFamily || 'Bebas Neue'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              element.content || '',
              element.x + element.width / 2,
              element.y + element.height / 2
            );
          }

          if (element.type === 'text' && typeof value === 'string') {
            ctx.fillStyle = element.style.color || '#ffffff';
            const fontSize = element.style.fontSize || 48;
            ctx.font = `${element.style.fontWeight || 'bold'} ${fontSize}px ${element.style.fontFamily || 'Oswald'}`;
            ctx.textAlign = (element.style.textAlign as CanvasTextAlign) || 'left';
            ctx.textBaseline = 'top';

            const text = element.style.textTransform === 'uppercase' ? value.toUpperCase() : value;
            const lines = wrapText(ctx, text, element.width, element.style.maxLines || 3);
            
            lines.forEach((line, i) => {
              let x = element.x;
              if (element.style.textAlign === 'center') {
                x = element.x + element.width / 2;
              } else if (element.style.textAlign === 'right') {
                x = element.x + element.width;
              }
              ctx.fillText(line, x, element.y + i * (fontSize * 1.2));
            });
          }

          if (element.type === 'ticker' && typeof value === 'string') {
            ctx.fillStyle = element.style.backgroundColor || '#dc2626';
            ctx.fillRect(element.x, element.y, element.width, element.height);

            ctx.fillStyle = element.style.color || '#ffffff';
            ctx.font = `${element.style.fontWeight || 'bold'} ${element.style.fontSize || 26}px ${element.style.fontFamily || 'Roboto'}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            
            const padding = element.style.padding || 20;
            const tickerText = value.length > 150 ? value.substring(0, 147) + '...' : value;
            ctx.fillText(tickerText, element.x + padding, element.y + element.height / 2);
          }
        });

      setIsRendered(true);
    });
  }, [data, variantId]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `news-template-${data?.newsType}-${variantId}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('Template downloaded successfully!');
  };

  const handleLaunch = () => {
    toast.success('Template launched to social media!', {
      description: 'Your template has been queued for publishing.',
    });
    console.log('Launching template:', { data, variantId });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-xl text-foreground uppercase tracking-wider">
          Live Preview
        </h3>
        {data && isRendered && (
          <div className="flex gap-2">
            <Button variant="broadcast" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
            <Button variant="success" size="sm" onClick={handleLaunch}>
              <Send className="w-4 h-4" />
              Launch
            </Button>
          </div>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border bg-card">
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg font-headline text-foreground">Generating Template...</p>
              <p className="text-sm text-muted-foreground">AI is processing your content</p>
            </div>
          </div>
        )}

        {!data && !isGenerating && (
          <div className="aspect-video flex items-center justify-center bg-muted/20">
            <div className="text-center p-8">
              <Maximize2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-headline text-muted-foreground">No Preview Yet</p>
              <p className="text-sm text-muted-foreground/70">
                Fill the form and click "Generate Template"
              </p>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`w-full h-auto ${!data ? 'hidden' : ''}`}
          style={{ maxHeight: '70vh' }}
        />
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length >= maxLines) {
        lines[lines.length - 1] += '...';
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}
