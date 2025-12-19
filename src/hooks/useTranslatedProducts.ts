import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import type { Product, ProductCategory } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const fetchTranslatedProducts = async (params: {
  language: string;
  category?: string;
  slug?: string;
  featured?: boolean;
  badge?: string;
  limit?: number;
}): Promise<Product[] | Product | null> => {
  const searchParams = new URLSearchParams();
  searchParams.set('lang', params.language);
  
  if (params.category) searchParams.set('category', params.category);
  if (params.slug) searchParams.set('slug', params.slug);
  if (params.featured) searchParams.set('featured', 'true');
  if (params.badge) searchParams.set('badge', params.badge);
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const { data, error } = await supabase.functions.invoke('get-translated-products', {
    body: null,
    headers: {},
  });

  // Use fetch directly since we need query params
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-translated-products?${searchParams.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch translated products');
  }

  return response.json();
};

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', language],
    queryFn: async (): Promise<Product[]> => {
      const data = await fetchTranslatedProducts({ language });
      return data as Product[];
    },
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: ProductCategory) => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'category', category, language],
    queryFn: async (): Promise<Product[]> => {
      const data = await fetchTranslatedProducts({ language, category });
      return data as Product[];
    },
    enabled: !!category,
  });
};

// Fetch single product by slug with translations
export const useTranslatedProductBySlug = (slug: string) => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'slug', slug, language],
    queryFn: async (): Promise<Product | null> => {
      const data = await fetchTranslatedProducts({ language, slug });
      return data as Product | null;
    },
    enabled: !!slug,
  });
};

// Fetch featured products with translations
export const useTranslatedFeaturedProducts = (limit = 4) => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'featured', limit, language],
    queryFn: async (): Promise<Product[]> => {
      const data = await fetchTranslatedProducts({ language, featured: true, limit });
      return data as Product[];
    },
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'new', language],
    queryFn: async (): Promise<Product[]> => {
      const data = await fetchTranslatedProducts({ language, badge: 'new' });
      return data as Product[];
    },
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'bestseller', language],
    queryFn: async (): Promise<Product[]> => {
      const data = await fetchTranslatedProducts({ language, badge: 'bestseller' });
      return data as Product[];
    },
  });
};