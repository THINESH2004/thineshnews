import { useState } from 'react';
import { NewsFormData, NewsType, Language } from '@/types/template';
import { NewsTypeSelector } from './NewsTypeSelector';
import { ImageUploader } from './ImageUploader';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Sparkles, Download, Send, MapPin, User, Calendar, Languages,
  Wand2, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsFormProps {
  onGenerate: (data: NewsFormData) => void;
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
};

export function NewsForm({ onGenerate, isGenerating }: NewsFormProps) {
  const [formData, setFormData] = useState<NewsFormData>(initialData);

  const handleChange = <K extends keyof NewsFormData>(key: K, value: NewsFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const handleReset = () => {
    setFormData(initialData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* News Type Selection */}
      <NewsTypeSelector
        selected={formData.newsType}
        onChange={(type) => handleChange('newsType', type)}
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

      {/* Main Content Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            Headline *
          </label>
          <Input
            value={formData.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="Enter your news headline..."
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
            placeholder="Additional context or subtitle..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground uppercase tracking-wider mb-2">
            Description / Ticker Text *
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Detailed description for ticker bar..."
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
