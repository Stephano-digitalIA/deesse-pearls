export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductCategory = 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'other';
export type ProductBadge = 'new' | 'bestseller' | null;

export interface ProductVariants {
  sizes?: string[];
  qualities?: string[];
  diameters?: string[];
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          category: ProductCategory;
          name: string;
          description: string;
          price: number;
          images: string[];
          badge: ProductBadge;
          rating: number;
          reviews: number;
          variants: ProductVariants | null;
          in_stock: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          category: ProductCategory;
          name: string;
          description: string;
          price: number;
          images: string[];
          badge?: ProductBadge;
          rating?: number;
          reviews?: number;
          variants?: ProductVariants | null;
          in_stock?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          category?: ProductCategory;
          name?: string;
          description?: string;
          price?: number;
          images?: string[];
          badge?: ProductBadge;
          rating?: number;
          reviews?: number;
          variants?: ProductVariants | null;
          in_stock?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      product_category: ProductCategory;
      product_badge: ProductBadge;
    };
  };
}

// Type helper for the products table
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
