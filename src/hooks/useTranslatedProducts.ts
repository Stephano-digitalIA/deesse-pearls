// src/hooks/useTranslatedProducts.ts
// Version Supabase - fetches products from Supabase database

import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { supabase } from '@/integrations/supabase/client';

// Database translation type
interface DbTranslation {
  product_id: number;
  lang: string;
  name: string;
  description: string;
  category: string;
}

// Product type compatible with the rest of the app
export interface Product {
  id: string;
  slug: string;
  category: 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'earrings' | 'pendentifs' | 'parures' | 'broches';
  name: string;
  description: string;
  price: number;
  images: string[];
  badge?: 'new' | 'bestseller' | null;
  rating: number;
  reviews: number;
  variants?: {
    sizes?: string[];
    qualities?: string[];
    diameters?: string[];
  } | null;
  in_stock: boolean;
  inStock: boolean;
}

// Supabase product type (matches database schema)
interface SupabaseProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  images: string[] | null;
  description: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  slug: string;
  badge: string | null;
  rating: number;
  reviews: number;
  variants: {
    sizes?: string[];
    qualities?: string[];
    diameters?: string[];
  } | null;
  in_stock: boolean;
}

// Convert Supabase product to app product format
const convertSupabaseProduct = (p: SupabaseProduct): Product => {
  // Normalize category to match app types
  const categoryMap: Record<string, Product['category']> = {
    'pearls': 'pearls',
    'perles': 'pearls',
    'bracelets': 'bracelets',
    'Bracelets': 'bracelets',
    'necklaces': 'necklaces',
    'colliers': 'necklaces',
    'rings': 'rings',
    'bagues': 'rings',
    'earrings': 'earrings',
    'Boucles d\'oreilles': 'earrings',
    'pendentifs': 'pendentifs',
    'parures': 'parures',
    'broches': 'broches',
  };

  // Ensure images is always an array
  const images = p.images && p.images.length > 0
    ? p.images
    : p.image
      ? [p.image]
      : [];

  return {
    id: String(p.id),
    slug: p.slug,
    category: categoryMap[p.category] || 'pearls',
    name: p.name,
    description: p.description || '',
    price: p.price,
    images,
    badge: p.badge as 'new' | 'bestseller' | null,
    rating: p.rating || 0,
    reviews: p.reviews || 0,
    variants: p.variants,
    in_stock: p.in_stock ?? true,
    inStock: p.in_stock ?? true,
  };
};

// Helper function to apply translation to a product
const applyTranslation = (product: Product, translation: DbTranslation | undefined): Product => {
  if (!translation) {
    return product;
  }

  return {
    ...product,
    name: translation.name || product.name,
    description: translation.description || product.description,
  };
};

// Fetch translations for a language
const fetchTranslationsForLanguage = async (language: string): Promise<Map<number, DbTranslation>> => {
  console.log('[Translations] Fetching for language:', language);

  try {
    const { data, error } = await withTimeout(
      supabase.from('product_translations').select('*').eq('lang', language)
    );

    console.log('[Translations] Result:', { count: data?.length, error: error?.message });

    if (error) {
      console.error('[Translations] Error:', error);
      return new Map();
    }

    const translationsMap = new Map<number, DbTranslation>();
    (data || []).forEach((t: DbTranslation) => {
      translationsMap.set(t.product_id, t);
    });

    return translationsMap;
  } catch (e) {
    console.error('[Translations] Exception:', e);
    return new Map();
  }
};

