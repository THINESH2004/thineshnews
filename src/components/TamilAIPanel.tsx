import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Languages, Newspaper, Send, Copy, CheckCircle, FileText, Heading, LayoutTemplate, MessageSquare, List, ListOrdered } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TamilAIPanelProps {
  englishText?: string;
  onSelectHeadline?: (headline: string) => void;
}

type TranslationMode = 'translate' | 'headlines' | 'template' | 'telegram' | 'full' | 'bullets' | 'numbered';

export function TamilAIPanel({ englishText = '', onSelectHeadline }: TamilAIPanelProps) {
  const [inputText, setInputText] = useState(englishText);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<TranslationMode>('full');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleTranslate = async (mode: TranslationMode) => {
    if (!inputText.trim()) {
      toast.error('Please enter English news text');
      return;
    }

    setIsLoading(true);
    setActiveMode(mode);

    try {
      const { data, error } = await supabase.functions.invoke('tamil-translate', {
        body: { englishNews: inputText, mode }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data.result);
      toast.success('Tamil content generated!');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to generate Tamil content');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parseResult = () => {
    if (!result) return [];
    return result.split('\n').filter(line => line.trim());
  };

  const handleSelectLine = (line: string) => {
    // Remove prefixes like "BREAKING:", "NEWS:", etc.
    const cleanLine = line.replace(/^(BREAKING|NEWS|TICKER|BADGE|HEADLINE|DESCRIPTION|TRANSLATION|TELEGRAM):\s*/i, '');
    onSelectHeadline?.(cleanLine);
    toast.success('Headline selected');
  };

  return (
    <Card className="glass-panel border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Languages className="w-5 h-5 text-primary" />
          <span className="font-headline uppercase tracking-wider">Tamil AI Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter English news text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="min-h-[100px] bg-background/50 border-border/50"
        />

        <Tabs defaultValue="full" className="w-full">
          <TabsList className="grid grid-cols-4 h-auto mb-1">
            <TabsTrigger value="full" className="text-xs py-1.5 gap-1">
              <FileText className="w-3 h-3" />Full
            </TabsTrigger>
            <TabsTrigger value="translate" className="text-xs py-1.5 gap-1">
              <Languages className="w-3 h-3" />Translate
            </TabsTrigger>
            <TabsTrigger value="headlines" className="text-xs py-1.5 gap-1">
              <Heading className="w-3 h-3" />Headlines
            </TabsTrigger>
            <TabsTrigger value="template" className="text-xs py-1.5 gap-1">
              <LayoutTemplate className="w-3 h-3" />Template
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid grid-cols-3 h-auto">
            <TabsTrigger value="telegram" className="text-xs py-1.5 gap-1">
              <MessageSquare className="w-3 h-3" />Telegram
            </TabsTrigger>
            <TabsTrigger value="bullets" className="text-xs py-1.5 gap-1">
              <List className="w-3 h-3" />Bullets
            </TabsTrigger>
            <TabsTrigger value="numbered" className="text-xs py-1.5 gap-1">
              <ListOrdered className="w-3 h-3" />Numbered
            </TabsTrigger>
          </TabsList>

          {(['full', 'translate', 'headlines', 'template', 'telegram', 'bullets', 'numbered'] as TranslationMode[]).map((mode) => (
            <TabsContent key={mode} value={mode} className="mt-3">
              <Button
                onClick={() => handleTranslate(mode)}
                disabled={isLoading || !inputText.trim()}
                className="w-full"
              >
                {isLoading && activeMode === mode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Newspaper className="w-4 h-4 mr-2" />
                    Generate {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </>
                )}
              </Button>
            </TabsContent>
          ))}
        </Tabs>

        {result && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {activeMode.toUpperCase()} Result
              </Badge>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {parseResult().map((line, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-background/50 border border-border/30 group hover:border-primary/50 transition-colors"
                >
                  <p className="text-sm font-tamil leading-relaxed">{line}</p>
                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard(line, index)}
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      Copy
                    </Button>
                    {onSelectHeadline && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleSelectLine(line)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Use
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
