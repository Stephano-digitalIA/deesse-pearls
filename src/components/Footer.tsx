import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
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
    <footer className="bg-deep-black text-white">
      {/* Trust badges bar */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge) => (
              <div key={badge.key} className="flex items-center justify-center gap-2 text-sm">
                <span className="text-xl">{badge.icon}</span>
                <span className="font-body text-white/80">{t(badge.key)}</span>
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
            <p className="text-white/70 text-sm leading-relaxed">
              {t('designer25Years')}. {t('dreamJewelry')}.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-lg mb-4 text-gold">{t('shop')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop/perles" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('loosePearls')}
                </Link>
              </li>
              <li>
                <Link to="/shop/bracelets" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('bracelets')}
                </Link>
              </li>
              <li>
                <Link to="/shop/colliers" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('necklaces')}
                </Link>
              </li>
              <li>
                <Link to="/shop/bagues" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('rings')}
                </Link>
              </li>
              <li>
                <Link to="/shop/boucles-oreilles" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('earrings')}
                </Link>
              </li>
              <li>
                <Link to="/shop/pendentifs" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('pendants')}
                </Link>
              </li>
              <li>
                <Link to="/shop/parures" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('jewelrySets')}
                </Link>
              </li>
              <li>
                <Link to="/shop/broches" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('brooches')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer service */}
          <div>
            <h3 className="font-display text-lg mb-4 text-gold">{t('customerService')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('contactUs')}
                </Link>
              </li>
              <li>
                <Link to="/faq" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link to="/delivery" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('deliveryReturns')}
                </Link>
              </li>
              <li>
                <Link to="/commitments" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('ourCommitments')}
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={() => window.scrollTo(0, 0)} className="text-white/70 hover:text-gold transition-colors">
                  {t('about')}
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>© 2025 DEESSE PEARLS. {t('allRightsReserved')}</p>
            <div className="flex gap-4">
              <Link to="/legal" onClick={() => window.scrollTo(0, 0)} className="hover:text-gold transition-colors">
                {t('legalNotice')}
              </Link>
              <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="hover:text-gold transition-colors">
                {t('privacyPolicy')}
              </Link>
              <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-gold transition-colors">
                {t('termsOfSale')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
