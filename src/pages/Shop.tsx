import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useProducts } from '@/hooks/useProducts';
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

type Category = 'all' | 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'other';

const categoryRouteMap: Record<string, Category> = {
  'perles': 'pearls',
  'bracelets': 'bracelets',
  'colliers': 'necklaces',
  'bagues': 'rings',
  'autres': 'other',
};

const Shop: React.FC = () => {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const { t, formatPrice, language } = useLocale();
  const { data: products = [], isLoading, error } = useProducts();
  
  const ts = (key: string) => shopProductTranslations[key]?.[language] || shopProductTranslations[key]?.['fr'] || key;
  
  const initialCategory: Category = categoryParam 
    ? categoryRouteMap[categoryParam] || 'all' 
    : 'all';

  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory);
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);
  const [selectedDiameters, setSelectedDiameters] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<string>('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get all available filter options from products
  const allQualities = useMemo(() => {
    const qualities = new Set<string>();
    products.forEach(p => p.variants?.qualities?.forEach(q => qualities.add(q)));
    return Array.from(qualities).sort();
  }, [products]);

  const allDiameters = useMemo(() => {
    const diameters = new Set<string>();
    products.forEach(p => p.variants?.diameters?.forEach(d => diameters.add(d)));
    return Array.from(diameters).sort((a, b) => parseInt(a) - parseInt(b));
  }, [products]);

  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => p.variants?.sizes?.forEach(s => sizes.add(s)));
    return Array.from(sizes);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Quality filter
    if (selectedQualities.length > 0) {
      filtered = filtered.filter(p => 
        p.variants?.qualities?.some(q => selectedQualities.includes(q))
      );
    }

    // Diameter filter
    if (selectedDiameters.length > 0) {
      filtered = filtered.filter(p => 
        p.variants?.diameters?.some(d => selectedDiameters.includes(d))
      );
    }

    // Size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => 
        p.variants?.sizes?.some(s => selectedSizes.includes(s))
      );
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
  }, [selectedCategory, selectedQualities, selectedDiameters, selectedSizes, priceRange, sortBy]);

  const toggleQuality = (quality: string) => {
    setSelectedQualities(prev => 
      prev.includes(quality) ? prev.filter(q => q !== quality) : [...prev, quality]
    );
  };

  const toggleDiameter = (diameter: string) => {
    setSelectedDiameters(prev => 
      prev.includes(diameter) ? prev.filter(d => d !== diameter) : [...prev, diameter]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedQualities([]);
    setSelectedDiameters([]);
    setSelectedSizes([]);
    setPriceRange([0, 5000]);
  };

  const hasActiveFilters = selectedQualities.length > 0 || selectedDiameters.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000;

  const categories: { key: Category; label: string; route: string }[] = [
    { key: 'all', label: t('shop'), route: '/shop' },
    { key: 'pearls', label: t('loosePearls'), route: '/shop/perles' },
    { key: 'bracelets', label: t('bracelets'), route: '/shop/bracelets' },
    { key: 'necklaces', label: t('necklaces'), route: '/shop/colliers' },
    { key: 'rings', label: t('rings'), route: '/shop/bagues' },
    { key: 'other', label: t('otherJewelry'), route: '/shop/autres' },
  ];

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'pearls': return t('loosePearls');
      case 'bracelets': return t('bracelets');
      case 'necklaces': return t('necklaces');
      case 'rings': return t('rings');
      case 'other': return t('otherJewelry');
      default: return t('shop');
    }
  };

  const FilterSection = () => (
    <div className="space-y-6">
      {/* Quality Filter */}
      {allQualities.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-display text-lg">
            {t('quality')}
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {allQualities.map(quality => (
              <div key={quality} className="flex items-center space-x-2">
                <Checkbox
                  id={`quality-${quality}`}
                  checked={selectedQualities.includes(quality)}
                  onCheckedChange={() => toggleQuality(quality)}
                />
                <Label htmlFor={`quality-${quality}`} className="cursor-pointer">{quality}</Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Diameter Filter */}
      {allDiameters.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-display text-lg">
            {t('diameter')}
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {allDiameters.map(diameter => (
              <div key={diameter} className="flex items-center space-x-2">
                <Checkbox
                  id={`diameter-${diameter}`}
                  checked={selectedDiameters.includes(diameter)}
                  onCheckedChange={() => toggleDiameter(diameter)}
                />
                <Label htmlFor={`diameter-${diameter}`} className="cursor-pointer">{diameter}</Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Size Filter */}
      {allSizes.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-display text-lg">
            {t('size')}
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {allSizes.map(size => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-${size}`}
                  checked={selectedSizes.includes(size)}
                  onCheckedChange={() => toggleSize(size)}
                />
                <Label htmlFor={`size-${size}`} className="cursor-pointer">{size}</Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

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
      <section className="bg-gradient-to-r from-deep-black to-lagoon-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl text-pearl mb-4"
          >
            {getCategoryTitle()}
          </motion.h1>
          <div className="w-20 h-1 bg-gold mx-auto" />
        </div>
      </section>

      {/* Category Navigation */}
      <nav className="bg-secondary border-b border-border sticky top-[73px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-4 scrollbar-hide">
            {categories.map(cat => (
              <Link
                key={cat.key}
                to={cat.route}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-body text-sm transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-gold text-deep-black'
                    : 'bg-background hover:bg-gold/20 text-foreground'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
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
            <div className="flex items-center justify-between mb-6">
              <div className="lg:hidden">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      {t('filterBy')}
                      {hasActiveFilters && (
                        <span className="ml-2 bg-gold text-deep-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          !
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 bg-card">
                    <SheetHeader>
                      <SheetTitle className="font-display">{t('filterBy')}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSection />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <p className="text-muted-foreground hidden lg:block">
                {filteredProducts.length} {filteredProducts.length === 1 ? ts('shop.product') : ts('shop.products')}
              </p>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-card border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
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
