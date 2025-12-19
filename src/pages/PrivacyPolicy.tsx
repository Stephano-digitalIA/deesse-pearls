import React from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { legalTranslations } from '@/data/legalTranslations';

const PrivacyPolicy: React.FC = () => {
  const { language } = useLocale();
  const t = (key: string) => legalTranslations[language]?.[key] || legalTranslations['fr'][key] || key;

  return (
    <div className="min-h-screen bg-cream-light py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl text-deep-black mb-4 text-center">
          {t('privacyPolicyTitle')}
        </h1>
        <p className="text-center text-deep-black/60 mb-12">
          {t('lastUpdated')}: 19 décembre 2025
        </p>

        <div className="space-y-10 text-deep-black/80">
          {/* Data Controller */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('dataController')}</h2>
            <p className="leading-relaxed">{t('dataControllerText')}</p>
          </section>

          {/* Data Collected */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('dataCollected')}</h2>
            <p className="leading-relaxed">{t('dataCollectedText')}</p>
          </section>

          {/* Purpose of Processing */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('purposeOfProcessing')}</h2>
            <p className="leading-relaxed">{t('purposeOfProcessingText')}</p>
          </section>

          {/* Data Retention */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('dataRetention')}</h2>
            <p className="leading-relaxed">{t('dataRetentionText')}</p>
          </section>

          {/* Your Rights */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('yourRights')}</h2>
            <p className="leading-relaxed">{t('yourRightsText')}</p>
          </section>

          {/* Data Security */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('dataSecurity')}</h2>
            <p className="leading-relaxed">{t('dataSecurityText')}</p>
          </section>

          {/* Third Parties */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('thirdParties')}</h2>
            <p className="leading-relaxed">{t('thirdPartiesText')}</p>
          </section>

          {/* Contact */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('contactPrivacy')}</h2>
            <p className="leading-relaxed">{t('contactPrivacyText')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
