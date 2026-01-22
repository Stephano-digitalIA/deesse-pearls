import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types/supabase';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePrefetchProduct } from '@/hooks/useTranslatedProducts';
import { Button } from '@/components/ui/button';
import { getProductTranslation } from '@/data/productTranslations';
import { resolveImagePath } from '@/lib/utils';
interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t, formatPrice, language } = useLocale();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const prefetchProduct = usePrefetchProduct();

  const productName = getProductTranslation(product.slug, 'name', language) || product.name;

  // Prefetch product data on hover for instant navigation
  const handleMouseEnter = () => {
    prefetchProduct(product.slug);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: productName,
      price: product.price,
      image: product.image,
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group"
      onMouseEnter={handleMouseEnter}
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-3 sm:mb-4">
          <img
            src={resolveImagePath(product.image)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.badge && (
            <span
              className={`absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase rounded-full ${
                product.badge === 'new'
                  ? 'bg-lagoon text-accent-foreground'
                  : 'bg-gold text-deep-black'
              }`}
            >
              {product.badge === 'new' ? t('newArrivals') : t('bestSellers')}
            </span>
          )}
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full transition-all duration-300 ${
              isFavorite(product.id) 
                ? 'bg-gold text-deep-black' 
                : 'bg-background/80 text-foreground hover:bg-gold hover:text-deep-black'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
          </button>
          <div className="absolute inset-0 bg-deep-black/0 group-hover:bg-deep-black/20 transition-colors duration-300" />
          {/* Mobile: always visible, Desktop: visible on hover */}
          <Button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 bg-gold hover:bg-gold-dark text-deep-black text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
            size="sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('addToCart')}</span>
          </Button>
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-lg font-medium group-hover:text-gold transition-colors line-clamp-1">
            {productName}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? 'text-gold fill-gold'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.reviews})</span>
          </div>
          <p className="font-display text-xl font-semibold text-gold">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
