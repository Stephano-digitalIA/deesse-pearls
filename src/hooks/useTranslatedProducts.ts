import { useQuery } from '@tanstack/react-query';
import { supabaseTyped } from '@/lib/supabaseTyped';
import { useLocale } from '@/contexts/LocaleContext';
import { productTranslations } from '@/data/productTranslations';
import type { Product, ProductCategory } from '@/types/supabase';

// Helper function to translate a product using static translations with FR fallback
const translateProduct = (product: Product, language: string): Product => {
  // Si FR ou pas de traduction disponible, retourner le produit original
  if (language === 'fr') {
    return product;
  }

  const translation = productTranslations[product.slug];
  
  if (!translation) {
    // Pas de traduction pour ce slug → garder les valeurs FR originales
    return product;
  }

  return {
    ...product,
    name: translation.name[language] || translation.name['fr'] || product.name,
    description: translation.description[language] || translation.description['fr'] || product.description,
  };
};

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', language],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabaseTyped
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return (data || []).map(p => translateProduct(p, language));
    },
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: ProductCategory) => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'category', category, language],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabaseTyped
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products by category:', error);
        throw error;
      }

      return (data || []).map(p => translateProduct(p, language));
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
      const { data, error } = await supabaseTyped
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
        throw error;
      }

      return data ? translateProduct(data, language) : null;
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
      const { data, error } = await supabaseTyped
        .from('products')
        .select('*')
        .not('badge', 'is', null)
        .limit(limit);

      if (error) {
        console.error('Error fetching featured products:', error);
        throw error;
      }

      return (data || []).map(p => translateProduct(p, language));
    },
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'new', language],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabaseTyped
        .from('products')
        .select('*')
        .eq('badge', 'new')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching new arrivals:', error);
        throw error;
      }

      return (data || []).map(p => translateProduct(p, language));
    },
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'bestseller', language],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabaseTyped
        .from('products')
        .select('*')
        .eq('badge', 'bestseller')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching bestsellers:', error);
        throw error;
      }

      return (data || []).map(p => translateProduct(p, language));
    },
  });
};
