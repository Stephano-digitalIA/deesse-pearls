import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { products, Product } from '@/data/products';
import { useLocale } from '@/contexts/LocaleContext';
import { Input } from '@/components/ui/input';
import { resolveImagePath } from '@/lib/utils';

interface SearchBarProps {
  onClose?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onClose }) => {
  const { t, formatPrice } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      const searchTerms = query.toLowerCase().split(' ');
      const filtered = products.filter(product => {
        const searchText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
      setResults(filtered.slice(0, 6));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onClose?.();
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'pearls': return t('loosePearls');
      case 'bracelets': return t('bracelets');
      case 'necklaces': return t('necklaces');
      case 'rings': return t('rings');
      case 'earrings': return t('earrings');
      case 'pendentifs': return t('pendants');
      case 'parures': return t('jewelrySets');
      case 'broches': return t('brooches');
      default: return category;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 bg-secondary border-border focus:border-gold"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-elegant overflow-hidden z-50"
          >
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-3 py-2">
                {results.length} résultat{results.length > 1 ? 's' : ''}
              </p>
              {results.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-secondary transition-colors"
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={resolveImagePath(product.image)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{getCategoryLabel(product.category)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gold">{formatPrice(product.price)}</p>
                </Link>
              ))}
            </div>
            <Link
              to="/shop"
              onClick={handleResultClick}
              className="block px-4 py-3 text-center text-sm text-gold hover:bg-secondary border-t border-border transition-colors"
            >
              Voir tous les produits
            </Link>
          </motion.div>
        )}

        {isOpen && query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-elegant overflow-hidden z-50"
          >
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Aucun produit trouvé pour "{query}"</p>
              <Link
                to="/shop"
                onClick={handleResultClick}
                className="inline-block mt-3 text-sm text-gold hover:underline"
              >
                Parcourir la boutique
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
