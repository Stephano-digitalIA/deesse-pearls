import React from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { legalTranslations } from '@/data/legalTranslations';

const LegalNotice: React.FC = () => {
  const { language } = useLocale();
  const t = (key: string) => legalTranslations[language]?.[key] || legalTranslations['fr'][key] || key;

  return (
    <div className="min-h-screen bg-cream-light py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-display text-4xl md:text-5xl text-deep-black mb-12 text-center">
          {t('legalNoticeTitle')}
        </h1>

        <div className="space-y-10 text-deep-black/80">
          {/* Company Information */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-6">{t('companyInfo')}</h2>
            <div className="grid gap-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="font-semibold min-w-48">{t('companyName')} :</span>
                <span>{t('companyNameValue')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="font-semibold min-w-48">{t('registeredOffice')} :</span>
                <span>{t('registeredOfficeValue')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="font-semibold min-w-48">{t('registrationNumber')} :</span>
                <span>{t('registrationNumberValue')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="font-semibold min-w-48">{t('vatNumber')} :</span>
                <span>{t('vatNumberValue')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="font-semibold min-w-48">{t('shareCapital')} :</span>
                <span>{t('shareCapitalValue')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <span className="font-semibold min-w-48">{t('publicationDirector')} :</span>
                <span>{t('publicationDirectorValue')}</span>
              </div>
            </div>
          </section>

          {/* Hosting */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('hosting')}</h2>
            <p className="leading-relaxed">{t('hostingInfo')}</p>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('intellectualProperty')}</h2>
            <p className="leading-relaxed">{t('intellectualPropertyText')}</p>
          </section>

          {/* Personal Data */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('personalData')}</h2>
            <p className="leading-relaxed">{t('personalDataText')}</p>
          </section>

          {/* Cookies */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('cookies')}</h2>
            <p className="leading-relaxed">{t('cookiesText')}</p>
          </section>

          {/* Dispute Resolution */}
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="font-display text-2xl text-gold mb-4">{t('disputeResolution')}</h2>
            <p className="leading-relaxed">{t('disputeResolutionText')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;
