import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingBag, ChevronLeft, ChevronRight, Truck, Shield, Award, Sparkles } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getProductBySlug, products } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, formatPrice } = useLocale();
  const { addItem } = useCart();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const product = getProductBySlug(slug || '');
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedDiameter, setSelectedDiameter] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-4">Produit non trouvé</h1>
          <Link to="/shop">
            <Button>Retour à la boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  const favorite = isFavorite(product.id);

  const handleAddToCart = () => {
    const variantInfo: string[] = [];
    if (selectedSize) variantInfo.push(selectedSize);
    if (selectedQuality) variantInfo.push(selectedQuality);
    if (selectedDiameter) variantInfo.push(selectedDiameter);
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        variant: variantInfo.length > 0 ? variantInfo.join(' - ') : undefined,
      });
    }
    toast.success(`${product.name} ajouté au panier`);
  };

  const toggleFavorite = () => {
    if (favorite) {
      removeFavorite(product.id);
      toast.info('Retiré des favoris');
    } else {
      addFavorite(product.id);
      toast.success('Ajouté aux favoris');
    }
  };

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Mock reviews
  const reviews = [
    { id: 1, author: 'Marie L.', rating: 5, date: '2024-01-15', comment: 'Absolument magnifique ! La qualité est exceptionnelle et la perle brille de mille reflets. Je recommande vivement.' },
    { id: 2, author: 'Sophie M.', rating: 5, date: '2024-01-10', comment: 'Un cadeau parfait pour ma mère. Elle était ravie. L\'emballage était soigné et la livraison rapide.' },
    { id: 3, author: 'Catherine D.', rating: 4, date: '2024-01-05', comment: 'Très belle pièce, conforme à la description. Seul petit bémol : le délai de livraison un peu long.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-secondary py-4 border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-gold transition-colors">{t('home')}</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-gold transition-colors">{t('shop')}</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <Badge className={`absolute top-4 left-4 ${product.badge === 'new' ? 'bg-lagoon' : 'bg-gold text-deep-black'}`}>
                  {product.badge === 'new' ? 'Nouveau' : 'Best-seller'}
                </Badge>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-gold' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-display text-3xl md:text-4xl mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-gold text-gold' : 'text-muted-foreground'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} avis)
                  </span>
                </div>
              </div>
            </div>

            <p className="text-2xl font-display text-gold">{formatPrice(product.price)}</p>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Variants */}
            <div className="space-y-4">
              {product.variants?.qualities && (
                <div>
                  <label className="block font-body text-sm mb-2">{t('quality')}</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.qualities.map(quality => (
                      <button
                        key={quality}
                        onClick={() => setSelectedQuality(quality)}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          selectedQuality === quality
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants?.diameters && (
                <div>
                  <label className="block font-body text-sm mb-2">{t('diameter')}</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.diameters.map(diameter => (
                      <button
                        key={diameter}
                        onClick={() => setSelectedDiameter(diameter)}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          selectedDiameter === diameter
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        {diameter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants?.sizes && (
                <div>
                  <label className="block font-body text-sm mb-2">{t('size')}</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          selectedSize === size
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-border hover:border-gold/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-body text-sm mb-2">{t('quantity')}</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-md">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-2 hover:bg-secondary transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-border">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-4 py-2 hover:bg-secondary transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 bg-gold hover:bg-gold-light text-deep-black font-semibold"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {t('addToCart')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`${favorite ? 'border-gold text-gold' : 'border-border'}`}
                onClick={toggleFavorite}
              >
                <Heart className={`w-5 h-5 ${favorite ? 'fill-gold' : ''}`} />
              </Button>
            </div>

            {/* Customization CTA */}
            <Link to="/customization" className="block">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-lagoon text-lagoon hover:bg-lagoon hover:text-pearl"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('requestCustomization')}
              </Button>
            </Link>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-gold" />
                <p className="text-xs text-muted-foreground">{t('freeOver')}</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-gold" />
                <p className="text-xs text-muted-foreground">{t('securePayment')}</p>
              </div>
              <div className="text-center">
                <Award className="w-6 h-6 mx-auto mb-2 text-gold" />
                <p className="text-xs text-muted-foreground">{t('authenticCertificate')}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs: Description & Reviews */}
        <div className="mt-16">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent px-6 py-4"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent px-6 py-4"
              >
                Avis clients ({reviews.length})
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent px-6 py-4"
              >
                {t('deliveryReturns')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="py-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground">{product.description}</p>
                <h3 className="font-display text-xl mt-6 mb-4">Caractéristiques</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Perle de Tahiti authentique certifiée</li>
                  <li>• Or 18 carats (750/1000)</li>
                  <li>• Livré dans un écrin luxe DEESSE PEARLS</li>
                  <li>• Certificat d'authenticité inclus</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="py-8">
              <div className="space-y-6">
                {/* Rating Summary */}
                <div className="flex items-center gap-8 p-6 bg-secondary rounded-lg">
                  <div className="text-center">
                    <p className="text-4xl font-display text-gold">{product.rating}</p>
                    <div className="flex items-center gap-1 my-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-gold text-gold' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{product.reviews} avis</p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map(stars => (
                      <div key={stars} className="flex items-center gap-2 mb-1">
                        <span className="text-sm w-3">{stars}</span>
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold"
                            style={{ width: stars === 5 ? '70%' : stars === 4 ? '20%' : '10%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-border pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.author}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? 'fill-gold text-gold' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="py-8">
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <h3 className="font-display text-xl mb-4 text-foreground">Livraison</h3>
                <ul className="space-y-2">
                  <li>• Livraison sécurisée par transporteur</li>
                  <li>• Délai de livraison : 3-5 jours ouvrés (France)</li>
                  <li>• Livraison internationale disponible</li>
                  <li>• Suivi de colis en temps réel</li>
                </ul>
                <h3 className="font-display text-xl mt-6 mb-4 text-foreground">Retours</h3>
                <ul className="space-y-2">
                  <li>• Retour gratuit sous 14 jours</li>
                  <li>• Échange ou remboursement</li>
                  <li>• Article dans son état d'origine</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl mb-8">Vous aimerez aussi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
