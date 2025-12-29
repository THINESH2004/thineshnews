import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ImageUploaderProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  hint?: string;
}

export function ImageUploader({ label, value, onChange, className, hint }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-foreground uppercase tracking-wider">
        {label}
      </label>
      
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-card">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange(null)}
            >
              <X className="w-4 h-4" />
              Remove
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-news-green/90 text-white text-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Ready
          </div>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center gap-3 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {isDragging ? (
              <Upload className="w-6 h-6" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragging ? 'Drop image here' : 'Click or drag to upload'}
            </p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
        </label>
      )}
    </div>
  );
}
