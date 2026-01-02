import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ChevronDown, Globe, Heart, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, languages, currencies, languageNames, Language, Currency } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/SearchBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const Header: React.FC = () => {
  const { language, currency, setLanguage, setCurrency, t } = useLocale();
  const { totalItems, setIsCartOpen } = useCart();
  const { favorites } = useFavorites();
  const { user, signOut, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const shopCategories = [
    { key: 'loosePearls', path: '/shop/perles' },
    { key: 'bracelets', path: '/shop/bracelets' },
    { key: 'necklaces', path: '/shop/colliers' },
    { key: 'rings', path: '/shop/bagues' },
    { key: 'otherJewelry', path: '/shop/autres' },
  ];

  const navItems = [
    { key: 'home', path: '/' },
    { key: 'about', path: '/about' },
    { key: 'shop', path: '/shop', hasDropdown: true },
    { key: 'commitments', path: '/commitments' },
    { key: 'faq', path: '/faq' },
    { key: 'contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar - hidden on mobile for cleaner look */}
      <div className="hidden sm:block bg-deep-black text-pearl py-1.5">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <span className="font-display italic text-xs md:text-sm">{t('designer25Years')}</span>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-gold transition-colors text-xs md:text-sm">
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{languageNames[language].split(' ')[0]}</span>
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
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-gold transition-colors text-xs md:text-sm">
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
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Left side: Menu button + Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 -ml-2 touch-manipulation hover:bg-muted/50 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Logo - Left aligned */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-wide whitespace-nowrap">
                <span className="text-gold">DEESSE</span>{' '}
                <span className="text-foreground">PEARLS</span>
              </h1>
            </Link>
          </div>

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
                          className="absolute top-full left-0 z-[60] bg-card border border-border shadow-elegant rounded-md py-2 min-w-[200px] pointer-events-auto"
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
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Language Selector - Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="lg:hidden p-2 hover:text-gold hover:bg-muted/50 rounded-md transition-colors touch-manipulation">
                  <Globe className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card min-w-[140px]">
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border">
                  {t('language') || 'Langue'}
                </div>
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={language === lang ? 'bg-muted' : ''}
                  >
                    {languageNames[lang]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {t('currency') || 'Devise'}
                </div>
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

            {/* Search */}
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <button className="p-2 hover:text-gold hover:bg-muted/50 rounded-md transition-colors touch-manipulation">
                  <Search className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[calc(100vw-1rem)] sm:w-96 p-0 border-border bg-card" sideOffset={8}>
                <SearchBar onClose={() => setIsSearchOpen(false)} />
              </PopoverContent>
            </Popover>
            
            {/* User account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:text-gold hover:bg-muted/50 rounded-md transition-colors touch-manipulation flex items-center">
                  <User className="w-5 h-5" />
                  {user && (
                    <span className="text-[10px] font-medium text-gold truncate max-w-[50px] ml-1 hidden md:block">
                      {user.user_metadata?.first_name || user.email?.split('@')[0]}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card min-w-[180px]">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border">
                      {user.email}
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        {t('myAccount')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          {t('administration')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()} 
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('logout')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="cursor-pointer">
                        {t('login')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="cursor-pointer">
                        {t('signup')}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Favorites */}
            <Link to="/favorites" className="p-2 hover:text-gold hover:bg-muted/50 rounded-md transition-colors relative touch-manipulation">
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-gold text-deep-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
            
            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:text-gold hover:bg-muted/50 rounded-md transition-colors relative touch-manipulation"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-gold text-deep-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
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
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-card border-t border-border overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4">
              {/* User greeting in mobile */}
              {user && (
                <div className="pb-4 mb-4 border-b border-border">
                  <Link 
                    to="/account" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 hover:text-gold transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-gold/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-gold">
                        {user.user_metadata?.first_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </Link>
                </div>
              )}
              
              {/* Navigation items */}
              <div className="space-y-1">
                {navItems.map((item) => (
                  <div key={item.key}>
                    <Link
                      to={item.path}
                      onClick={() => !item.hasDropdown && setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between font-body text-base uppercase tracking-wider py-3 hover:text-gold transition-colors border-b border-border/50"
                    >
                      {t(item.key)}
                      {item.hasDropdown && <ChevronDown className="w-4 h-4" />}
                    </Link>
                    {item.hasDropdown && (
                      <div className="pl-4 py-2 space-y-1 bg-muted/30 rounded-b-md mb-1">
                        {shopCategories.map((cat) => (
                          <Link
                            key={cat.key}
                            to={cat.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-sm text-muted-foreground hover:text-gold transition-colors py-2.5 px-2"
                          >
                            {t(cat.key)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile language/currency selectors */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Language */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm hover:text-gold transition-colors py-2 px-3 bg-muted/50 rounded-md">
                      <Globe className="w-4 h-4" />
                      <span>{languageNames[language].split(' ')[0]}</span>
                      <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card">
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

                  {/* Currency */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm hover:text-gold transition-colors py-2 px-3 bg-muted/50 rounded-md">
                      <span>{currency === 'EUR' ? '€ EUR' : '$ USD'}</span>
                      <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card">
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

                {/* Login/Account link for mobile */}
                {!user && (
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm py-2 px-3 bg-gold text-deep-black rounded-md font-medium"
                  >
                    <User className="w-4 h-4" />
                    {t('login')}
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
