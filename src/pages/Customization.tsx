import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Upload, Send, CheckCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

const Customization: React.FC = () => {
  const { t } = useLocale();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    jewelryType: '',
    pearlType: '',
    metalType: '',
    budget: '',
    description: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Demande de personnalisation envoyée ! Nous vous contacterons sous 48h.');
    setStep(4);
  };

  const jewelryTypes = [
    { value: 'ring', label: 'Bague' },
    { value: 'necklace', label: 'Collier' },
    { value: 'bracelet', label: 'Bracelet' },
    { value: 'earrings', label: 'Boucles d\'oreilles' },
    { value: 'pendant', label: 'Pendentif' },
    { value: 'other', label: 'Autre' },
  ];

  const pearlTypes = [
    { value: 'round', label: 'Ronde - La plus classique' },
    { value: 'drop', label: 'Goutte (Drop) - Élégante' },
    { value: 'baroque', label: 'Baroque - Unique' },
    { value: 'button', label: 'Bouton - Moderne' },
    { value: 'multiple', label: 'Plusieurs perles' },
  ];

  const metalTypes = [
    { value: 'gold-18k', label: 'Or jaune 18 carats' },
    { value: 'white-gold', label: 'Or blanc 18 carats' },
    { value: 'rose-gold', label: 'Or rose 18 carats' },
    { value: 'platinum', label: 'Platine' },
  ];

  const budgets = [
    { value: '500-1000', label: '500€ - 1000€' },
    { value: '1000-2000', label: '1000€ - 2000€' },
    { value: '2000-5000', label: '2000€ - 5000€' },
    { value: '5000+', label: '5000€ et plus' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-deep-black via-lagoon-dark to-deep-black py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-72 h-72 bg-gold/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Sparkles className="w-8 h-8 text-gold" />
            <h1 className="font-display text-4xl md:text-5xl text-pearl">
              {t('customCreation')}
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-pearl/70 max-w-2xl mx-auto"
          >
            {t('dreamJewelry')} - Créez un bijou unique qui vous ressemble
          </motion.p>
          <div className="w-20 h-1 bg-gold mx-auto mt-6" />
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Progress Steps */}
          {step < 4 && (
            <div className="flex items-center justify-center mb-12">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      s <= step ? 'bg-gold text-deep-black' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-20 h-1 mx-2 ${s < step ? 'bg-gold' : 'bg-secondary'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step 1: Jewelry Type */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-8 rounded-lg border border-border"
            >
              <h2 className="font-display text-2xl mb-6">Quel type de bijou souhaitez-vous créer ?</h2>
              <RadioGroup
                value={formData.jewelryType}
                onValueChange={(value) => setFormData({ ...formData, jewelryType: value })}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                {jewelryTypes.map((type) => (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.jewelryType === type.value
                        ? 'border-gold bg-gold/10'
                        : 'border-border hover:border-gold/50'
                    }`}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    {type.label}
                  </Label>
                ))}
              </RadioGroup>

              <div className="mt-8">
                <h3 className="font-display text-xl mb-4">Type de perle</h3>
                <RadioGroup
                  value={formData.pearlType}
                  onValueChange={(value) => setFormData({ ...formData, pearlType: value })}
                  className="space-y-3"
                >
                  {pearlTypes.map((type) => (
                    <Label
                      key={type.value}
                      htmlFor={`pearl-${type.value}`}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.pearlType === type.value
                          ? 'border-gold bg-gold/10'
                          : 'border-border hover:border-gold/50'
                      }`}
                    >
                      <RadioGroupItem value={type.value} id={`pearl-${type.value}`} className="mr-3" />
                      {type.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!formData.jewelryType || !formData.pearlType}
                className="w-full mt-8 bg-gold hover:bg-gold-light text-deep-black"
              >
                Continuer
              </Button>
            </motion.div>
          )}

          {/* Step 2: Metal & Budget */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-8 rounded-lg border border-border"
            >
              <h2 className="font-display text-2xl mb-6">Choisissez le métal et votre budget</h2>
              
              <div className="mb-8">
                <h3 className="font-display text-xl mb-4">Type de métal</h3>
                <RadioGroup
                  value={formData.metalType}
                  onValueChange={(value) => setFormData({ ...formData, metalType: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  {metalTypes.map((type) => (
                    <Label
                      key={type.value}
                      htmlFor={`metal-${type.value}`}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.metalType === type.value
                          ? 'border-gold bg-gold/10'
                          : 'border-border hover:border-gold/50'
                      }`}
                    >
                      <RadioGroupItem value={type.value} id={`metal-${type.value}`} className="sr-only" />
                      {type.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="mb-8">
                <h3 className="font-display text-xl mb-4">Budget approximatif</h3>
                <RadioGroup
                  value={formData.budget}
                  onValueChange={(value) => setFormData({ ...formData, budget: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  {budgets.map((budget) => (
                    <Label
                      key={budget.value}
                      htmlFor={`budget-${budget.value}`}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.budget === budget.value
                          ? 'border-gold bg-gold/10'
                          : 'border-border hover:border-gold/50'
                      }`}
                    >
                      <RadioGroupItem value={budget.value} id={`budget-${budget.value}`} className="sr-only" />
                      {budget.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="description">Décrivez votre projet (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Style souhaité, occasion, inspiration..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Retour
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.metalType || !formData.budget}
                  className="flex-1 bg-gold hover:bg-gold-light text-deep-black"
                >
                  Continuer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card p-8 rounded-lg border border-border"
            >
              <h2 className="font-display text-2xl mb-6">Vos coordonnées</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">{t('firstName')} *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t('lastName')} *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">{t('email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Retour
                  </Button>
                  <Button type="submit" className="flex-1 bg-gold hover:bg-gold-light text-deep-black">
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer ma demande
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-gold" />
              </div>
              <h2 className="font-display text-3xl mb-4">Demande envoyée !</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Merci pour votre demande de création sur mesure. Notre équipe vous contactera sous 48h pour discuter de votre projet.
              </p>
              <Button onClick={() => setStep(1)} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-deep-black">
                Nouvelle demande
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Customization;
