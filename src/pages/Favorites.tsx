import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useFavorites, FavoriteItem } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Favorites: React.FC = () => {
  const { t, formatPrice } = useLocale();
  const { favoriteItems, removeFavorite, clearFavorites, isLoading } = useFavorites();
  const { addItem } = useCart();

  const handleAddToCart = (item: FavoriteItem) => {
    addItem({
      id: item.product_id,
      name: item.product_name,
      price: item.product_price,
      image: item.product_image,
    });
    toast.success(`${item.product_name} ${t('addedToCart')}`);
  };

  const handleRemove = async (productId: string, productName: string) => {
    const success = await removeFavorite(productId);
    if (success) {
      toast.info(`${productName} ${t('removedFromFavorites')}`);
    } else {
      toast.error(t('errorRemovingFavorite') || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

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
            <h1 className="font-display text-4xl md:text-5xl text-white">
              {t('myFavorites')}
            </h1>
          </motion.div>
          <div className="w-20 h-1 bg-gold mx-auto" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {favoriteItems.length === 0 ? (
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
                {favoriteItems.length} {favoriteItems.length === 1 ? t('productInFavorites') : t('productsInFavorites')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const success = await clearFavorites();
                  if (success) {
                    toast.info(t('allFavoritesRemoved'));
                  } else {
                    toast.error(t('errorClearingFavorites') || 'Erreur lors de la suppression');
                  }
                }}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('removeAll')}
              </Button>
            </div>

            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-lg overflow-hidden border border-border group"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        console.log('[Favorites] Image error for:', item.product_name, item.product_image);
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-display text-lg mb-2 group-hover:text-gold transition-colors line-clamp-1">
                      {item.product_name}
                    </h3>
                    <p className="font-display text-xl text-gold mb-4">
                      {formatPrice(item.product_price)}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 bg-gold hover:bg-gold-light text-deep-black"
                        size="sm"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        {t('addToCart')}
                      </Button>
                      <Button
                        onClick={() => handleRemove(item.product_id, item.product_name)}
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
