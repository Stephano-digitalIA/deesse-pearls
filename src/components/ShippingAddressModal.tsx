import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, User, Mail, Phone, Home, Building, MapPinned, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useUserProfile, ShippingAddress } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { shippingTranslations, getCountriesWithPriority, Language, normalizeCountryToCode, getCountryName, PRIORITY_COUNTRY_CODES } from '@/data/shippingTranslations';

interface ShippingAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ShippingAddressModal: React.FC<ShippingAddressModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { saveProfile } = useUserProfile();
  const { user } = useAuth();
  const { language } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openCountrySelect, setOpenCountrySelect] = useState(false);

  // Get translations for current language
  const ts = shippingTranslations[language as Language] || shippingTranslations.fr;

  // Get countries list for current language (with priority countries at top)
  const countries = useMemo(() => getCountriesWithPriority(language as Language), [language]);

  const [formData, setFormData] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'FR', // Use country code
  });

  // Charger le profil directement depuis Supabase quand le modal s'ouvre
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const userId = user.id;
    const userEmail = user.email || '';
    const userFirstName = user.user_metadata?.first_name || '';
    const userLastName = user.user_metadata?.last_name || '';

    const loadProfileData = async () => {
      console.log('[ShippingModal] Loading profile for user:', userId);
      setErrors({});

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, address_line1, address_line2, city, postal_code, country')
          .eq('user_id', userId)
          .maybeSingle();

        console.log('[ShippingModal] Profile query result:', { data, error: error?.message });

        if (error) {
          console.error('[ShippingModal] Profile load error:', error);
        }

        const countryCode = normalizeCountryToCode(data?.country || 'FR');

        const newFormData = {
          firstName: data?.first_name || userFirstName,
          lastName: data?.last_name || userLastName,
          email: userEmail,
          phone: data?.phone || '',
          addressLine1: data?.address_line1 || '',
          addressLine2: data?.address_line2 || '',
          city: data?.city || '',
          postalCode: data?.postal_code || '',
          country: countryCode,
        };

        console.log('[ShippingModal] Setting formData:', newFormData);
        setFormData(newFormData);
      } catch (e) {
        console.error('[ShippingModal] Error:', e);
        // Fallback to user metadata
        setFormData({
          firstName: userFirstName,
          lastName: userLastName,
          email: userEmail,
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          postalCode: '',
          country: 'FR',
        });
      }
    };

    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = ts.fieldRequired;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = ts.fieldRequired;
    }
    if (!formData.email.trim()) {
      newErrors.email = ts.fieldRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ts.invalidEmail;
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = ts.fieldRequired;
    }
    if (!formData.city.trim()) {
      newErrors.city = ts.fieldRequired;
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = ts.fieldRequired;
    }
    if (!formData.country) {
      newErrors.country = ts.fieldRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(ts.formHasErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await saveProfile(formData);

      toast.success(ts.addressSaved);
      onConfirm();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(ts.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal Container - Centers the modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 pointer-events-none">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto w-full h-full sm:h-auto sm:max-w-[500px] sm:max-h-[90vh] bg-card sm:rounded-xl shadow-elegant flex flex-col overflow-hidden"
            >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-border">
              <h2 className="font-display text-xl flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold" />
                {ts.shippingAddressTitle}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain">
              <div className="space-y-4 pb-2">
                {/* Nom & Prénom */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ts.firstName} *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ts.lastName} *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {ts.email} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {ts.phone}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className="flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    {ts.address} *
                  </Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className={errors.addressLine1 ? 'border-destructive' : ''}
                  />
                  {errors.addressLine1 && (
                    <p className="text-xs text-destructive">{errors.addressLine1}</p>
                  )}
                </div>

                {/* Complément d'adresse */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine2" className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {ts.addressOptional}
                  </Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                  />
                </div>

                {/* Ville & Code postal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="flex items-center gap-1">
                      <MapPinned className="w-3 h-3" />
                      {ts.postalCode} *
                    </Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      className={errors.postalCode ? 'border-destructive' : ''}
                    />
                    {errors.postalCode && (
                      <p className="text-xs text-destructive">{errors.postalCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {ts.city} *
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* Pays */}
                <div className="space-y-2">
                  <Label htmlFor="country">{ts.country} *</Label>
                  <Popover open={openCountrySelect} onOpenChange={setOpenCountrySelect}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCountrySelect}
                        className={cn(
                          "w-full justify-between",
                          errors.country && "border-destructive",
                          !formData.country && "text-muted-foreground"
                        )}
                      >
                        {formData.country
                          ? getCountryName(formData.country, language as Language)
                          : ts.selectCountry}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder={ts.selectCountry} />
                        <CommandList>
                          <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                          <CommandGroup>
                            {countries.map((c, index) => (
                              <CommandItem
                                key={c.code}
                                value={`${c.code}|${c.name}`}
                                onSelect={() => {
                                  handleChange('country', c.code);
                                  setOpenCountrySelect(false);
                                }}
                                className={c.isPriority && index === PRIORITY_COUNTRY_CODES.length - 1 ? 'border-b border-border mb-1' : ''}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.country === c.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.country && (
                    <p className="text-xs text-destructive">{errors.country}</p>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 md:p-6 border-t border-border space-y-3 bg-card">
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {ts.saving}
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    {ts.confirmAndPay}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="w-full"
              >
                {ts.cancel}
              </Button>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShippingAddressModal;
