import React from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { legalTranslations } from '@/data/legalTranslations';

const TermsOfSale: React.FC = () => {
  const { language } = useLocale();
  const t = (key: string) => legalTranslations[language]?.[key] || legalTranslations['fr'][key] || key;

  return (
    <div className="min-h-screen bg-cream-light py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl text-deep-black mb-12 text-center">
          {t('termsOfSaleTitle')}
        </h1>

        <div className="space-y-10 text-deep-black/80">
          {/* Scope */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('scope')}</h2>
            <p className="leading-relaxed">{t('scopeText')}</p>
          </section>

          {/* Products */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('products')}</h2>
            <p className="leading-relaxed">{t('productsText')}</p>
          </section>

          {/* Prices */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('prices')}</h2>
            <p className="leading-relaxed">{t('pricesText')}</p>
          </section>

          {/* Ordering */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('ordering')}</h2>
            <p className="leading-relaxed">{t('orderingText')}</p>
          </section>

          {/* Payment */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('payment')}</h2>
            <p className="leading-relaxed">{t('paymentText')}</p>
          </section>

          {/* Delivery */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('delivery')}</h2>
            <p className="leading-relaxed">{t('deliveryText')}</p>
          </section>

          {/* Return Policy */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('returnPolicy')}</h2>
            <p className="leading-relaxed">{t('returnPolicyText')}</p>
          </section>

          {/* Warranty */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('warranty')}</h2>
            <p className="leading-relaxed">{t('warrantyText')}</p>
          </section>

          {/* Liability */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('liability')}</h2>
            <p className="leading-relaxed">{t('liabilityText')}</p>
          </section>

          {/* Applicable Law */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('applicableLaw')}</h2>
            <p className="leading-relaxed">{t('applicableLawText')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfSale;
