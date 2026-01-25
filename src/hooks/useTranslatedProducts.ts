// src/hooks/useTranslatedProducts.ts
// Version localStorage - utilise les données stockées localement

import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { productTranslations } from '@/data/productTranslations';
import {
  getProducts,
  getProductBySlug as getProductBySlugFromStorage,
  getProductsByCategory as getProductsByCategoryFromStorage,
  Product as LocalProduct,
} from '@/lib/localStorage';

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

// Convert localStorage product to app product format
const convertProduct = (p: LocalProduct): Product => ({
  ...p,
  inStock: p.in_stock, // Add alias
  translations: p.translations, // Pass through translations
});

// Helper function to translate a product
const translateProduct = (product: Product, language: string): Product => {
  if (language === 'fr') {
    return product;
  }

  // Priority 1: Check for dynamic translations stored in the product (from admin)
  const localProduct = product as LocalProduct;
  if (localProduct.translations && localProduct.translations[language as keyof typeof localProduct.translations]) {
    const dynamicTranslation = localProduct.translations[language as keyof typeof localProduct.translations];
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

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', language],
    queryFn: async (): Promise<Product[]> => {
      const products = getProducts();
      return products.map(p => translateProduct(convertProduct(p), language));
    },
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: string) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'category', category, language],
    queryFn: async (): Promise<Product[]> => {
      const filtered = getProductsByCategoryFromStorage(category);
      return filtered.map(p => translateProduct(convertProduct(p), language));
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
      const product = getProductBySlugFromStorage(slug);
      return product ? translateProduct(convertProduct(product), language) : null;
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
      const products = getProducts();
      const featured = products.filter(p => p.badge === 'new' || p.badge === 'bestseller');
      return featured.slice(0, limit).map(p => translateProduct(convertProduct(p), language));
    },
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'new', language],
    queryFn: async (): Promise<Product[]> => {
      const products = getProducts();
      const newProducts = products.filter(p => p.badge === 'new');
      return newProducts.map(p => translateProduct(convertProduct(p), language));
    },
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'bestseller', language],
    queryFn: async (): Promise<Product[]> => {
      const products = getProducts();
      const bestsellers = products.filter(p => p.badge === 'bestseller');
      return bestsellers.map(p => translateProduct(convertProduct(p), language));
    },
  });
};
