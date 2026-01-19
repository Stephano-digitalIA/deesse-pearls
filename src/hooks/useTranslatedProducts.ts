import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { productTranslations } from '@/data/productTranslations';
import type { Product, ProductCategory, Json } from '@/types/supabase';
import type { Tables } from '@/integrations/supabase/types';

interface DbTranslation {
  product_id: string;
  locale: string;
  name: string;
  description: string;
}

// Helper to transform Supabase product row to our Product type
const transformProduct = (row: Tables<'products'>): Product => ({
  ...row,
  badge: row.badge as Product['badge'],
  category: row.category as ProductCategory,
  variants: row.variants,
});

// Helper function to translate a product using fallback chain:
// 1. Static translations (productTranslations.ts)
// 2. Database translations (product_translations table)
// 3. Original French content
const translateProduct = (
  product: Product, 
  language: string, 
  dbTranslationsMap: Map<string, DbTranslation>
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
  const key = `${product.id}-${language}`;
  const dbTranslation = dbTranslationsMap.get(key);
  if (dbTranslation) {
    return { ...product, name: dbTranslation.name, description: dbTranslation.description };
  }

  // 3. Retourner le produit original (français)
  return product;
};

// Fetch database translations (standalone function, not a hook)
const fetchDbTranslations = async (language: string): Promise<Map<string, DbTranslation>> => {
  const { data, error } = await supabase
    .from('product_translations')
    .select('product_id, locale, name, description')
    .eq('locale', language);

  if (error) {
    console.error('Error fetching translations:', error);
    return new Map();
  }

  const map = new Map<string, DbTranslation>();
  (data || []).forEach((t) => {
    map.set(`${t.product_id}-${t.locale}`, t);
  });
  return map;
};

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, dbTranslationsMap] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        fetchDbTranslations(language)
      ]);

      if (productsResult.error) {
        console.error('Error fetching products:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(row => 
        translateProduct(transformProduct(row), language, dbTranslationsMap)
      );
    },
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: ProductCategory) => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'category', category, language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, dbTranslationsMap] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('category', category)
          .order('created_at', { ascending: false }),
        fetchDbTranslations(language)
      ]);

      if (productsResult.error) {
        console.error('Error fetching products by category:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(row => 
        translateProduct(transformProduct(row), language, dbTranslationsMap)
      );
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
      const [productResult, dbTranslationsMap] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .maybeSingle(),
        fetchDbTranslations(language)
      ]);

      if (productResult.error) {
        console.error('Error fetching product:', productResult.error);
        throw productResult.error;
      }

      return productResult.data 
        ? translateProduct(transformProduct(productResult.data), language, dbTranslationsMap) 
        : null;
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
      const [productsResult, dbTranslationsMap] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .not('badge', 'is', null)
          .limit(limit),
        fetchDbTranslations(language)
      ]);

      if (productsResult.error) {
        console.error('Error fetching featured products:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(row => 
        translateProduct(transformProduct(row), language, dbTranslationsMap)
      );
    },
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'new', language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, dbTranslationsMap] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('badge', 'new')
          .order('created_at', { ascending: false }),
        fetchDbTranslations(language)
      ]);

      if (productsResult.error) {
        console.error('Error fetching new arrivals:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(row => 
        translateProduct(transformProduct(row), language, dbTranslationsMap)
      );
    },
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', 'bestseller', language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, dbTranslationsMap] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('badge', 'bestseller')
          .order('rating', { ascending: false }),
        fetchDbTranslations(language)
      ]);

      if (productsResult.error) {
        console.error('Error fetching bestsellers:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(row => 
        translateProduct(transformProduct(row), language, dbTranslationsMap)
      );
    },
  });
};
