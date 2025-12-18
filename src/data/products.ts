import pearlRoundAAA from '@/assets/pearl-round-aaa.jpg';
import pearlBaroque from '@/assets/pearl-baroque.jpg';
import pearlSet from '@/assets/pearl-set.jpg';
import braceletGoldPearls from '@/assets/bracelet-gold-pearls.jpg';
import braceletMultiPearls from '@/assets/bracelet-multi-pearls.jpg';
import necklacePearlsGold from '@/assets/necklace-pearls-gold.jpg';
import necklaceSautoir from '@/assets/necklace-sautoir.jpg';
import necklaceChoker from '@/assets/necklace-choker.jpg';
import ringPearlDiamonds from '@/assets/ring-pearl-diamonds.jpg';
import ringSimplePearl from '@/assets/ring-simple-pearl.jpg';
import pendantPearl from '@/assets/pendant-pearl.jpg';
import earringsPearlDrop from '@/assets/earrings-pearl-drop.jpg';

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
  // PEARLS
  {
    id: '1',
    slug: 'perle-tahiti-ronde-aaa',
    category: 'pearls',
    name: 'Perle de Tahiti Ronde AAA',
    description: 'Magnifique perle de Tahiti parfaitement ronde, qualité AAA. Lustre exceptionnel avec des reflets verts et roses caractéristiques.',
    price: 350,
    images: [pearlRoundAAA],
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
    id: '6',
    slug: 'perle-tahiti-baroque',
    category: 'pearls',
    name: 'Perle de Tahiti Baroque',
    description: 'Perle de Tahiti baroque aux formes uniques et reflets multicolores. Chaque pièce est unique.',
    price: 220,
    images: [pearlBaroque],
    rating: 4.6,
    reviews: 78,
    variants: {
      qualities: ['A', 'AA', 'AAA'],
      diameters: ['10mm', '12mm', '14mm', '16mm'],
    },
    inStock: true,
  },
  {
    id: '9',
    slug: 'lot-perles-tahiti-assorties',
    category: 'pearls',
    name: 'Lot de Perles de Tahiti Assorties',
    description: 'Ensemble de 3 perles de Tahiti aux nuances variées. Idéal pour créations personnalisées.',
    price: 590,
    images: [pearlSet],
    badge: 'new',
    rating: 4.8,
    reviews: 34,
    variants: {
      qualities: ['AA', 'AAA'],
      diameters: ['9mm', '10mm', '11mm'],
    },
    inStock: true,
  },
  {
    id: '10',
    slug: 'perle-tahiti-drop-premium',
    category: 'pearls',
    name: 'Perle de Tahiti Drop Premium',
    description: 'Perle de Tahiti en forme de goutte, qualité premium. Surface parfaite avec reflets intenses.',
    price: 420,
    images: [pearlRoundAAA],
    rating: 4.9,
    reviews: 56,
    variants: {
      qualities: ['AAA', 'AAAA'],
      diameters: ['10mm', '11mm', '12mm', '13mm'],
    },
    inStock: true,
  },
  // BRACELETS
  {
    id: '2',
    slug: 'bracelet-or-perles-tahiti',
    category: 'bracelets',
    name: 'Bracelet Or & Perles de Tahiti',
    description: 'Bracelet élégant en or 18 carats orné de perles de Tahiti sélectionnées. Fermoir sécurisé.',
    price: 1250,
    images: [braceletGoldPearls],
    badge: 'new',
    rating: 4.8,
    reviews: 45,
    variants: {
      sizes: ['16cm', '17cm', '18cm', '19cm', '20cm'],
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
    images: [braceletMultiPearls],
    rating: 4.8,
    reviews: 62,
    variants: {
      sizes: ['16cm', '17cm', '18cm', '19cm'],
    },
    inStock: true,
  },
  {
    id: '11',
    slug: 'bracelet-perle-unique',
    category: 'bracelets',
    name: 'Bracelet Perle Unique Or',
    description: 'Bracelet fin en or 18 carats avec une perle de Tahiti centrale. Design minimaliste et raffiné.',
    price: 890,
    images: [braceletGoldPearls],
    badge: 'bestseller',
    rating: 4.9,
    reviews: 89,
    variants: {
      sizes: ['16cm', '17cm', '18cm', '19cm'],
    },
    inStock: true,
  },
  {
    id: '12',
    slug: 'bracelet-jonc-perle',
    category: 'bracelets',
    name: 'Bracelet Jonc Perle de Tahiti',
    description: 'Jonc rigide en or avec perle de Tahiti. Élégance intemporelle pour toutes occasions.',
    price: 1450,
    images: [braceletMultiPearls],
    rating: 4.7,
    reviews: 38,
    variants: {
      sizes: ['S', 'M', 'L'],
    },
    inStock: true,
  },
  // NECKLACES
  {
    id: '3',
    slug: 'collier-perles-tahiti-or',
    category: 'necklaces',
    name: 'Collier Perles de Tahiti & Or',
    description: 'Somptueux collier composé de perles de Tahiti parfaitement assorties, monté sur or 18 carats.',
    price: 2850,
    images: [necklacePearlsGold],
    rating: 5.0,
    reviews: 89,
    variants: {
      sizes: ['42cm', '45cm', '50cm', '55cm'],
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
    images: [necklaceSautoir],
    badge: 'bestseller',
    rating: 5.0,
    reviews: 41,
    variants: {
      sizes: ['80cm', '90cm', '100cm'],
    },
    inStock: true,
  },
  {
    id: '13',
    slug: 'ras-de-cou-perles-tahiti',
    category: 'necklaces',
    name: 'Ras de Cou Perles de Tahiti',
    description: 'Collier ras de cou moderne avec perles de Tahiti uniformes. Fermeture or 18 carats.',
    price: 1890,
    images: [necklaceChoker],
    badge: 'new',
    rating: 4.8,
    reviews: 27,
    variants: {
      sizes: ['38cm', '40cm', '42cm'],
    },
    inStock: true,
  },
  {
    id: '14',
    slug: 'collier-pendentif-perle',
    category: 'necklaces',
    name: 'Collier Chaîne & Pendentif Perle',
    description: 'Fine chaîne en or avec pendentif perle de Tahiti. Simplicité élégante au quotidien.',
    price: 780,
    images: [pendantPearl],
    rating: 4.9,
    reviews: 112,
    variants: {
      sizes: ['42cm', '45cm', '50cm'],
    },
    inStock: true,
  },
  // RINGS
  {
    id: '4',
    slug: 'bague-perle-tahiti-diamants',
    category: 'rings',
    name: 'Bague Perle de Tahiti & Diamants',
    description: 'Bague sophistiquée en or blanc 18 carats, perle de Tahiti entourée de diamants.',
    price: 1890,
    images: [ringPearlDiamonds],
    badge: 'bestseller',
    rating: 4.9,
    reviews: 156,
    variants: {
      sizes: ['48', '50', '52', '54', '56', '58', '60'],
    },
    inStock: true,
  },
  {
    id: '15',
    slug: 'bague-solitaire-perle',
    category: 'rings',
    name: 'Bague Solitaire Perle de Tahiti',
    description: 'Bague solitaire classique en or jaune 18 carats avec perle de Tahiti. Design épuré.',
    price: 980,
    images: [ringSimplePearl],
    rating: 4.8,
    reviews: 73,
    variants: {
      sizes: ['48', '50', '52', '54', '56', '58'],
    },
    inStock: true,
  },
  {
    id: '16',
    slug: 'bague-cocktail-perle',
    category: 'rings',
    name: 'Bague Cocktail Perle & Or Rose',
    description: 'Bague statement en or rose avec grande perle de Tahiti. Design contemporain audacieux.',
    price: 2350,
    images: [ringPearlDiamonds],
    badge: 'new',
    rating: 4.7,
    reviews: 29,
    variants: {
      sizes: ['50', '52', '54', '56', '58'],
    },
    inStock: true,
  },
  // OTHER JEWELRY
  {
    id: '5',
    slug: 'pendentif-perle-tahiti',
    category: 'other',
    name: 'Pendentif Perle de Tahiti',
    description: 'Pendentif délicat en or jaune 18 carats avec une perle de Tahiti drop de qualité exceptionnelle.',
    price: 680,
    images: [pendantPearl],
    badge: 'new',
    rating: 4.7,
    reviews: 34,
    variants: {
      qualities: ['AA', 'AAA'],
    },
    inStock: true,
  },
  {
    id: '17',
    slug: 'boucles-oreilles-perles-tahiti',
    category: 'other',
    name: 'Boucles d\'Oreilles Perles de Tahiti',
    description: 'Élégantes boucles d\'oreilles pendantes en or 18 carats avec perles de Tahiti assorties.',
    price: 1250,
    images: [earringsPearlDrop],
    badge: 'bestseller',
    rating: 4.9,
    reviews: 98,
    variants: {
      qualities: ['AA', 'AAA'],
    },
    inStock: true,
  },
  {
    id: '18',
    slug: 'parure-perles-tahiti',
    category: 'other',
    name: 'Parure Complète Perles de Tahiti',
    description: 'Parure comprenant collier, bracelet et boucles d\'oreilles assortis. Coffret luxe inclus.',
    price: 5890,
    images: [necklacePearlsGold],
    rating: 5.0,
    reviews: 23,
    variants: {
      sizes: ['42cm collier', '45cm collier', '50cm collier'],
    },
    inStock: true,
  },
  {
    id: '19',
    slug: 'broche-perle-tahiti',
    category: 'other',
    name: 'Broche Perle de Tahiti & Diamants',
    description: 'Broche raffinée en or blanc avec perle de Tahiti centrale et diamants. Pièce de collection.',
    price: 2680,
    images: [ringPearlDiamonds],
    rating: 4.8,
    reviews: 15,
    variants: {
      qualities: ['AAA', 'AAAA'],
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
