import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves image paths - now simplified for Supabase Storage
 */
export function resolveImagePath(imagePath: string): string {
  if (!imagePath) return '/placeholder.svg';

  // If it's already a full URL (Supabase Storage), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Fallback to placeholder
  return '/placeholder.svg';
}
