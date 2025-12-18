import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Truck, Heart, Gem, Clock, RefreshCw, Headphones } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Commitments: React.FC = () => {
  const { t } = useLocale();

  const commitments = [
    {
      icon: Award,
      title: t('authenticCertificate'),
      description: 'Chaque bijou DEESSE PEARLS est accompagné d\'un certificat d\'authenticité garantissant l\'origine polynésienne de nos perles de Tahiti. Ce document officiel atteste de la qualité et de la provenance de votre bijou.',
    },
    {
      icon: Gem,
      title: t('exceptionalQuality'),
      description: 'Nos perles sont rigoureusement sélectionnées parmi les plus belles de Polynésie française. Seules les perles présentant un lustre exceptionnel, une surface parfaite et des reflets intenses sont retenues pour nos créations.',
    },
    {
      icon: Shield,
      title: t('securePayment'),
      description: 'Vos transactions sont 100% sécurisées grâce à notre système de paiement crypté SSL. Nous acceptons les principales cartes bancaires et PayPal pour votre confort.',
    },
    {
      icon: Truck,
      title: t('freeOver'),
      description: 'Livraison sécurisée et assurée vers le monde entier. Chaque bijou est soigneusement emballé dans un écrin luxe et expédié avec suivi en temps réel.',
    },
    {
      icon: Headphones,
      title: t('responsiveService'),
      description: 'Notre équipe est à votre écoute du lundi au vendredi pour répondre à toutes vos questions. Conseil personnalisé, aide au choix, service après-vente : nous sommes là pour vous.',
    },
    {
      icon: Clock,
      title: t('artisanalProfessionalism'),
      description: 'Plus de 25 ans d\'expertise dans la création joaillière. Chaque bijou est conçu et assemblé avec passion par nos artisans qualifiés, dans le respect des traditions polynésiennes.',
    },
    {
      icon: Heart,
      title: t('customCreationAvailable'),
      description: 'Vous avez une idée précise ? Notre service de création sur mesure vous permet de concevoir le bijou de vos rêves. Nous vous accompagnons de l\'esquisse à la réalisation finale.',
    },
    {
      icon: RefreshCw,
      title: 'Garantie & Retours',
      description: 'Satisfait ou remboursé : vous disposez de 14 jours pour changer d\'avis. Garantie 2 ans sur tous nos bijoux couvrant les défauts de fabrication.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-deep-black to-lagoon-dark py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gold/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl text-pearl mb-4"
          >
            {t('commitments')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-pearl/70 max-w-2xl mx-auto"
          >
            Chez DEESSE PEARLS, nous nous engageons à vous offrir une expérience d'exception, 
            de la sélection de nos perles jusqu'à la livraison de votre bijou.
          </motion.p>
          <div className="w-20 h-1 bg-gold mx-auto mt-6" />
        </div>
      </section>

      {/* Commitments Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commitments.map((commitment, index) => (
              <motion.div
                key={commitment.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-8 rounded-lg border border-border hover:border-gold/50 transition-colors group"
              >
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                    <commitment.icon className="w-7 h-7 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl mb-3">{commitment.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{commitment.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '25+', label: 'Années d\'expertise' },
              { value: '10K+', label: 'Clients satisfaits' },
              { value: '100%', label: 'Perles authentiques' },
              { value: '14j', label: 'Droit de retour' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="font-tangerine italic text-5xl text-gold mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-deep-black text-pearl">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-6">{t('thousandsOfClients')}</h2>
          <p className="text-pearl/70 mb-8 max-w-xl mx-auto">
            Rejoignez notre communauté de clients satisfaits et découvrez l'excellence des perles de Tahiti.
          </p>
          <Link to="/shop">
            <Button size="lg" className="bg-gold hover:bg-gold-light text-deep-black">
              {t('discoverCollection')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Commitments;
