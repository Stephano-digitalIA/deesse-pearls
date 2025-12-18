import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ: React.FC = () => {
  const { t } = useLocale();

  const faqCategories = [
    {
      title: 'Les Perles de Tahiti',
      questions: [
        {
          q: 'Qu\'est-ce qu\'une perle de Tahiti ?',
          a: 'La perle de Tahiti est une perle de culture produite par l\'huître Pinctada margaritifera dans les lagons de Polynésie française. Elle se distingue par ses couleurs naturelles uniques allant du gris argenté au noir profond, avec des reflets verts, bleus, aubergine ou paon.',
        },
        {
          q: 'Comment sont classées les perles de Tahiti ?',
          a: 'Les perles sont classées selon plusieurs critères : la forme (ronde, semi-ronde, baroque, cerclée), le lustre (brillance), la surface (défauts visibles), la taille (diamètre en mm) et la couleur. Les grades vont de A (qualité commerciale) à AAAA (qualité exceptionnelle gemme).',
        },
        {
          q: 'Quelle est la différence entre les qualités AA, AAA et AAAA ?',
          a: 'AA : Bon lustre, quelques imperfections visibles. AAA : Excellent lustre, surface très propre avec de légères imperfections. AAAA : Lustre exceptionnel, surface parfaite, forme parfaitement ronde. Plus le grade est élevé, plus la perle est rare et précieuse.',
        },
        {
          q: 'Comment entretenir mes perles de Tahiti ?',
          a: 'Les perles sont délicates. Évitez le contact avec les parfums, cosmétiques et produits chimiques. Essuyez-les avec un chiffon doux après chaque port. Rangez-les séparément dans une pochette en tissu. Faites-les renfiler tous les 2-3 ans si portées régulièrement.',
        },
        {
          q: 'Les perles de Tahiti sont-elles vraiment noires ?',
          a: 'Les perles de Tahiti ne sont pas vraiment noires mais présentent des nuances de gris foncé avec des reflets colorés appelés "orient". Ces reflets peuvent être verts (peacock), bleus, roses, aubergine ou cuivrés, ce qui les rend uniques.',
        },
      ],
    },
    {
      title: 'Tailles & Mesures',
      questions: [
        {
          q: 'Comment choisir ma taille de bague ?',
          a: 'Mesurez le diamètre intérieur d\'une bague qui vous va bien, ou utilisez un baguier. Les tailles françaises vont de 46 à 62 (correspondant au diamètre en mm × π). En cas de doute, optez pour la taille supérieure car il est plus facile de faire réduire.',
        },
        {
          q: 'Comment mesurer mon tour de poignet pour un bracelet ?',
          a: 'Enroulez un mètre ruban souple autour de votre poignet, à l\'endroit où vous portez habituellement un bracelet. Ajoutez 1 à 2 cm pour le confort. Les tailles standard vont de 16 cm (petit) à 20 cm (grand).',
        },
        {
          q: 'Quelle longueur de collier choisir ?',
          a: '38-40 cm : Ras de cou, près du cou. 42-45 cm : Longueur princesse, au niveau des clavicules (le plus populaire). 50-55 cm : Longueur matinée, au-dessus de la poitrine. 80-100 cm : Sautoir, peut être doublé.',
        },
        {
          q: 'Quel diamètre de perle choisir ?',
          a: 'Les perles de Tahiti mesurent généralement de 8 à 16 mm. 8-10 mm : Élégant et discret, idéal pour tous les jours. 11-13 mm : Taille classique, présence notable. 14-16 mm : Perles exceptionnelles pour les grandes occasions.',
        },
        {
          q: 'Puis-je faire ajuster la taille de mon bijou ?',
          a: 'Oui, nous proposons un service d\'ajustement. Les bagues peuvent être agrandies ou réduites de 1-2 tailles. Les bracelets et colliers peuvent être rallongés ou raccourcis. Contactez-nous pour un devis gratuit.',
        },
      ],
    },
    {
      title: 'Livraison',
      questions: [
        {
          q: 'Quels sont les délais de livraison ?',
          a: 'France métropolitaine : 3-5 jours ouvrés. Europe : 5-7 jours ouvrés. International : 7-14 jours ouvrés. Les créations sur mesure nécessitent un délai supplémentaire de 2-4 semaines.',
        },
        {
          q: 'Comment sont expédiés les bijoux ?',
          a: 'Tous nos bijoux sont expédiés dans un écrin luxe DEESSE PEARLS, dans un emballage sécurisé et discret. L\'envoi est assuré et suivi. Vous recevrez un numéro de suivi par email dès l\'expédition.',
        },
        {
          q: 'Livrez-vous à l\'international ?',
          a: 'Oui, nous livrons dans le monde entier. Les frais de livraison et délais varient selon la destination. Les droits de douane éventuels sont à la charge du destinataire.',
        },
        {
          q: 'Ma commande est-elle assurée ?',
          a: 'Oui, toutes nos expéditions sont assurées à 100% de la valeur. En cas de perte ou de dommage pendant le transport, nous procédons au remplacement ou au remboursement intégral.',
        },
        {
          q: 'Puis-je suivre ma commande ?',
          a: 'Absolument. Dès l\'expédition, vous recevez un email avec le numéro de suivi et un lien vers le site du transporteur pour suivre votre colis en temps réel.',
        },
      ],
    },
    {
      title: 'Retours & Garantie',
      questions: [
        {
          q: 'Quelle est votre politique de retour ?',
          a: 'Vous disposez de 14 jours après réception pour retourner votre article. Le bijou doit être dans son état d\'origine, non porté, avec son écrin et son certificat. Le remboursement est effectué sous 5 jours ouvrés après réception du retour.',
        },
        {
          q: 'Comment effectuer un retour ?',
          a: 'Contactez notre service client pour obtenir une autorisation de retour. Renvoyez le bijou dans son emballage d\'origine, en recommandé avec assurance. Les frais de retour sont à votre charge sauf en cas de défaut.',
        },
        {
          q: 'Quelle garantie sur les bijoux ?',
          a: 'Tous nos bijoux bénéficient d\'une garantie de 2 ans couvrant les défauts de fabrication. Cette garantie ne couvre pas l\'usure normale, les dommages accidentels ou un mauvais entretien.',
        },
        {
          q: 'Puis-je échanger mon bijou ?',
          a: 'Oui, l\'échange est possible dans les 14 jours suivant la réception. Si le nouveau bijou est plus cher, vous réglez la différence. S\'il est moins cher, nous vous remboursons la différence.',
        },
        {
          q: 'Que faire si mon bijou est endommagé ?',
          a: 'Contactez immédiatement notre service client avec des photos du dommage. Si le bijou est arrivé endommagé, nous procédons au remplacement. Pour les dommages ultérieurs, nous proposons un service de réparation.',
        },
      ],
    },
    {
      title: 'Paiement & Sécurité',
      questions: [
        {
          q: 'Quels moyens de paiement acceptez-vous ?',
          a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, et le virement bancaire. Toutes les transactions sont sécurisées par cryptage SSL.',
        },
        {
          q: 'Le paiement en plusieurs fois est-il possible ?',
          a: 'Oui, nous proposons le paiement en 3 ou 4 fois sans frais via notre partenaire pour les commandes supérieures à 300€. Cette option est disponible au moment du paiement.',
        },
        {
          q: 'Mes données bancaires sont-elles sécurisées ?',
          a: 'Absolument. Nous utilisons un système de paiement sécurisé SSL avec cryptage 256 bits. Vos données bancaires ne sont jamais stockées sur nos serveurs.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-r from-deep-black to-lagoon-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <HelpCircle className="w-8 h-8 text-gold" />
            <h1 className="font-display text-4xl md:text-5xl text-pearl">
              {t('faq')}
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-pearl/70"
          >
            Trouvez les réponses à vos questions
          </motion.p>
          <div className="w-20 h-1 bg-gold mx-auto mt-6" />
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="mb-12"
            >
              <h2 className="font-display text-2xl mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm">
                  {categoryIndex + 1}
                </span>
                {category.title}
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {category.questions.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${categoryIndex}-${index}`}
                    className="bg-card border border-border rounded-lg px-6 data-[state=open]:border-gold/50"
                  >
                    <AccordionTrigger className="text-left hover:text-gold hover:no-underline py-4">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16 p-8 bg-secondary rounded-lg"
          >
            <h3 className="font-display text-2xl mb-4">Vous n'avez pas trouvé votre réponse ?</h3>
            <p className="text-muted-foreground mb-6">
              Notre équipe est à votre disposition pour répondre à toutes vos questions.
            </p>
            <Link to="/contact">
              <Button className="bg-gold hover:bg-gold-light text-deep-black">
                {t('contactUs')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
