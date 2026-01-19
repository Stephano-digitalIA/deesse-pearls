import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductCategory } from '@/types/supabase';

// Fetch all products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return data || [];
    },
  });
};

// Fetch products by category
export const useProductsByCategory = (category: ProductCategory) => {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products by category:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!category,
  });
};

// Fetch single product by slug
export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['products', 'slug', slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
        throw error;
      }

      return data;
    },
    enabled: !!slug,
  });
};

// Fetch featured products (new or bestseller)
export const useFeaturedProducts = (limit = 4) => {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('badge', 'is', null)
        .limit(limit);

      if (error) {
        console.error('Error fetching featured products:', error);
        throw error;
      }

      return data || [];
    },
  });
};

// Fetch new arrivals
export const useNewArrivals = () => {
  return useQuery({
    queryKey: ['products', 'new'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('badge', 'new')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching new arrivals:', error);
        throw error;
      }

      return data || [];
    },
  });
};

// Fetch bestsellers
export const useBestSellers = () => {
  return useQuery({
    queryKey: ['products', 'bestseller'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('badge', 'bestseller')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching bestsellers:', error);
        throw error;
      }

      return data || [];
    },
  });
};

// Search products
export const useSearchProducts = (searchTerm: string) => {
  return useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error searching products:', error);
        throw error;
      }

      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });
};
