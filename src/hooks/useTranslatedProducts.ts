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
  const dbTranslation = dbTranslationsMap.get(product.slug);
  if (dbTranslation) {
    const name = dbTranslation.name_translations[language] || dbTranslation.name_translations['fr'] || product.name;
    const description = dbTranslation.description_translations[language] || dbTranslation.description_translations['fr'] || product.description;
    return { ...product, name, description };
  }

  // 3. Retourner le produit original (français)
  return product;
};

// Fetch database translations (standalone function, not a hook)
const fetchDbTranslations = async (): Promise<Map<string, DbTranslation>> => {
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
};

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();
  
  return useQuery({
    queryKey: ['translated-products', language],
    queryFn: async (): Promise<Product[]> => {
      const [productsResult, dbTranslationsMap] = await Promise.all([
        supabaseTyped
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        fetchDbTranslations()
      ]);

      if (productsResult.error) {
        console.error('Error fetching products:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(p => translateProduct(p, language, dbTranslationsMap));
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
        supabaseTyped
          .from('products')
          .select('*')
          .eq('category', category)
          .order('created_at', { ascending: false }),
        fetchDbTranslations()
      ]);

      if (productsResult.error) {
        console.error('Error fetching products by category:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(p => translateProduct(p, language, dbTranslationsMap));
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
        supabaseTyped
          .from('products')
          .select('*')
          .eq('slug', slug)
          .maybeSingle(),
        fetchDbTranslations()
      ]);

      if (productResult.error) {
        console.error('Error fetching product:', productResult.error);
        throw productResult.error;
      }

      return productResult.data ? translateProduct(productResult.data, language, dbTranslationsMap) : null;
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
        supabaseTyped
          .from('products')
          .select('*')
          .not('badge', 'is', null)
          .limit(limit),
        fetchDbTranslations()
      ]);

      if (productsResult.error) {
        console.error('Error fetching featured products:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(p => translateProduct(p, language, dbTranslationsMap));
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
        supabaseTyped
          .from('products')
          .select('*')
          .eq('badge', 'new')
          .order('created_at', { ascending: false }),
        fetchDbTranslations()
      ]);

      if (productsResult.error) {
        console.error('Error fetching new arrivals:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(p => translateProduct(p, language, dbTranslationsMap));
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
        supabaseTyped
          .from('products')
          .select('*')
          .eq('badge', 'bestseller')
          .order('rating', { ascending: false }),
        fetchDbTranslations()
      ]);

      if (productsResult.error) {
        console.error('Error fetching bestsellers:', productsResult.error);
        throw productsResult.error;
      }

      return (productsResult.data || []).map(p => translateProduct(p, language, dbTranslationsMap));
    },
  });
};
