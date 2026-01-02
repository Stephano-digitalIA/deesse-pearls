import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dynamic image import mapping for product images
const productImages = import.meta.glob('/src/assets/products/*.jpg', { eager: true, import: 'default' }) as Record<string, string>;
const assetImages = import.meta.glob('/src/assets/*.jpg', { eager: true, import: 'default' }) as Record<string, string>;

/**
 * Resolves image paths from database to actual URLs
 * Handles both /src/assets/... paths and full URLs
 */
export function resolveImagePath(imagePath: string): string {
  if (!imagePath) return '/placeholder.svg';
  
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Handle /src/assets/products/... paths
  if (imagePath.startsWith('/src/assets/products/')) {
    const resolved = productImages[imagePath];
    if (resolved) return resolved;
  }
  
  // Handle /src/assets/... paths
  if (imagePath.startsWith('/src/assets/')) {
    const resolved = assetImages[imagePath];
    if (resolved) return resolved;
  }
  
  // Fallback to placeholder
  return imagePath || '/placeholder.svg';
}
