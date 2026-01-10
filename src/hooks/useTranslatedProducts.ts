import { useQuery } from '@tanstack/react-query';
import { supabaseTyped } from '@/lib/supabaseTyped';
import { useLocale } from '@/contexts/LocaleContext';
import { productTranslations } from '@/data/productTranslations';
import type { Product, ProductCategory } from '@/types/supabase';

interface DbTranslation {
  slug: string;
  name_translations: Record<string, string>;
  description_translations: Record<string, string>;
}

// Helper function to translate a product using fallback chain:
// 1. Static translations (productTranslations.ts)
// 2. Database translations (product_translations table)
// 3. Original French content
const translateProduct = (
  product: Product, 
  language: string, 
  dbTranslations: Map<string, DbTranslation>
): Product => {
  // Si FR, retourner le produit original
  if (language === 'fr') {
    return product;
  }

  // 1. Vérifier les traductions statiques
  const staticTranslation = productTranslations[product.slug];
  if (staticTranslation) {
    const name = staticTranslation.name[language] || staticTranslation.name['fr'] || product.name;
    const description = staticTranslation.description[language] || staticTranslation.description['fr'] || product.description;
    return { ...product, name, description };
  }

  // 2. Vérifier les traductions en base de données
  const dbTranslation = dbTranslations.get(product.slug);
  if (dbTranslation) {
    const name = dbTranslation.name_translations[language] || dbTranslation.name_translations['fr'] || product.name;
    const description = dbTranslation.description_translations[language] || dbTranslation.description_translations['fr'] || product.description;
    return { ...product, name, description };
  }

  // 3. Retourner le produit original (français)
  return product;
};

// Hook to fetch database translations
const useDbTranslations = () => {
  return useQuery({
    queryKey: ['product-translations'],
    queryFn: async (): Promise<Map<string, DbTranslation>> => {
      const { data, error } = await supabaseTyped
        .from('product_translations')
        .select('slug, name_translations, description_translations');

      if (error) {
        console.error('Error fetching translations:', error);
        return new Map();
      }

      const map = new Map<string, DbTranslation>();
      (data || []).forEach((t: DbTranslation) => {
        map.set(t.slug, t);
      });
      return map;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();
  const { data: dbTranslations = new Map() } = useDbTranslations();
  
  return useQuery({
    queryKey: ['translated-products', language, dbTranslations.size],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabaseTyped
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return (data || []).map(p => translateProduct(p, language, dbTranslations));
    },
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: ProductCategory) => {
  const { language } = useLocale();
  const { data: dbTranslations = new Map() } = useDbTranslations();
  
  return useQuery({
    queryKey: ['translated-products', 'category', category, language, dbTranslations.size],
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

      return (data || []).map(p => translateProduct(p, language, dbTranslations));
    },
    enabled: !!category,
  });
};

// Fetch single product by slug with translations
export const useTranslatedProductBySlug = (slug: string) => {
  const { language } = useLocale();
  const { data: dbTranslations = new Map() } = useDbTranslations();
  
  return useQuery({
    queryKey: ['translated-products', 'slug', slug, language, dbTranslations.size],
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

      return data ? translateProduct(data, language, dbTranslations) : null;
    },
    enabled: !!slug,
  });
};

// Fetch featured products with translations
export const useTranslatedFeaturedProducts = (limit = 4) => {
  const { language } = useLocale();
  const { data: dbTranslations = new Map() } = useDbTranslations();
  
  return useQuery({
    queryKey: ['translated-products', 'featured', limit, language, dbTranslations.size],
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

      return (data || []).map(p => translateProduct(p, language, dbTranslations));
    },
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();
  const { data: dbTranslations = new Map() } = useDbTranslations();
  
  return useQuery({
    queryKey: ['translated-products', 'new', language, dbTranslations.size],
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

      return (data || []).map(p => translateProduct(p, language, dbTranslations));
    },
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();
  const { data: dbTranslations = new Map() } = useDbTranslations();
  
  return useQuery({
    queryKey: ['translated-products', 'bestseller', language, dbTranslations.size],
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

      return (data || []).map(p => translateProduct(p, language, dbTranslations));
    },
  });
};
