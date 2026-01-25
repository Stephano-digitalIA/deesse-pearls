// src/hooks/useProducts.ts
// Hook pour gérer les produits (version localStorage sans Supabase)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { products as initialProducts, Product, ProductTranslation } from '@/data/products';

// Clé localStorage pour les produits
const PRODUCTS_STORAGE_KEY = 'deesse_products';

// Récupérer les produits depuis localStorage ou utiliser les produits initiaux
const getStoredProducts = (): Product[] => {
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialProducts;
    }
  }
  return initialProducts;
};

// Sauvegarder les produits dans localStorage
const saveProducts = (products: Product[]): void => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

// Export des types
export type { Product, ProductTranslation };

// Hook pour récupérer tous les produits
export const useProducts = () => {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async (): Promise<Product[]> => {
      return getStoredProducts();
    },
  });
};

// Hook pour récupérer un produit par ID
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['admin-product', id],
    queryFn: async (): Promise<Product | null> => {
      const products = getStoredProducts();
      return products.find(p => p.id === id) || null;
    },
    enabled: !!id,
  });
};

// Hook pour créer un produit
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id'>): Promise<Product> => {
      const products = getStoredProducts();
      const product: Product = {
        ...newProduct,
        id: `${Date.now()}`,
      };
      products.push(product);
      saveProducts(products);
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['translated-products'] });
    },
  });
};

// Hook pour mettre à jour un produit
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }): Promise<Product | null> => {
      const products = getStoredProducts();
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return null;

      products[index] = { ...products[index], ...updates };
      saveProducts(products);
      return products[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['translated-products'] });
    },
  });
};

// Hook pour supprimer un produit
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const products = getStoredProducts();
      const filtered = products.filter(p => p.id !== id);
      if (filtered.length === products.length) return false;

      saveProducts(filtered);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['translated-products'] });
    },
  });
};
