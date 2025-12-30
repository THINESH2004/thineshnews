import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Send, Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TelegramSettingsProps {
  onClose?: () => void;
}

export function TelegramSettings({ onClose }: TelegramSettingsProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [useDirectApi, setUseDirectApi] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load saved webhook URL from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('telegram_webhook_url');
    if (saved) {
      setWebhookUrl(saved);
      setUseDirectApi(false);
    }
  }, []);

  const handleSaveWebhook = () => {
    if (webhookUrl.trim()) {
      localStorage.setItem('telegram_webhook_url', webhookUrl.trim());
      toast.success('Webhook URL saved');
    } else {
      localStorage.removeItem('telegram_webhook_url');
      toast.info('Webhook URL cleared');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke('telegram-publish', {
        body: {
          caption: '🔔 Test message from NewsForge - Telegram integration is working!',
          customWebhook: useDirectApi ? undefined : webhookUrl,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setIsConfigured(false);
      } else {
        toast.success('Test message sent successfully!');
        setIsConfigured(true);
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Failed to send test message. Check your configuration.');
      setIsConfigured(false);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="glass-panel border-border/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <CardTitle className="font-headline uppercase tracking-wider">
              Telegram Publishing
            </CardTitle>
          </div>
          {isConfigured && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Configure automated publishing to your Telegram channel or group.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Direct API vs Webhook Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30">
          <div className="space-y-1">
            <Label htmlFor="direct-api" className="text-sm font-medium">
              Use Direct Telegram API
            </Label>
            <p className="text-xs text-muted-foreground">
              Uses bot token and chat ID configured in backend secrets
            </p>
          </div>
          <Switch
            id="direct-api"
            checked={useDirectApi}
            onCheckedChange={setUseDirectApi}
          />
        </div>

        {/* Direct API Instructions */}
        {useDirectApi && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Backend Configuration Required
                </p>
                <p className="text-xs text-muted-foreground">
                  The bot token and chat ID are configured as backend secrets for security.
                  Contact your administrator to update these values.
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• <strong>TELEGRAM_BOT_TOKEN</strong>: Get from @BotFather on Telegram</p>
                  <p>• <strong>TELEGRAM_CHAT_ID</strong>: Your channel/group ID (e.g., -1001234567890)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Webhook URL */}
        {!useDirectApi && (
          <div className="space-y-3">
            <Label htmlFor="webhook-url">Custom Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://hooks.zapier.com/... or your custom endpoint"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSaveWebhook}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use Zapier, Make, or your own webhook to handle Telegram publishing.
            </p>
          </div>
        )}

        {/* Help Links */}
        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="https://core.telegram.org/bots#creating-a-new-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Create Telegram Bot
          </a>
          <span className="text-muted-foreground">•</span>
          <a
            href="https://zapier.com/apps/telegram/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Zapier Integration
          </a>
        </div>

        {/* Test Button */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || (!useDirectApi && !webhookUrl)}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Test Message
              </>
            )}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Status Info */}
        {!isConfigured && !isTesting && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Send a test message to verify your configuration before publishing news.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