// Timeout wrapper for Supabase queries
const withTimeout = <T>(promise: Promise<T>, ms = 10000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

// Fetch all products from Supabase
const fetchProductsFromSupabase = async (): Promise<Product[]> => {
  console.log('[Products] Fetching all products...');

  try {
    const { data, error } = await withTimeout(
      supabase.from('products').select('*').eq('is_active', true).order('name')
    );

    console.log('[Products] Result:', { count: data?.length, error: error?.message });

    if (error) {
      console.error('[Products] Error:', error);
      throw error;
    }

    return (data || []).map(convertSupabaseProduct);
  } catch (e) {
    console.error('[Products] Exception:', e);
    throw e;
  }
};

// Fetch products by category from Supabase
const fetchProductsByCategoryFromSupabase = async (category: string): Promise<Product[]> => {
  // Map app category to possible database categories
  const categoryVariants: Record<string, string[]> = {
    'pearls': ['pearls', 'perles'],
    'bracelets': ['bracelets', 'Bracelets'],
    'necklaces': ['necklaces', 'colliers'],
    'rings': ['rings', 'bagues'],
    'earrings': ['earrings', 'Boucles d\'oreilles'],
    'pendentifs': ['pendentifs'],
    'parures': ['parures'],
    'broches': ['broches'],
  };

  const categoriesToMatch = categoryVariants[category] || [category];

  const { data, error } = await withTimeout(
    supabase.from('products').select('*').eq('is_active', true).in('category', categoriesToMatch).order('name')
  );

  if (error) {
    console.error('Error fetching products by category from Supabase:', error);
    throw error;
  }

  return (data || []).map(convertSupabaseProduct);
};

// Fetch single product by slug from Supabase
const fetchProductBySlugFromSupabase = async (slug: string): Promise<Product | null> => {
  const { data, error } = await withTimeout(
    supabase.from('products').select('*').eq('slug', slug).eq('is_active', true).single()
  );

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - product not found
      return null;
    }
    console.error('Error fetching product by slug from Supabase:', error);
    throw error;
  }

  return data ? convertSupabaseProduct(data) : null;
};

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', language],
    queryFn: async (): Promise<Product[]> => {
      console.log('[useTranslatedProducts] Starting fetch for language:', language);

      try {
        // Fetch products and translations in parallel
        const [products, translationsMap] = await Promise.all([
          fetchProductsFromSupabase(),
          fetchTranslationsForLanguage(language),
        ]);

        console.log('[useTranslatedProducts] Got products:', products.length, 'translations:', translationsMap.size);

        // Apply translations to products
        const result = products.map(p => {
          const translation = translationsMap.get(Number(p.id));
          return applyTranslation(p, translation);
        });

        console.log('[useTranslatedProducts] Returning', result.length, 'products');
        return result;
      } catch (e) {
        console.error('[useTranslatedProducts] Error:', e);
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: string) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'category', category, language],
    queryFn: async (): Promise<Product[]> => {
      const [products, translationsMap] = await Promise.all([
        fetchProductsByCategoryFromSupabase(category),
        fetchTranslationsForLanguage(language),
      ]);

      return products.map(p => {
        const translation = translationsMap.get(Number(p.id));
        return applyTranslation(p, translation);
      });
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

// Fetch single product by slug with translations
export const useTranslatedProductBySlug = (slug: string) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'slug', slug, language],
    queryFn: async (): Promise<Product | null> => {
      const product = await fetchProductBySlugFromSupabase(slug);
      if (!product) return null;
      const translationsMap = await fetchTranslationsForLanguage(language);
      const translation = translationsMap.get(Number(product.id));
      return applyTranslation(product, translation);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

// Fetch featured products with translations
export const useTranslatedFeaturedProducts = (limit = 4) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'featured', limit, language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, translationsMap] = await Promise.all([
        withTimeout(
          supabase.from('products').select('*').eq('is_active', true).or('badge.eq.new,badge.eq.bestseller').limit(limit)
        ),
        fetchTranslationsForLanguage(language),
      ]);

      if (productsResult.error) {
        console.error('Error fetching featured products:', productsResult.error);
        throw productsResult.error;
      }

      const products = (productsResult.data || []).map(convertSupabaseProduct);
      return products.map(p => {
        const translation = translationsMap.get(Number(p.id));
        return applyTranslation(p, translation);
      });
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'new', language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, translationsMap] = await Promise.all([
        withTimeout(
          supabase.from('products').select('*').eq('is_active', true).eq('badge', 'new').order('created_at', { ascending: false })
        ),
        fetchTranslationsForLanguage(language),
      ]);

      if (productsResult.error) {
        console.error('Error fetching new arrivals:', productsResult.error);
        throw productsResult.error;
      }

      const products = (productsResult.data || []).map(convertSupabaseProduct);
      return products.map(p => {
        const translation = translationsMap.get(Number(p.id));
        return applyTranslation(p, translation);
      });
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'bestseller', language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, translationsMap] = await Promise.all([
        withTimeout(
          supabase.from('products').select('*').eq('is_active', true).eq('badge', 'bestseller').order('rating', { ascending: false })
        ),
        fetchTranslationsForLanguage(language),
      ]);

      if (productsResult.error) {
        console.error('Error fetching bestsellers:', productsResult.error);
        throw productsResult.error;
      }

      const products = (productsResult.data || []).map(convertSupabaseProduct);
      return products.map(p => {
        const translation = translationsMap.get(Number(p.id));
        return applyTranslation(p, translation);
      });
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};
