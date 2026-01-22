import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Shield, RotateCcw, Clock, Package, CheckCircle, MessageCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { deliveryTranslations } from '@/data/deliveryTranslations';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Delivery: React.FC = () => {
  const { language } = useLocale();
  const t = deliveryTranslations[language] || deliveryTranslations.fr;

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-r from-deep-black to-lagoon-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl text-pearl mb-4"
          >
            {t.pageTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-pearl/70 max-w-2xl mx-auto"
          >
            {t.pageSubtitle}
          </motion.p>
          <div className="w-20 h-1 bg-gold mx-auto mt-6" />
        </div>
      </section>

      {/* Delivery Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <Truck className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-3xl">{t.deliveryTitle}</h2>
                <p className="text-gold font-semibold text-lg">{t.deliveryTime}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-muted-foreground leading-relaxed">{t.deliveryDesc}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <Package className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">{t.deliveryWorldwide}</h3>
                    <p className="text-muted-foreground text-sm">{t.deliveryWorldwideDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h2 className="font-display text-3xl">{t.securityTitle}</h2>
            </div>

            <p className="text-muted-foreground mb-8 text-lg">{t.securityDesc}</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-lg border border-gold/30">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl mb-2">{t.securityGuarantee}</h3>
                    <p className="text-muted-foreground">{t.securityGuaranteeDesc}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <Package className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl mb-2">{t.securityPackaging}</h3>
                    <p className="text-muted-foreground">{t.securityPackagingDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Returns Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-gold" />
              </div>
              <h2 className="font-display text-3xl">{t.returnsTitle}</h2>
            </div>

            <p className="text-muted-foreground mb-8 text-lg">{t.returnsDesc}</p>

            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl mb-2">{t.returnsPeriod}</h3>
                    <p className="text-muted-foreground">{t.returnsPeriodDesc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-gold/30">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl mb-2">{t.returnsRefund}</h3>
                    <p className="text-muted-foreground">{t.returnsRefundDesc}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <Package className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-xl mb-2">{t.returnsConditions}</h3>
                    <p className="text-muted-foreground">{t.returnsConditionsDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-deep-black text-pearl">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <MessageCircle className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl mb-4">{t.questionsTitle}</h2>
            <p className="text-pearl/70 mb-8 max-w-xl mx-auto">{t.questionsDesc}</p>
            <Link to="/contact">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-deep-black">
                {t.contactUs}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Delivery;
