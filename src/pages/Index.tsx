import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Award, Truck, Heart } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { getFeaturedProducts } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const { t } = useLocale();
  const featuredProducts = getFeaturedProducts();

  const commitments = [
    { icon: Shield, key: 'securePayment' },
    { icon: Award, key: 'authenticCertificate' },
    { icon: Truck, key: 'freeOver' },
    { icon: Heart, key: 'responsiveService' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center bg-gradient-to-br from-deep-black via-deep-black to-lagoon-dark overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-lagoon/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-tangerine italic text-5xl md:text-7xl lg:text-8xl text-gold mb-8 leading-tight"
          >
            {t('heroTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-pearl/70 text-lg md:text-xl max-w-2xl mx-auto mb-12"
          >
            {t('heroSubtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link to="/shop">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-deep-black font-semibold px-8">
                {t('discoverCollection')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/customization">
              <Button size="lg" className="bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-deep-black font-semibold px-8 transition-all duration-300">
                {t('customCreation')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Commitments Bar */}
      <section className="bg-secondary py-6 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {commitments.map((item) => (
              <div key={item.key} className="flex items-center justify-center gap-3">
                <item.icon className="w-6 h-6 text-gold" />
                <span className="font-body text-sm">{t(item.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-4">{t('bestSellers')}</h2>
            <div className="w-20 h-1 bg-gold mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/shop">
              <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-deep-black">
                {t('viewAll')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Custom Creation CTA */}
      <section className="py-20 bg-deep-black text-pearl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-3xl md:text-5xl mb-6">{t('dreamJewelry')}</h2>
          <p className="text-pearl/70 max-w-2xl mx-auto mb-8">{t('customCreationAvailable')}</p>
          <Link to="/customization">
            <Button size="lg" className="bg-gold hover:bg-gold-light text-deep-black font-semibold">
              {t('requestCustomization')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
