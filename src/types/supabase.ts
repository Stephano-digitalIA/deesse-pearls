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

// Product type matching Supabase schema
export interface Product {
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
  variants: ProductVariants | Json | null;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Partial<Product> & {
  slug: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
};

export type ProductUpdate = Partial<Product>;

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
  user_id: string | null;
  total: number;
  shipping_address: Json | null;
  billing_address: Json | null;
  created_at: string;
  updated_at: string;
  status: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  customer_email: string | null;
  customer_name: string | null;
  notes: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  variant: Json | null;
  created_at: string;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

// Review type matching Supabase schema
export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  products?: { name: string; slug?: string } | null;
}

// Customization request matching Supabase schema
export interface CustomizationRequest {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  request_type: string;
  description: string;
  budget_range: string | null;
  images: string[] | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Access log matching Supabase schema
export interface AccessLog {
  id: string;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: string;
}

// Access block matching Supabase schema
export interface AccessBlock {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_at: string;
  expires_at: string | null;
}

// User profile matching Supabase schema
export interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: Json | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}
