// src/hooks/useTranslatedProducts.ts
// Version Supabase - fetches products from Supabase database

import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { productTranslations } from '@/data/productTranslations';
import { supabase } from '@/integrations/supabase/client';

// Product translation type
interface ProductTranslation {
  name: string;
  description: string;
}

// Product type compatible with the rest of the app
export interface Product {
  id: string;
  slug: string;
  category: 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'other';
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
  inStock?: boolean; // Alias for compatibility
  translations?: {
    en?: ProductTranslation;
    de?: ProductTranslation;
    es?: ProductTranslation;
    pt?: ProductTranslation;
    it?: ProductTranslation;
    nl?: ProductTranslation;
    ja?: ProductTranslation;
    ko?: ProductTranslation;
  };
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
    'earrings': 'other',
    'Boucles d\'oreilles': 'other',
    'pendentifs': 'other',
    'parures': 'other',
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
    category: categoryMap[p.category] || 'other',
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

// Helper function to translate a product
const translateProduct = (product: Product, language: string): Product => {
  if (language === 'fr') {
    return product;
  }

  // Priority 1: Check for dynamic translations stored in the product (from admin)
  if (product.translations && product.translations[language as keyof typeof product.translations]) {
    const dynamicTranslation = product.translations[language as keyof typeof product.translations];
    if (dynamicTranslation) {
      return {
        ...product,
        name: dynamicTranslation.name || product.name,
        description: dynamicTranslation.description || product.description,
      };
    }
  }

  // Priority 2: Fall back to static translations
  const staticTranslation = productTranslations[product.slug];
  if (staticTranslation) {
    const name = staticTranslation.name[language] || staticTranslation.name['fr'] || product.name;
    const description = staticTranslation.description[language] || staticTranslation.description['fr'] || product.description;
    return { ...product, name, description };
  }

  return product;
};

// Fetch all products from Supabase
const fetchProductsFromSupabase = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching products from Supabase:', error);
    throw error;
  }

  return (data || []).map(convertSupabaseProduct);
};

// Fetch products by category from Supabase
const fetchProductsByCategoryFromSupabase = async (category: string): Promise<Product[]> => {
  // Map app category to possible database categories
  const categoryVariants: Record<string, string[]> = {
    'pearls': ['pearls', 'perles'],
    'bracelets': ['bracelets', 'Bracelets'],
    'necklaces': ['necklaces', 'colliers'],
    'rings': ['rings', 'bagues'],
    'other': ['earrings', 'Boucles d\'oreilles', 'pendentifs', 'parures'],
  };

  const categoriesToMatch = categoryVariants[category] || [category];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .in('category', categoriesToMatch)
    .order('name');

  if (error) {
    console.error('Error fetching products by category from Supabase:', error);
    throw error;
  }

  return (data || []).map(convertSupabaseProduct);
};

// Fetch single product by slug from Supabase
const fetchProductBySlugFromSupabase = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

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
      const products = await fetchProductsFromSupabase();
      return products.map(p => translateProduct(p, language));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: string) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'category', category, language],
    queryFn: async (): Promise<Product[]> => {
      const products = await fetchProductsByCategoryFromSupabase(category);
      return products.map(p => translateProduct(p, language));
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch single product by slug with translations
export const useTranslatedProductBySlug = (slug: string) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'slug', slug, language],
    queryFn: async (): Promise<Product | null> => {
      const product = await fetchProductBySlugFromSupabase(slug);
      return product ? translateProduct(product, language) : null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch featured products with translations
export const useTranslatedFeaturedProducts = (limit = 4) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'featured', limit, language],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .or('badge.eq.new,badge.eq.bestseller')
        .limit(limit);

      if (error) {
        console.error('Error fetching featured products:', error);
        throw error;
      }

      const products = (data || []).map(convertSupabaseProduct);
      return products.map(p => translateProduct(p, language));
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'new', language],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('badge', 'new')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching new arrivals:', error);
        throw error;
      }

      const products = (data || []).map(convertSupabaseProduct);
      return products.map(p => translateProduct(p, language));
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'bestseller', language],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('badge', 'bestseller')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching bestsellers:', error);
        throw error;
      }

      const products = (data || []).map(convertSupabaseProduct);
      return products.map(p => translateProduct(p, language));
    },
    staleTime: 1000 * 60 * 5,
  });
};
