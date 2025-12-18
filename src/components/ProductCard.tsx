import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/data/products';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import { getProductTranslation } from '@/data/productTranslations';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t, formatPrice, language } = useLocale();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const productName = getProductTranslation(product.slug, 'name', language) || product.name;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: productName,
      price: product.price,
      image: product.images[0],
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
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-4">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.badge && (
            <span
              className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold uppercase rounded-full ${
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
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
              isFavorite(product.id) 
                ? 'bg-gold text-deep-black' 
                : 'bg-background/80 text-foreground hover:bg-gold hover:text-deep-black'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
          </button>
          <div className="absolute inset-0 bg-deep-black/0 group-hover:bg-deep-black/20 transition-colors duration-300" />
          <Button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gold hover:bg-gold-dark text-deep-black"
            size="sm"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {t('addToCart')}
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
