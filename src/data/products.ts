export interface Product {
  id: string;
  slug: string;
  category: 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'other';
  name: string;
  description: string;
  price: number;
  images: string[];
  badge?: 'new' | 'bestseller';
  rating: number;
  reviews: number;
  variants?: {
    sizes?: string[];
    qualities?: string[];
    diameters?: string[];
  };
  inStock: boolean;
}

export const products: Product[] = [
  {
    id: '1',
    slug: 'perle-tahiti-ronde-aaa',
    category: 'pearls',
    name: 'Perle de Tahiti Ronde AAA',
    description: 'Magnifique perle de Tahiti parfaitement ronde, qualité AAA. Lustre exceptionnel avec des reflets verts et roses caractéristiques.',
    price: 350,
    images: ['/placeholder.svg'],
    badge: 'bestseller',
    rating: 4.9,
    reviews: 127,
    variants: {
      qualities: ['AA', 'AAA', 'AAAA'],
      diameters: ['8mm', '9mm', '10mm', '11mm', '12mm', '13mm'],
    },
    inStock: true,
  },
  {
    id: '2',
    slug: 'bracelet-or-perles-tahiti',
    category: 'bracelets',
    name: 'Bracelet Or & Perles de Tahiti',
    description: 'Bracelet élégant en or 18 carats orné de perles de Tahiti sélectionnées. Fermoir sécurisé.',
    price: 1250,
    images: ['/placeholder.svg'],
    badge: 'new',
    rating: 4.8,
    reviews: 45,
    variants: {
      sizes: ['16cm', '17cm', '18cm', '19cm', '20cm'],
    },
    inStock: true,
  },
  {
    id: '3',
    slug: 'collier-perles-tahiti-or',
    category: 'necklaces',
    name: 'Collier Perles de Tahiti & Or',
    description: 'Somptueux collier composé de perles de Tahiti parfaitement assorties, monté sur or 18 carats.',
    price: 2850,
    images: ['/placeholder.svg'],
    rating: 5.0,
    reviews: 89,
    variants: {
      sizes: ['42cm', '45cm', '50cm', '55cm'],
    },
    inStock: true,
  },
  {
    id: '4',
    slug: 'bague-perle-tahiti-diamants',
    category: 'rings',
    name: 'Bague Perle de Tahiti & Diamants',
    description: 'Bague sophistiquée en or blanc 18 carats, perle de Tahiti entourée de diamants.',
    price: 1890,
    images: ['/placeholder.svg'],
    badge: 'bestseller',
    rating: 4.9,
    reviews: 156,
    variants: {
      sizes: ['48', '50', '52', '54', '56', '58', '60'],
    },
    inStock: true,
  },
  {
    id: '5',
    slug: 'pendentif-perle-tahiti',
    category: 'other',
    name: 'Pendentif Perle de Tahiti',
    description: 'Pendentif délicat en or jaune 18 carats avec une perle de Tahiti drop de qualité exceptionnelle.',
    price: 680,
    images: ['/placeholder.svg'],
    badge: 'new',
    rating: 4.7,
    reviews: 34,
    variants: {
      qualities: ['AA', 'AAA'],
    },
    inStock: true,
  },
  {
    id: '6',
    slug: 'perle-tahiti-baroque',
    category: 'pearls',
    name: 'Perle de Tahiti Baroque',
    description: 'Perle de Tahiti baroque aux formes uniques et reflets multicolores. Chaque pièce est unique.',
    price: 220,
    images: ['/placeholder.svg'],
    rating: 4.6,
    reviews: 78,
    variants: {
      qualities: ['A', 'AA', 'AAA'],
      diameters: ['10mm', '12mm', '14mm', '16mm'],
    },
    inStock: true,
  },
  {
    id: '7',
    slug: 'bracelet-multi-perles',
    category: 'bracelets',
    name: 'Bracelet Multi-Perles de Tahiti',
    description: 'Bracelet spectaculaire composé de multiples perles de Tahiti aux nuances variées.',
    price: 1680,
    images: ['/placeholder.svg'],
    rating: 4.8,
    reviews: 62,
    variants: {
      sizes: ['16cm', '17cm', '18cm', '19cm'],
    },
    inStock: true,
  },
  {
    id: '8',
    slug: 'sautoir-perles-tahiti',
    category: 'necklaces',
    name: 'Sautoir Perles de Tahiti',
    description: 'Long sautoir élégant composé de perles de Tahiti graduées. Pièce statement pour les grandes occasions.',
    price: 4200,
    images: ['/placeholder.svg'],
    badge: 'bestseller',
    rating: 5.0,
    reviews: 41,
    variants: {
      sizes: ['80cm', '90cm', '100cm'],
    },
    inStock: true,
  },
];

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter((p) => p.category === category);
};

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find((p) => p.slug === slug);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((p) => p.badge === 'bestseller' || p.badge === 'new').slice(0, 4);
};

export const getNewArrivals = (): Product[] => {
  return products.filter((p) => p.badge === 'new');
};

export const getBestSellers = (): Product[] => {
  return products.filter((p) => p.badge === 'bestseller');
};
