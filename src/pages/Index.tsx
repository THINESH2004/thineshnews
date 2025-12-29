import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { NewsForm } from '@/components/NewsForm';
import { TemplatePreview } from '@/components/TemplatePreview';
import { StatsPanel } from '@/components/StatsPanel';
import { TemplateGallery } from '@/components/TemplateGallery';
import { NewsFormData, NewsType } from '@/types/template';
import { toast } from 'sonner';
import { Sparkles, Tv2 } from 'lucide-react';
import { sanitizeText, validateNewsFormData } from '@/lib/utils';

export default function Index() {
  const [generatedData, setGeneratedData] = useState<NewsFormData | null>(null);
  const [currentVariantId, setCurrentVariantId] = useState<string>('breaking-classic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [templatesGenerated, setTemplatesGenerated] = useState(0);

  const handleGenerate = useCallback(async (data: NewsFormData, variantId: string) => {
    setIsGenerating(true);
    setCurrentVariantId(variantId);

    // Validate/sanitize (defense-in-depth)
    const sanitized = {
      ...data,
      headline: sanitizeText(data.headline, 200),
      subHeadline: sanitizeText(data.subHeadline, 200),
      description: sanitizeText(data.description, 2000),
      reporterName: sanitizeText(data.reporterName, 100),
      location: sanitizeText(data.location, 100),
    };

    const errors = validateNewsFormData(sanitized);
    if (errors.length > 0) {
      setIsGenerating(false);
      toast.error(errors.join(' '));
      return;
    }

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // AI enhancements would happen here
    const enhancedData = {
      ...sanitized,
    };
    
    setGeneratedData(enhancedData);
    setTemplatesGenerated((prev) => prev + 1);
    setIsGenerating(false);
    
    toast.success('Template generated successfully!', {
      description: 'AI has optimized your content and layout.',
    });
  }, []);

  const handleTemplateSelect = (type: NewsType) => {
    toast.info(`Selected ${type} template`, {
      description: 'Customize and generate your template.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto px-6 py-12 relative">
          <div className="text-center max-w-3xl mx-auto space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm mb-4">
              <Sparkles className="w-4 h-4 text-news-yellow" />
              <span className="text-muted-foreground">AI-Powered Automation</span>
            </div>
            <h1 className="font-news text-5xl md:text-6xl tracking-wider">
              <span className="text-gradient">SMART NEWS</span>{' '}
              <span className="text-foreground">TEMPLATE</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Replace manual Photoshop work with AI-driven template generation. 
              Create professional broadcast-quality graphics in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Panel */}
      <section className="container mx-auto px-6 -mt-6 relative z-10">
        <StatsPanel templatesGenerated={templatesGenerated} />
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-border/30 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Tv2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-headline text-xl text-foreground uppercase tracking-wider">
                  Template Builder
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure your news template
                </p>
              </div>
            </div>
            <NewsForm onGenerate={handleGenerate} isGenerating={isGenerating} />
          </div>

          {/* Preview Panel */}
          <div className="glass-panel rounded-2xl p-6 border border-border/30 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <TemplatePreview 
              data={generatedData} 
              variantId={currentVariantId}
              isGenerating={isGenerating} 
            />
          </div>
        </div>

        {/* Template Gallery */}
        <section className="mt-12 glass-panel rounded-2xl p-6 border border-border/30 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <TemplateGallery onSelect={handleTemplateSelect} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-headline text-foreground">NEWSFORGE</span> — 
            AI-Powered Smart News Template Automation Platform
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Replacing manual design with intelligent automation
          </p>
        </div>
      </footer>
    </div>
  );
}
