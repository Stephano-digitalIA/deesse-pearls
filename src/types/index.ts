// Types pour les produits
export interface ProductTranslation {
  name: string;
  description: string;
}

export interface ProductVariants {
  sizes?: string[];
  qualities?: string[];
  diameters?: string[];
}

export interface Product {
  id: number;  // integer dans Supabase
  slug: string;
  category: 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'earrings' | 'pendants' | 'sets' | 'other';
  name: string;
  description: string;
  price: number;
  image: string[];  // 'image' dans Supabase (pas 'images')
  badge?: 'new' | 'bestseller' | null;
  rating: number;
  reviews: number;
  variants?: ProductVariants | null;
  in_stock: boolean;
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
  created_at?: string;
  updated_at?: string;
}

export type ProductCategory = 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'earrings' | 'pendants' | 'sets' | 'other';
export type ProductBadge = 'new' | 'bestseller';

export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProductInput = Partial<CreateProductInput>;

// Types pour les langues
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Types pour les catégories
export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'pearls', label: 'Perles seules' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'necklaces', label: 'Colliers' },
  { value: 'rings', label: 'Bagues' },
  { value: 'earrings', label: 'Boucles d\'oreilles' },
  { value: 'pendants', label: 'Pendentifs' },
  { value: 'sets', label: 'Parures' },
  { value: 'other', label: 'Autres Bijoux' },
];

export const PRODUCT_BADGES: { value: ProductBadge | 'none'; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'new', label: 'Nouveau' },
  { value: 'bestseller', label: 'Bestseller' },
];

// Types pour l'utilisateur
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
}
