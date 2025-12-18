import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { faqTranslations } from '@/data/faqTranslations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ: React.FC = () => {
  const { t, language } = useLocale();
  const faqT = faqTranslations[language] || faqTranslations.fr;

  const faqCategories = [
    {
      title: faqT.faqCat1,
      questions: [
        { q: faqT.faq1q1, a: faqT.faq1a1 },
        { q: faqT.faq1q2, a: faqT.faq1a2 },
        { q: faqT.faq1q3, a: faqT.faq1a3 },
        { q: faqT.faq1q4, a: faqT.faq1a4 },
        { q: faqT.faq1q5, a: faqT.faq1a5 },
      ],
    },
    {
      title: faqT.faqCat2,
      questions: [
        { q: faqT.faq2q1, a: faqT.faq2a1 },
        { q: faqT.faq2q2, a: faqT.faq2a2 },
        { q: faqT.faq2q3, a: faqT.faq2a3 },
        { q: faqT.faq2q4, a: faqT.faq2a4 },
        { q: faqT.faq2q5, a: faqT.faq2a5 },
      ],
    },
    {
      title: faqT.faqCat3,
      questions: [
        { q: faqT.faq3q1, a: faqT.faq3a1 },
        { q: faqT.faq3q2, a: faqT.faq3a2 },
        { q: faqT.faq3q3, a: faqT.faq3a3 },
        { q: faqT.faq3q4, a: faqT.faq3a4 },
        { q: faqT.faq3q5, a: faqT.faq3a5 },
      ],
    },
    {
      title: faqT.faqCat4,
      questions: [
        { q: faqT.faq4q1, a: faqT.faq4a1 },
        { q: faqT.faq4q2, a: faqT.faq4a2 },
        { q: faqT.faq4q3, a: faqT.faq4a3 },
        { q: faqT.faq4q4, a: faqT.faq4a4 },
        { q: faqT.faq4q5, a: faqT.faq4a5 },
      ],
    },
    {
      title: faqT.faqCat5,
      questions: [
        { q: faqT.faq5q1, a: faqT.faq5a1 },
        { q: faqT.faq5q2, a: faqT.faq5a2 },
        { q: faqT.faq5q3, a: faqT.faq5a3 },
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
            {faqT.faqSubtitle}
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
            <h3 className="font-display text-2xl mb-4">{faqT.faqNotFound}</h3>
            <p className="text-muted-foreground mb-6">
              {faqT.faqNotFoundDesc}
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
