import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown, Loader2, Home, ChevronRight } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useTranslatedProducts } from '@/hooks/useTranslatedProducts';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { shopProductTranslations } from '@/data/shopProductTranslations';

type Category = 'all' | 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'earrings' | 'pendentifs' | 'parures' | 'other';

const categoryRouteMap: Record<string, Category> = {
  'perles': 'pearls',
  'bracelets': 'bracelets',
  'colliers': 'necklaces',
  'bagues': 'rings',
  'boucles-oreilles': 'earrings',
  'pendentifs': 'pendentifs',
  'parures': 'parures',
  'autres': 'other',
};

const Shop: React.FC = () => {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const { t, formatPrice, language } = useLocale();
  const { data: products = [], isLoading, error } = useTranslatedProducts();
  
  const ts = (key: string) => shopProductTranslations[key]?.[language] || shopProductTranslations[key]?.['fr'] || key;
  
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<string>('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync selectedCategory with URL param (single useEffect, no duplicate)
  useEffect(() => {
    const newCategory: Category = categoryParam
      ? categoryRouteMap[categoryParam] || 'all'
      : 'all';
    setSelectedCategory(newCategory);
  }, [categoryParam]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    // Filter out out-of-stock products
    let filtered = products.filter(p => p.in_stock === true);

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [selectedCategory, priceRange, sortBy, products]);

  const clearFilters = () => {
    setPriceRange([0, 5000]);
  };

  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < 5000;

  const categories: { key: Category; label: string; route: string }[] = [
    { key: 'all', label: t('shop'), route: '/shop' },
    { key: 'pearls', label: t('loosePearls'), route: '/shop/perles' },
    { key: 'bracelets', label: t('bracelets'), route: '/shop/bracelets' },
    { key: 'necklaces', label: t('necklaces'), route: '/shop/colliers' },
    { key: 'rings', label: t('rings'), route: '/shop/bagues' },
    { key: 'earrings', label: t('earrings'), route: '/shop/boucles-oreilles' },
    { key: 'pendentifs', label: t('pendants'), route: '/shop/pendentifs' },
    { key: 'parures', label: t('jewelrySets'), route: '/shop/parures' },
    { key: 'other', label: t('otherJewelry'), route: '/shop/autres' },
  ];

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'pearls': return t('loosePearls');
      case 'bracelets': return t('bracelets');
      case 'necklaces': return t('necklaces');
      case 'rings': return t('rings');
      case 'earrings': return t('earrings');
      case 'other': return t('otherJewelry');
      default: return t('shop');
    }
  };

  const FilterSection = () => (
    <div className="space-y-6">
      {/* Price Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-display text-lg">
          {t('price')}
          <ChevronDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={5000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          {ts('shop.clearFilters')}
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{ts('shop.errorLoading')}</p>
          <Button onClick={() => window.location.reload()}>{ts('shop.retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-deep-black to-lagoon-dark py-10 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl text-pearl mb-3 sm:mb-4"
          >
            {getCategoryTitle()}
          </motion.h1>
          <div className="w-16 sm:w-20 h-1 bg-gold mx-auto" />
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="container mx-auto px-4 py-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="flex items-center hover:text-gold transition-colors">
              <Home className="w-4 h-4" />
            </Link>
          </li>
          <li>
            <ChevronRight className="w-4 h-4" />
          </li>
          <li>
            <Link to="/shop" className={`hover:text-gold transition-colors ${selectedCategory === 'all' ? 'text-gold font-medium' : ''}`}>
              {t('shop')}
            </Link>
          </li>
          {selectedCategory !== 'all' && (
            <>
              <li>
                <ChevronRight className="w-4 h-4" />
              </li>
              <li className="text-gold font-medium">
                {getCategoryTitle()}
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-[160px] bg-card p-6 rounded-lg border border-border">
              <h2 className="font-display text-xl mb-6">{t('filterBy')}</h2>
              <FilterSection />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <Filter className="w-4 h-4 mr-2" />
                        <span className="hidden xs:inline">{t('filterBy')}</span>
                        {hasActiveFilters && (
                          <span className="ml-1.5 bg-gold text-deep-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            !
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] max-w-[320px] bg-card">
                      <SheetHeader>
                        <SheetTitle className="font-display">{t('filterBy')}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                        <FilterSection />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Product count - visible on all screens */}
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length} {filteredProducts.length === 1 ? ts('shop.product') : ts('shop.products')}
                </p>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold h-9 min-w-[120px]"
              >
                <option value="default">{t('sortBy')}</option>
                <option value="price-asc">{t('price')} ↑</option>
                <option value="price-desc">{t('price')} ↓</option>
                <option value="rating">★ {t('quality')}</option>
              </select>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">{ts('shop.noProductsMatch')}</p>
                <Button variant="outline" onClick={clearFilters}>
                  {ts('shop.resetFilters')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
