import { Product } from '@/data/products';

type SupportedLocale = 'fr' | 'en' | 'de' | 'es' | 'pt' | 'it' | 'nl' | 'ja' | 'ko';

/**
 * Get translated product name and description based on current locale
 * Falls back to French (default) if translation not available
 */
export function getTranslatedProduct(product: Product, locale: string): { name: string; description: string } {
  // French is the default language, use original fields
  if (locale === 'fr' || !product.translations) {
    return {
      name: product.name,
      description: product.description,
    };
  }

  const translation = product.translations[locale as SupportedLocale];

  return {
    name: translation?.name || product.name,
    description: translation?.description || product.description,
  };
}

/**
 * Hook to get translated product based on current locale from localStorage
 */
export function useTranslatedProduct(product: Product): { name: string; description: string } {
  const locale = typeof window !== 'undefined'
    ? localStorage.getItem('deesse_locale') || 'fr'
    : 'fr';

  return getTranslatedProduct(product, locale);
}
