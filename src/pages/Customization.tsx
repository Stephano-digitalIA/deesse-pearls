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
import { supabase } from '@/integrations/supabase/client';

const Customization: React.FC = () => {
  const { t, language } = useLocale();
  const pageT = customizationTranslations[language] || customizationTranslations.fr;
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requestType: '',
    budgetRange: '',
    description: '',
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save to database using actual schema fields
      const { error: dbError } = await supabase
        .from('customization_requests')
        .insert({
          request_type: formData.requestType,
          budget_range: formData.budgetRange || null,
          description: formData.description,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
        });

      if (dbError) {
        console.error('Error saving customization request:', dbError);
        throw dbError;
      }

      // Send notification email to admin
      try {
        await supabase.functions.invoke('notify-customization', {
          body: formData,
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Don't fail the whole submission if email fails
      }

      toast.success(pageT.toastSuccess);
      setStep(4);
    } catch (error: any) {
      console.error('Error submitting customization request:', error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestTypes = [
    { value: 'ring', label: pageT.ring },
    { value: 'necklace', label: pageT.necklace },
    { value: 'bracelet', label: pageT.bracelet },
    { value: 'earrings', label: pageT.earrings },
    { value: 'pendant', label: pageT.pendant },
    { value: 'other', label: pageT.other },
  ];

  const budgetRanges = [
    { value: '500-1000', label: '500€ - 1000€' },
    { value: '1000-2500', label: '1000€ - 2500€' },
    { value: '2500-5000', label: '2500€ - 5000€' },
    { value: '5000+', label: '5000€+' },
  ];

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display mb-4">{pageT.step1Title}</h2>
        <p className="text-muted-foreground mb-6">{pageT.step1Desc}</p>
      </div>
      
      <div className="space-y-4">
        <Label>{pageT.jewelryTypeLabel}</Label>
        <RadioGroup
          value={formData.requestType}
          onValueChange={(value) => setFormData({ ...formData, requestType: value })}
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          {requestTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <RadioGroupItem value={type.value} id={type.value} />
              <Label htmlFor={type.value} className="cursor-pointer">{type.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button
        onClick={() => setStep(2)}
        disabled={!formData.requestType}
        className="w-full md:w-auto"
      >
        {pageT.next}
      </Button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display mb-4">{pageT.step2Title}</h2>
        <p className="text-muted-foreground mb-6">{pageT.step2Desc}</p>
      </div>

      <div className="space-y-4">
        <Label>{pageT.budgetLabel}</Label>
        <RadioGroup
          value={formData.budgetRange}
          onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
          className="grid grid-cols-2 gap-3"
        >
          {budgetRanges.map((budget) => (
            <div key={budget.value} className="flex items-center space-x-2">
              <RadioGroupItem value={budget.value} id={budget.value} />
              <Label htmlFor={budget.value} className="cursor-pointer">{budget.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{pageT.descriptionLabel}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={pageT.descriptionPlaceholder}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)}>
          {pageT.previous}
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={!formData.description}
        >
          {pageT.next}
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display mb-4">{pageT.step3Title}</h2>
        <p className="text-muted-foreground mb-6">{pageT.step3Desc}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{pageT.nameLabel}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={pageT.namePlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{pageT.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={pageT.emailPlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{pageT.phoneLabel}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={pageT.phonePlaceholder}
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => setStep(2)}>
            {pageT.previous}
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.name || !formData.email}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {pageT.sending}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {pageT.submit}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-display mb-4">{pageT.successTitle}</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {pageT.successDesc}
      </p>
      <Button onClick={() => {
        setStep(1);
        setFormData({
          requestType: '',
          budgetRange: '',
          description: '',
          name: '',
          email: '',
          phone: '',
        });
      }}>
        {pageT.newRequest}
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-pearl">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">
            {pageT.title}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {pageT.subtitle}
          </p>
        </motion.div>

        {/* Progress indicator */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? 'bg-gold' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}

        <div className="bg-card rounded-xl p-6 md:p-8 shadow-elegant">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default Customization;
