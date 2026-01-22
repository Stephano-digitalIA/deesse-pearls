import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

const Footer: React.FC = () => {
  const { t } = useLocale();

  const trustBadges = [
    { key: 'securePayment', icon: '🔒' },
    { key: 'authenticCertificate', icon: '📜' },
    { key: 'responsiveService', icon: '💬' },
    { key: 'exceptionalQuality', icon: '💎' },
  ];

  return (
    <footer className="bg-deep-black text-pearl">
      {/* Trust badges bar */}
      <div className="border-b border-pearl/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge) => (
              <div key={badge.key} className="flex items-center justify-center gap-2 text-sm">
                <span className="text-xl">{badge.icon}</span>
                <span className="font-body text-pearl/80">{t(badge.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl">
              <span className="text-gold">DEESSE</span> PEARLS
            </h2>
            <p className="text-pearl/70 text-sm leading-relaxed">
              {t('designer25Years')}. {t('dreamJewelry')}.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-pearl/60 hover:text-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-pearl/60 hover:text-gold transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-lg mb-4 text-gold">{t('shop')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop/pearls" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('loosePearls')}
                </Link>
              </li>
              <li>
                <Link to="/shop/bracelets" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('bracelets')}
                </Link>
              </li>
              <li>
                <Link to="/shop/necklaces" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('necklaces')}
                </Link>
              </li>
              <li>
                <Link to="/shop/rings" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('rings')}
                </Link>
              </li>
              <li>
                <Link to="/shop/earrings" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('earrings')}
                </Link>
              </li>
              <li>
                <Link to="/shop/pendants" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('pendants')}
                </Link>
              </li>
              <li>
                <Link to="/shop/sets" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('jewelrySets')}
                </Link>
              </li>
              <li>
                <Link to="/shop/other" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('otherJewelry')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer service */}
          <div>
            <h3 className="font-display text-lg mb-4 text-gold">{t('customerService')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('contactUs')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('deliveryReturns')}
                </Link>
              </li>
              <li>
                <Link to="/commitments" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('ourCommitments')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-pearl/70 hover:text-gold transition-colors">
                  {t('about')}
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-pearl/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-pearl/50">
            <p>© 2025 DEESSE PEARLS. {t('allRightsReserved')}</p>
            <div className="flex gap-4">
              <Link to="/legal" className="hover:text-gold transition-colors">
                {t('legalNotice')}
              </Link>
              <Link to="/privacy" className="hover:text-gold transition-colors">
                {t('privacyPolicy')}
              </Link>
              <Link to="/terms" className="hover:text-gold transition-colors">
                {t('termsOfSale')}
              </Link>
              <Link to="/admin/login" className="hover:text-pearl/70 transition-colors opacity-50">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
