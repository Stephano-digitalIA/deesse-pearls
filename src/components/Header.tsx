import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ChevronDown, Globe, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, languages, currencies, languageNames, Language, Currency } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const { language, currency, setLanguage, setCurrency, t } = useLocale();
  const { totalItems, setIsCartOpen } = useCart();
  const { favorites } = useFavorites();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  const shopCategories = [
    { key: 'loosePearls', path: '/shop/pearls' },
    { key: 'bracelets', path: '/shop/bracelets' },
    { key: 'necklaces', path: '/shop/necklaces' },
    { key: 'rings', path: '/shop/rings' },
    { key: 'otherJewelry', path: '/shop/other' },
  ];

  const navItems = [
    { key: 'home', path: '/' },
    { key: 'about', path: '/about' },
    { key: 'shop', path: '/shop', hasDropdown: true },
    { key: 'customization', path: '/customization' },
    { key: 'commitments', path: '/commitments' },
    { key: 'contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="bg-deep-black text-pearl py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <span className="hidden sm:block font-display italic">{t('designer25Years')}</span>
          <div className="flex items-center gap-4 ml-auto">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-gold transition-colors">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{languageNames[language].split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={language === lang ? 'bg-muted' : ''}
                  >
                    {languageNames[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-gold transition-colors">
                <span>{currency === 'EUR' ? '€ EUR' : '$ USD'}</span>
                <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                {currencies.map((curr) => (
                  <DropdownMenuItem
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={currency === curr ? 'bg-muted' : ''}
                  >
                    {curr === 'EUR' ? '€ EUR' : '$ USD'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-wide">
              <span className="text-gold">DEESSE</span>{' '}
              <span className="text-foreground">PEARLS</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setIsShopOpen(true)}
                onMouseLeave={() => item.hasDropdown && setIsShopOpen(false)}
              >
                {item.hasDropdown ? (
                  <>
                    <Link
                      to={item.path}
                      className="flex items-center gap-1 font-body text-sm uppercase tracking-wider hover:text-gold transition-colors py-2"
                    >
                      {t(item.key)}
                      <ChevronDown className="w-4 h-4" />
                    </Link>
                    <AnimatePresence>
                      {isShopOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 bg-card shadow-elegant rounded-md py-2 min-w-[200px]"
                        >
                          {shopCategories.map((cat) => (
                            <Link
                              key={cat.key}
                              to={cat.path}
                              className="block px-4 py-2 text-sm hover:bg-muted hover:text-gold transition-colors"
                            >
                              {t(cat.key)}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className="font-body text-sm uppercase tracking-wider hover:text-gold transition-colors"
                  >
                    {t(item.key)}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:text-gold transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link to="/favorites" className="p-2 hover:text-gold transition-colors relative">
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-deep-black text-xs font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:text-gold transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-deep-black text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t border-border"
          >
            <nav className="container mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <div key={item.key}>
                  <Link
                    to={item.path}
                    onClick={() => !item.hasDropdown && setIsMobileMenuOpen(false)}
                    className="block font-body text-sm uppercase tracking-wider py-2 hover:text-gold transition-colors"
                  >
                    {t(item.key)}
                  </Link>
                  {item.hasDropdown && (
                    <div className="pl-4 space-y-2">
                      {shopCategories.map((cat) => (
                        <Link
                          key={cat.key}
                          to={cat.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-sm text-muted-foreground hover:text-gold transition-colors py-1"
                        >
                          {t(cat.key)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
