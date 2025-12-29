export type NewsType = 
  | 'breaking'
  | 'political'
  | 'sports'
  | 'weather'
  | 'interview'
  | 'election'
  | 'special'
  | 'festival';

export type Language = 'en' | 'ta';

export interface NewsFormData {
  newsType: NewsType;
  headline: string;
  subHeadline: string;
  description: string;
  reporterName: string;
  location: string;
  dateTime: string;
  newsImage: string | null;
  logoImage: string | null;
  language: Language;
}

export interface TemplateLayout {
  id: string;
  name: string;
  type: NewsType;
  width: number;
  height: number;
  backgroundColor: string;
  gradientOverlay?: string;
  elements: TemplateElement[];
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'logo' | 'badge' | 'ticker' | 'overlay';
  x: number;
  y: number;
  width: number;
  height: number;
  style: ElementStyle;
  content?: string;
  binding?: keyof NewsFormData;
}

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  borderRadius?: number;
  shadow?: boolean;
  gradient?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  maxLines?: number;
}

export const NEWS_TYPE_CONFIG: Record<NewsType, { label: string; color: string; icon: string }> = {
  breaking: { label: 'Breaking News', color: 'news-red', icon: 'Zap' },
  political: { label: 'Political News', color: 'news-purple', icon: 'Landmark' },
  sports: { label: 'Sports', color: 'news-orange', icon: 'Trophy' },
  weather: { label: 'Weather', color: 'news-cyan', icon: 'Cloud' },
  interview: { label: 'Interview', color: 'news-blue', icon: 'Mic' },
  election: { label: 'Election Results', color: 'news-yellow', icon: 'Vote' },
  special: { label: 'Special Report', color: 'news-red', icon: 'Star' },
  festival: { label: 'Festival Greetings', color: 'news-yellow', icon: 'PartyPopper' },
};
