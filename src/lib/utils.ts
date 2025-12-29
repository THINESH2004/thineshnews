import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize user-supplied text by trimming, clamping length, and escaping HTML-sensitive chars.
 */
export function sanitizeText(input: string, maxLen = 1000): string {
  if (!input) return '';
  const trimmed = input.trim().slice(0, maxLen);
  return trimmed
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Simple validation for news form data. Returns an array of error strings (empty if valid).
 */
import type { NewsFormData } from '@/types/template';
export function validateNewsFormData(data: NewsFormData): string[] {
  const errors: string[] = [];
  if (!data.headline || data.headline.trim().length === 0) {
    errors.push('Headline is required.');
  } else if (data.headline.length > 200) {
    errors.push('Headline must be 200 characters or fewer.');
  }

  if (data.subHeadline && data.subHeadline.length > 200) {
    errors.push('Sub-headline must be 200 characters or fewer.');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required.');
  } else if (data.description.length > 2000) {
    errors.push('Description must be 2000 characters or fewer.');
  }

  if (data.reporterName && data.reporterName.length > 100) {
    errors.push('Reporter name must be 100 characters or fewer.');
  }

  if (data.location && data.location.length > 100) {
    errors.push('Location must be 100 characters or fewer.');
  }

  // Basic safe-char check (no angle brackets allowed)
  const disallowed = /[<>]/;
  ['headline', 'subHeadline', 'description', 'reporterName', 'location'].forEach((k) => {
    const val = (data as any)[k] as string;
    if (val && disallowed.test(val)) {
      errors.push('Inputs must not contain angle brackets (< or >).');
    }
  });

  return errors;
}

/**
 * Create a file-system safe filename segment by removing unsafe chars and limiting length.
 */
export function safeFilename(input = ''): string {
  return input
    .replace(/[^a-z0-9-_\.]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

/**
 * Validate image source strings for canvas loading.
 * Accepts data:image/* and http(s) URLs only. Rejects javascript: and other schemes.
 */
export function isValidImageSrc(src?: string): boolean {
  if (!src) return false;
  const s = src.trim();
  if (s.startsWith('data:image/')) return true;
  try {
    const url = new URL(s, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
} 