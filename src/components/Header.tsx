import { Tv2, Zap, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-border/30">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-red">
                <Tv2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-news-green rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="font-headline text-2xl tracking-wide">
                <span className="text-gradient">NEWS</span>
                <span className="text-foreground">FORGE</span>
              </h1>
              <p className="text-xs text-muted-foreground font-body tracking-wider uppercase">
                AI Template Automation
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full">
              <Zap className="w-4 h-4 text-news-yellow" />
              <span className="text-sm font-medium live-indicator pl-4">LIVE</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Powered</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
