import { Zap, Image, FileText, Clock } from 'lucide-react';

interface StatsPanelProps {
  templatesGenerated: number;
}

export function StatsPanel({ templatesGenerated }: StatsPanelProps) {
  const stats = [
    {
      icon: Zap,
      label: 'Templates Generated',
      value: templatesGenerated,
      color: 'text-news-yellow',
      bg: 'bg-news-yellow/10',
    },
    {
      icon: Image,
      label: 'Images Processed',
      value: templatesGenerated * 2,
      color: 'text-news-blue',
      bg: 'bg-news-blue/10',
    },
    {
      icon: FileText,
      label: 'Text Optimized',
      value: templatesGenerated * 4,
      color: 'text-news-green',
      bg: 'bg-news-green/10',
    },
    {
      icon: Clock,
      label: 'Time Saved (mins)',
      value: templatesGenerated * 15,
      color: 'text-news-orange',
      bg: 'bg-news-orange/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-panel rounded-xl p-4 border border-border/30"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-headline text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
