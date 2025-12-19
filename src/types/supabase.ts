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
          images?: string[];
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
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'moderator' | 'user';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'admin' | 'moderator' | 'user';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'moderator' | 'user';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: 'admin' | 'moderator' | 'user' };
        Returns: boolean;
      };
    };
    Enums: {
      product_category: ProductCategory;
      product_badge: ProductBadge;
      app_role: 'admin' | 'moderator' | 'user';
    };
  };
}

// Type helper for the products table
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Order types
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: ShippingAddress;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}
