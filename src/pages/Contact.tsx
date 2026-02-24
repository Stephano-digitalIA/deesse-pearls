import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { aboutContactTranslations } from '@/data/aboutContactTranslations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Contact: React.FC = () => {
  const { t, language } = useLocale();
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const pageT = aboutContactTranslations[language] || aboutContactTranslations.fr;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track which fields have been prefilled to avoid overwriting user input
  const prefilledRef = useRef({ firstName: false, lastName: false, email: false, phone: false });

  // Pre-fill all fields when profile or user data becomes available
  useEffect(() => {
    console.log('[Contact] Prefill effect - profile:', profile, 'user:', user?.email, 'isProfileLoading:', isProfileLoading);

    // Pre-fill firstName
    if (!prefilledRef.current.firstName) {
      const firstName = profile?.firstName || user?.user_metadata?.first_name || '';
      if (firstName) {
        console.log('[Contact] Pre-filling firstName:', firstName);
        setFormData(prev => ({ ...prev, firstName }));
        prefilledRef.current.firstName = true;
      }
    }

    // Pre-fill lastName
    if (!prefilledRef.current.lastName) {
      const lastName = profile?.lastName || user?.user_metadata?.last_name || '';
      if (lastName) {
        console.log('[Contact] Pre-filling lastName:', lastName);
        setFormData(prev => ({ ...prev, lastName }));
        prefilledRef.current.lastName = true;
      }
    }

    // Pre-fill email
    if (!prefilledRef.current.email) {
      const email = user?.email || '';
      if (email) {
        console.log('[Contact] Pre-filling email:', email);
        setFormData(prev => ({ ...prev, email }));
        prefilledRef.current.email = true;
      }
    }

    // Pre-fill phone
    if (!prefilledRef.current.phone) {
      const phone = profile?.phone || '';
      if (phone) {
        console.log('[Contact] Pre-filling phone:', phone);
        setFormData(prev => ({ ...prev, phone }));
        prefilledRef.current.phone = true;
      }
    }
  }, [profile, user, isProfileLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Sauvegarder en DB
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user?.id || null,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
        });

      if (dbError) {
        console.error('[Contact] DB insert error:', dbError);
        toast.error(pageT.messageError || 'Une erreur est survenue');
        setIsSubmitting(false);
        return;
      }

      // 2. Envoyer l'email en arrière-plan (fire-and-forget)
      supabase.functions.invoke('send-contact-email', {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        },
      }).then(({ error }) => {
        if (error) console.error('[Contact] Email error:', error);
      });

      toast.success(pageT.messageSent);
      setFormData(prev => ({ ...prev, subject: '', message: '' }));
    } catch (error) {
      console.error('[Contact] Error:', error);
      toast.error(pageT.messageError || 'Une erreur est survenue');
    }

    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: Mail, label: pageT.emailLabel, value: 'contact@deesse-pearls.com', href: 'mailto:contact@deesse-pearls.com' },
    { icon: Phone, label: pageT.phoneLabel, value: '+689 87 78 39 47', href: 'tel:+68987783947' },
    { icon: MapPin, label: pageT.addressLabel, value: pageT.addressValue, href: '#' },
    { icon: Clock, label: pageT.hoursLabel, value: pageT.hoursValue, href: '#' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-r from-deep-black to-lagoon-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl text-white mb-4"
          >
            {t('contact')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-pearl/70"
          >
            {pageT.contactSubtitle}
          </motion.p>
          <div className="w-20 h-1 bg-gold mx-auto mt-6" />
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              <h2 className="font-display text-2xl mb-6">{pageT.ourContact}</h2>
              {contactInfo.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border hover:border-gold transition-colors group"
                >
                  <item.icon className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold group-hover:text-gold transition-colors">{item.label}</p>
                    <p className="text-muted-foreground text-sm">{item.value}</p>
                  </div>
                </a>
              ))}

            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="bg-card p-8 rounded-lg border border-border">
                <h2 className="font-display text-2xl mb-6">{t('yourMessage')}</h2>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  </div>
                  <div>
                    <Label htmlFor="subject">{pageT.subject} *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">{t('message')} *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={6}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gold hover:bg-gold-light text-deep-black"
                  >
                    {isSubmitting ? (
                      pageT.sendingMessage
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('send')}
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
