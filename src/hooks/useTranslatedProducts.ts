import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { products, Product as StaticProduct } from '@/data/products';
import { productTranslations, getProductTranslation } from '@/data/productTranslations';
import type { Product, ProductCategory } from '@/types/supabase';

// Convertit un produit statique en format Product compatible avec le reste de l'app
const convertToProduct = (p: StaticProduct, language: string): Product => {
  const translatedName = getProductTranslation(p.slug, 'name', language) || p.name;
  const translatedDescription = getProductTranslation(p.slug, 'description', language) || p.description;

  return {
    id: p.id,
    slug: p.slug,
    category: p.category,
    name: translatedName,
    description: translatedDescription,
    price: p.price,
    images: p.images,
    badge: p.badge || null,
    rating: p.rating,
    reviews: p.reviews,
    variants: p.variants || null,
    in_stock: p.inStock,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

// Fetch all products with translations
export const useTranslatedProducts = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', language],
    queryFn: async (): Promise<Product[]> => {
      return products.map((p) => convertToProduct(p, language));
    },
  });
};

// Fetch products by category with translations
export const useTranslatedProductsByCategory = (category: ProductCategory) => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'category', category, language],
    queryFn: async (): Promise<Product[]> => {
      return products
        .filter((p) => p.category === category)
        .map((p) => convertToProduct(p, language));
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
      const product = products.find((p) => p.slug === slug);
      if (!product) return null;
      return convertToProduct(product, language);
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
      return products
        .filter((p) => p.badge === 'new' || p.badge === 'bestseller')
        .slice(0, limit)
        .map((p) => convertToProduct(p, language));
    },
  });
};

// Fetch new arrivals with translations
export const useTranslatedNewArrivals = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'new', language],
    queryFn: async (): Promise<Product[]> => {
      return products
        .filter((p) => p.badge === 'new')
        .map((p) => convertToProduct(p, language));
    },
  });
};

// Fetch bestsellers with translations
export const useTranslatedBestSellers = () => {
  const { language } = useLocale();

  return useQuery({
    queryKey: ['translated-products', 'bestseller', language],
    queryFn: async (): Promise<Product[]> => {
      return products
        .filter((p) => p.badge === 'bestseller')
        .map((p) => convertToProduct(p, language));
    },
  });
};
