import React from 'react';
import { motion } from 'framer-motion';
import { Award, Heart, Gem, Users } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const About: React.FC = () => {
  const { t } = useLocale();

  const values = [
    { icon: Gem, title: 'Excellence', description: 'Chaque perle est sélectionnée avec le plus grand soin pour garantir une qualité exceptionnelle.' },
    { icon: Heart, title: 'Passion', description: 'Plus de 25 ans de passion pour les perles de Tahiti et la création de bijoux uniques.' },
    { icon: Award, title: 'Authenticité', description: 'Certificat d\'authenticité fourni avec chaque création, garantissant l\'origine de nos perles.' },
    { icon: Users, title: 'Service', description: 'Un accompagnement personnalisé pour vous aider à trouver le bijou parfait.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-deep-black via-deep-black to-lagoon-dark py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gold/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-lagoon/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-6xl text-pearl mb-6"
          >
            {t('about')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-tangerine italic text-3xl md:text-4xl text-gold"
          >
            {t('heroTitle')}
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl md:text-4xl mb-6">Notre Histoire</h2>
              <div className="w-20 h-1 bg-gold mb-8" />
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Depuis plus de 25 ans, DEESSE PEARLS perpétue l'art de la création joaillière 
                  autour des légendaires perles de Tahiti. Notre voyage a commencé dans les lagons 
                  cristallins de la Polynésie française, berceau de ces trésors naturels aux 
                  reflets incomparables.
                </p>
                <p>
                  Fondée par une créatrice passionnée, notre maison s'est construite sur une 
                  philosophie simple : révéler la beauté naturelle de chaque perle à travers 
                  des créations d'exception. Chaque bijou raconte une histoire, celle d'une 
                  perle unique née au cœur de l'océan Pacifique.
                </p>
                <p>
                  Aujourd'hui, nous sommes fiers d'avoir accompagné des milliers de clients 
                  dans le monde entier, perpétuant la tradition joaillière polynésienne tout 
                  en innovant constamment dans nos créations.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-gradient-to-br from-lagoon/20 to-gold/20 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-tangerine italic text-6xl text-gold mb-4">25+</p>
                    <p className="font-display text-xl">{t('designer25Years')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl mb-4">Nos Valeurs</h2>
            <div className="w-20 h-1 bg-gold mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 bg-card rounded-lg border border-border"
              >
                <value.icon className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="font-display text-xl mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-deep-black text-pearl">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-6">{t('dreamJewelry')}</h2>
          <p className="text-pearl/70 mb-8 max-w-2xl mx-auto">
            Découvrez notre collection ou créez le bijou de vos rêves avec notre service de personnalisation sur mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-deep-black">
                {t('discoverCollection')}
              </Button>
            </Link>
            <Link to="/customization">
              <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-deep-black">
                {t('customCreation')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
