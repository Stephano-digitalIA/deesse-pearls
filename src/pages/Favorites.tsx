import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { products } from '@/data/products';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { resolveImagePath } from '@/lib/utils';

const Favorites: React.FC = () => {
  const { t, formatPrice, language } = useLocale();
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const { addItem } = useCart();

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const handleAddToCart = (product: typeof products[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    toast.success(`${product.name} ${t('addedToCart')}`);
  };

  const handleRemove = (productId: string, productName: string) => {
    removeFavorite(productId);
    toast.info(`${productName} ${t('removedFromFavorites')}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-deep-black to-lagoon-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Heart className="w-8 h-8 text-gold fill-gold" />
            <h1 className="font-display text-4xl md:text-5xl text-pearl">
              {t('myFavorites')}
            </h1>
          </motion.div>
          <div className="w-20 h-1 bg-gold mx-auto" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {favoriteProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="font-display text-2xl mb-4">{t('noFavoritesYet')}</h2>
            <p className="text-muted-foreground mb-8">
              {t('exploreFavorites')}
            </p>
            <Link to="/shop">
              <Button className="bg-gold hover:bg-gold-light text-deep-black">
                {t('discoverCollection')}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Header with count and clear button */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground">
                {favoriteProducts.length} {favoriteProducts.length === 1 ? t('productInFavorites') : t('productsInFavorites')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearFavorites();
                  toast.info(t('allFavoritesRemoved'));
                }}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('removeAll')}
              </Button>
            </div>

            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-lg overflow-hidden border border-border group"
                >
                  <Link to={`/product/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={resolveImagePath(product.image)}
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
                          {product.badge === 'new' ? t('new') : t('bestSeller')}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-display text-lg mb-2 group-hover:text-gold transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="font-display text-xl text-gold mb-4">
                      {formatPrice(product.price)}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-gold hover:bg-gold-light text-deep-black"
                        size="sm"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        {t('addToCart')}
                      </Button>
                      <Button
                        onClick={() => handleRemove(product.id, product.name)}
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="text-center mt-12">
              <Link to="/shop">
                <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-deep-black">
                  {t('continueShopping')}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;
