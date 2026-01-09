import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingBag, ChevronLeft, ChevronRight, Truck, Shield, Award, Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTranslatedProductBySlug, useTranslatedProductsByCategory } from "@/hooks/useTranslatedProducts";
import { useReviews } from "@/hooks/useReviews";
import { useQueryClient } from "@tanstack/react-query";
import type { ProductCategory } from "@/types/supabase";
import ProductCard from "@/components/ProductCard";
import ReviewForm, { reviewTranslations } from "@/components/ReviewForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { shopProductTranslations } from "@/data/shopProductTranslations";
import { getProductTranslation } from "@/data/productTranslations";
import { resolveImagePath } from "@/lib/utils";

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, formatPrice, language } = useLocale();
  const { addItem } = useCart();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const ts = (key: string) => shopProductTranslations[key]?.[language] || shopProductTranslations[key]?.["fr"] || key;

  const { data: product, isLoading, error } = useTranslatedProductBySlug(slug || "");
  const queryClient = useQueryClient();

  // Fetch reviews from database
  const { data: reviews = [], isLoading: reviewsLoading } = useReviews(product?.id || "");

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [selectedDiameter, setSelectedDiameter] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const handleReviewSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", product?.id] });
  };

  // Fetch related products based on product category
  const { data: relatedProductsData = [] } = useTranslatedProductsByCategory(
    (product?.category || "pearls") as ProductCategory,
  );
  const relatedProducts = relatedProductsData.filter((p) => p.id !== product?.id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-4">{ts("product.notFound")}</h1>
          <Link to="/shop">
            <Button>{ts("product.backToShop")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const favorite = isFavorite(product.id);

  const productName = getProductTranslation(product.slug, "name", language) || product.name;
  const translatedDescription = getProductTranslation(product.slug, "description", language) || product.description;

  const handleAddToCart = () => {
    const variantInfo: string[] = [];
    if (selectedSize) variantInfo.push(selectedSize);
    if (selectedQuality) variantInfo.push(selectedQuality);
    if (selectedDiameter) variantInfo.push(selectedDiameter);

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: productName,
        price: product.price,
        image: product.images[0],
        variant: variantInfo.length > 0 ? variantInfo.join(" - ") : undefined,
      });
    }
    toast.success(`${productName} ${ts("product.addedToCart")}`);
  };

  const toggleFavorite = () => {
    if (favorite) {
      removeFavorite(product.id);
      toast.info(ts("product.removedFromFavorites"));
    } else {
      addFavorite(product.id);
      toast.success(ts("product.addedToFavorites"));
    }
  };

  const averageRating =
    reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : product?.rating || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-secondary py-4 border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-gold transition-colors">
              {t("home")}
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-gold transition-colors">
              {t("shop")}
            </Link>
            <span>/</span>
            <span className="text-foreground">{productName}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
              <img
                src={resolveImagePath(product.images[selectedImage])}
                alt={productName}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <Badge
                  className={`absolute top-4 left-4 ${product.badge === "new" ? "bg-lagoon" : "bg-gold text-deep-black"}`}
                >
                  {product.badge === "new" ? ts("product.new") : ts("product.bestSeller")}
                </Badge>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
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
                      selectedImage === index ? "border-gold" : "border-transparent"
                    }`}
                  >
                    <img
                      src={resolveImagePath(img)}
                      alt={`${productName} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl mb-2">{productName}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-gold text-gold" : "text-muted-foreground"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} {ts("product.reviews")})
                  </span>
                </div>
              </div>
            </div>

            <p className="text-2xl font-display text-gold">{formatPrice(product.price)}</p>

            <p className="text-muted-foreground leading-relaxed">{productDescription}</p>

            {/* Variants */}
            <div className="space-y-4">
              {product.variants?.qualities && (
                <div>
                  <label className="block font-body text-sm mb-2">{t("quality")}</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.qualities.map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setSelectedQuality(quality)}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          selectedQuality === quality
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border hover:border-gold/50"
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
                  <label className="block font-body text-sm mb-2">{t("diameter")}</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.diameters.map((diameter) => (
                      <button
                        key={diameter}
                        onClick={() => setSelectedDiameter(diameter)}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          selectedDiameter === diameter
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border hover:border-gold/50"
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
                  <label className="block font-body text-sm mb-2">{t("size")}</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          selectedSize === size
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border hover:border-gold/50"
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
              <label className="block font-body text-sm mb-2">{t("quantity")}</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-md">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2 hover:bg-secondary transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-border">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
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
                {t("addToCart")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`${favorite ? "border-gold text-gold" : "border-border"}`}
                onClick={toggleFavorite}
              >
                <Heart className={`w-5 h-5 ${favorite ? "fill-gold" : ""}`} />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-gold" />
                <p className="text-xs text-muted-foreground">{t("freeOver")}</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-gold" />
                <p className="text-xs text-muted-foreground">{t("securePayment")}</p>
              </div>
              <div className="text-center">
                <Award className="w-6 h-6 mx-auto mb-2 text-gold" />
                <p className="text-xs text-muted-foreground">{t("authenticCertificate")}</p>
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
                {ts("product.description")}
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent px-6 py-4"
              >
                {ts("product.customerReviews")} ({reviews.length})
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent px-6 py-4"
              >
                {t("deliveryReturns")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="py-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground">{productDescription}</p>
                <h3 className="font-display text-xl mt-6 mb-4">{ts("product.characteristics")}</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• {ts("product.certifiedPearl")}</li>
                  <li>• {ts("product.gold18k")}</li>
                  <li>• {ts("product.luxuryBox")}</li>
                  <li>• {ts("product.certificateIncluded")}</li>
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
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-gold text-gold" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.reviews} {ts("product.reviews")}
                    </p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2 mb-1">
                        <span className="text-sm w-3">{stars}</span>
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold"
                            style={{ width: stars === 5 ? "70%" : stars === 4 ? "20%" : "10%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length === 0 && !reviewsLoading ? (
                    <p className="text-muted-foreground text-center py-4">
                      {reviewTranslations["review.noReviews"]?.[language] ||
                        reviewTranslations["review.noReviews"]?.["en"]}
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-border pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{review.author_name}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.rating ? "fill-gold text-gold" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US")}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Review Form */}
                {product && <ReviewForm productId={product.id} onReviewSubmitted={handleReviewSubmitted} />}
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="py-8">
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <h3 className="font-display text-xl mb-4 text-foreground">{ts("product.shipping")}</h3>
                <ul className="space-y-2">
                  <li>• {ts("product.secureShipping")}</li>
                  <li>• {ts("product.deliveryTime")}</li>
                  <li>• {ts("product.internationalShipping")}</li>
                  <li>• {ts("product.realTimeTracking")}</li>
                </ul>
                <h3 className="font-display text-xl mt-6 mb-4 text-foreground">{ts("product.returns")}</h3>
                <ul className="space-y-2">
                  <li>• {ts("product.freeReturns")}</li>
                  <li>• {ts("product.exchangeOrRefund")}</li>
                  <li>• {ts("product.originalCondition")}</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl mb-8">{ts("product.youMayAlsoLike")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
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
