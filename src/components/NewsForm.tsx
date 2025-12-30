import { useState, useEffect } from 'react';
import { NewsFormData, NewsType, Language } from '@/types/template';
import { NewsTypeSelector } from './NewsTypeSelector';
import { TemplateStyleSelector } from './TemplateStyleSelector';
import { ImageUploader } from './ImageUploader';
import { TamilAIPanel } from './TamilAIPanel';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { getTemplateVariants } from '@/data/templateLayouts';
import { 
  Sparkles, MapPin, User, Calendar, Languages,
  Wand2, RefreshCw
} from 'lucide-react';
import { cn, sanitizeText, validateNewsFormData } from '@/lib/utils';
import { toast } from 'sonner';

interface NewsFormProps {
  onGenerate: (data: NewsFormData, variantId: string) => void;
  isGenerating: boolean;
}

const initialData: NewsFormData = {
  newsType: 'breaking',
  headline: '',
  subHeadline: '',
  description: '',
  reporterName: '',
  location: '',
  dateTime: new Date().toISOString().slice(0, 16),
  newsImage: null,
  logoImage: null,
  language: 'en',

  // defaults for optional UI controls
  headlineFontFamily: 'Oswald',
  headlineFontSize: 72,
  subHeadlineFontFamily: 'Roboto',
  subHeadlineFontSize: 36,
  descriptionFontSize: 28,
  channelTemplate: '',
  publishChannel: null,
  autoPublish: false,
};

