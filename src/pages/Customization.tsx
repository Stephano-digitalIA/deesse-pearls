import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { customizationTranslations } from '@/data/customizationTranslations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { createCustomizationRequest } from '@/lib/localStorage';

const Customization: React.FC = () => {
  const { t, language } = useLocale();
  const pageT = customizationTranslations[language] || customizationTranslations.fr;
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);

    try {
      // Save to localStorage
      createCustomizationRequest({
        jewelryType: formData.jewelryType,
        pearlType: formData.pearlType,
        metalType: formData.metalType,
        budget: formData.budget,
        description: formData.description || '',
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
      });

      toast.success(pageT.toastSuccess);
      setStep(4);
    } catch (error: any) {
      console.error('Error submitting customization request:', error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const jewelryTypes = [
    { value: 'ring', label: pageT.ring },
    { value: 'necklace', label: pageT.necklace },
    { value: 'bracelet', label: pageT.bracelet },
    { value: 'earrings', label: pageT.earrings },
    { value: 'pendant', label: pageT.pendant },
    { value: 'other', label: pageT.other },
  ];

  const pearlTypes = [
    { value: 'round', label: pageT.pearlRound },
    { value: 'drop', label: pageT.pearlDrop },
    { value: 'baroque', label: pageT.pearlBaroque },
    { value: 'button', label: pageT.pearlButton },
    { value: 'multiple', label: pageT.pearlMultiple },
  ];

  const metalTypes = [
    { value: 'gold-18k', label: pageT.goldYellow },
    { value: 'white-gold', label: pageT.goldWhite },
    { value: 'rose-gold', label: pageT.goldRose },
    { value: 'platinum', label: pageT.platinum },
  ];

  const budgets = [
    { value: '500-1000', label: pageT.budget1 },
    { value: '1000-2000', label: pageT.budget2 },
    { value: '2000-5000', label: pageT.budget3 },
    { value: '5000+', label: pageT.budget4 },
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
            {t('dreamJewelry')} - {pageT.heroSubtitle}
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
              <h2 className="font-display text-2xl mb-6">{pageT.step1Title}</h2>
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
                <h3 className="font-display text-xl mb-4">{pageT.pearlTypeTitle}</h3>
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
                {pageT.continue}
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
              <h2 className="font-display text-2xl mb-6">{pageT.step2Title}</h2>
              
              <div className="mb-8">
                <h3 className="font-display text-xl mb-4">{pageT.metalTypeTitle}</h3>
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
                <h3 className="font-display text-xl mb-4">{pageT.budgetTitle}</h3>
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
                <Label htmlFor="description">{pageT.descriptionLabel}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={pageT.descriptionPlaceholder}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  {pageT.back}
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.metalType || !formData.budget}
                  className="flex-1 bg-gold hover:bg-gold-light text-deep-black"
                >
                  {pageT.continue}
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
              <h2 className="font-display text-2xl mb-6">{pageT.step3Title}</h2>
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
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isSubmitting}>
                    {pageT.back}
                  </Button>
                  <Button type="submit" className="flex-1 bg-gold hover:bg-gold-light text-deep-black" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {pageT.sendRequest}
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
              <h2 className="font-display text-3xl mb-4">{pageT.successTitle}</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {pageT.successMessage}
              </p>
              <Button onClick={() => setStep(1)} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-deep-black">
                {pageT.newRequest}
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Customization;