export function NewsForm({ onGenerate, isGenerating }: NewsFormProps) {
  const [formData, setFormData] = useState<NewsFormData>(initialData);
  const [selectedVariant, setSelectedVariant] = useState<string>('breaking-classic');

  // Update variant when news type changes
  useEffect(() => {
    const variants = getTemplateVariants()[formData.newsType];
    if (variants && variants.length > 0) {
      setSelectedVariant(variants[0].id);
    }
  }, [formData.newsType]);

  const handleChange = <K extends keyof NewsFormData>(key: K, value: NewsFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // sanitize text fields
    const sanitized = {
      ...formData,
      headline: sanitizeText(formData.headline, 200),
      subHeadline: sanitizeText(formData.subHeadline, 200),
      description: sanitizeText(formData.description, 2000),
      reporterName: sanitizeText(formData.reporterName, 100),
      location: sanitizeText(formData.location, 100),
      // sanitize font family selections (allow only known choices)
      headlineFontFamily: ['Oswald','Roboto','Bebas Neue','Arial'].includes(formData.headlineFontFamily || '') ? formData.headlineFontFamily : 'Oswald',
      subHeadlineFontFamily: ['Oswald','Roboto','Bebas Neue','Arial'].includes(formData.subHeadlineFontFamily || '') ? formData.subHeadlineFontFamily : 'Roboto',
      // clamp font sizes
      headlineFontSize: Math.max(12, Math.min(200, Number(formData.headlineFontSize) || 72)),
      subHeadlineFontSize: Math.max(10, Math.min(120, Number(formData.subHeadlineFontSize) || 36)),
      descriptionFontSize: Math.max(10, Math.min(80, Number(formData.descriptionFontSize) || 28)),
      channelTemplate: sanitizeText(formData.channelTemplate || '', 64),
      publishChannel: formData.publishChannel === 'telegram' ? ('telegram' as const) : null,
    };

    const errors = validateNewsFormData(sanitized);
    if (errors.length > 0) {
      toast.error(errors.join(' '));
      return;
    }

    onGenerate(sanitized, selectedVariant);
  };

  const handleReset = () => {
    setFormData(initialData);
    setSelectedVariant('breaking-classic');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* News Type Selection */}
      <NewsTypeSelector
        selected={formData.newsType}
        onChange={(type) => handleChange('newsType', type)}
      />

      {/* Template Style Selection */}
      <TemplateStyleSelector
        newsType={formData.newsType}
        selectedVariant={selectedVariant}
        onChange={setSelectedVariant}
      />

      {/* Language Toggle */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground uppercase tracking-wider">
          Language
        </label>
        <div className="flex rounded-lg overflow-hidden border border-border">
          {(['en', 'ta'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleChange('language', lang)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
                formData.language === lang
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <Languages className="w-4 h-4" />
              {lang === 'en' ? 'English' : 'Tamil'}
            </button>
          ))}
        </div>
      </div>

      {/* Tamil AI Assistant Panel */}
      {formData.language === 'ta' && (
        <TamilAIPanel
          englishText={formData.headline}
          onSelectHeadline={(headline) => handleChange('headline', headline)}
        />
      )}

      {/* Main Content Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            Headline *
          </label>
          <Input
            value={formData.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder={formData.language === 'ta' ? "தலைப்பு உள்ளிடவும்..." : "Enter your news headline..."}
            className="h-12 text-lg font-headline"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            Sub-headline
          </label>
          <Input
            value={formData.subHeadline}
            onChange={(e) => handleChange('subHeadline', e.target.value)}
            placeholder={formData.language === 'ta' ? "துணை தலைப்பு..." : "Additional context or subtitle..."}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            Description / Ticker Text *
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={formData.language === 'ta' ? "விரிவான விளக்கம்..." : "Detailed description for ticker bar..."}
            rows={3}
            required
          />
        </div>
      </div>

      {/* Metadata Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Reporter
          </label>
          <Input
            value={formData.reporterName}
            onChange={(e) => handleChange('reporterName', e.target.value)}
            placeholder="Reporter name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <Input
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="News location..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date & Time
          </label>
          <Input
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) => handleChange('dateTime', e.target.value)}
          />
        </div>
      </div>

      {/* Style & Channel Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">Font & Size</label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Headline Font</label>
              <select
                value={formData.headlineFontFamily}
                onChange={(e) => handleChange('headlineFontFamily', e.target.value)}
                className="w-full mt-1 p-2 bg-card border border-border rounded"
              >
                <option value="Oswald">Oswald</option>
                <option value="Roboto">Roboto</option>
                <option value="Bebas Neue">Bebas Neue</option>
                <option value="Arial">Arial</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Headline Size</label>
              <input
                type="number"
                min={12}
                max={200}
                value={formData.headlineFontSize}
                onChange={(e) => handleChange('headlineFontSize', Number(e.target.value))}
                className="w-full mt-1 p-2 bg-card border border-border rounded"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Sub-headline Font</label>
              <select
                value={formData.subHeadlineFontFamily}
                onChange={(e) => handleChange('subHeadlineFontFamily', e.target.value)}
                className="w-full mt-1 p-2 bg-card border border-border rounded"
              >
                <option value="Roboto">Roboto</option>
                <option value="Oswald">Oswald</option>
                <option value="Arial">Arial</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Sub-headline Size</label>
              <input
                type="number"
                min={10}
                max={120}
                value={formData.subHeadlineFontSize}
                onChange={(e) => handleChange('subHeadlineFontSize', Number(e.target.value))}
                className="w-full mt-1 p-2 bg-card border border-border rounded"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Description Size</label>
              <input
                type="number"
                min={10}
                max={80}
                value={formData.descriptionFontSize}
                onChange={(e) => handleChange('descriptionFontSize', Number(e.target.value))}
                className="w-full mt-1 p-2 bg-card border border-border rounded"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">Channel Templates & Publish</label>

          <div>
            <label className="text-xs text-muted-foreground">Channel Template</label>
            <select
              value={formData.channelTemplate}
              onChange={(e) => {
                handleChange('channelTemplate', e.target.value);
                // if user picks a channel template, map to variant id when available
                if (e.target.value) {
                  // common mapping to variant ids defined in template layouts
                  const mapping: Record<string, string> = {
                    'polimer': 'channel-polimer',
                    'sun': 'channel-sun',
                    'jaya': 'channel-jaya',
                  };
                  const v = mapping[e.target.value];
                  if (v) setSelectedVariant(v);
                }
              }}
              className="w-full mt-1 p-2 bg-card border border-border rounded"
            >
              <option value="">None</option>
              <option value="polimer">Polimer (inspired)</option>
              <option value="sun">Sun News (inspired)</option>
              <option value="jaya">Jaya (inspired)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                id="publish-telegram"
                type="checkbox"
                checked={formData.publishChannel === 'telegram'}
                onChange={(e) => handleChange('publishChannel', e.target.checked ? 'telegram' : null)}
                className="w-4 h-4"
              />
              <label htmlFor="publish-telegram" className="text-sm text-foreground">Queue for Telegram publish</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="auto-publish"
                type="checkbox"
                checked={!!formData.autoPublish}
                onChange={(e) => handleChange('autoPublish', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="auto-publish" className="text-sm text-foreground">Auto-publish on Generate</label>
            </div>

            <p className="text-xs text-muted-foreground">Note: Telegram publishing requires a configured server-side webhook (see settings). Auto-publish will trigger once the preview is rendered.</p>
          </div>
        </div>
      </div>

      {/* Image Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageUploader
          label="News Image"
          value={formData.newsImage}
          onChange={(value) => handleChange('newsImage', value)}
          hint="Main visual for your news story"
        />
        <ImageUploader
          label="Channel Logo"
          value={formData.logoImage}
          onChange={(value) => handleChange('logoImage', value)}
          hint="Your channel or brand logo"
        />
      </div>

      {/* AI Enhancement Indicator */}
      <div className="glass-panel rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">AI Enhancement Active</p>
            <p className="text-xs text-muted-foreground">
              Auto text formatting • Face detection • Smart layout • Image optimization
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          variant="news"
          size="xl"
          className="flex-1"
          disabled={isGenerating || !formData.headline || !formData.description}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating Template...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Template
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xl"
          onClick={handleReset}
        >
          <RefreshCw className="w-5 h-5" />
          Reset
        </Button>
      </div>
    </form>
  );
}
