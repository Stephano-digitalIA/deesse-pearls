import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
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

  // Pre-fill form with user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      // First, use user metadata for instant display
      const metadata = user.user_metadata || {};
      const metaFirstName = metadata.first_name || metadata.given_name || metadata.name?.split(' ')[0] || '';
      const metaLastName = metadata.last_name || metadata.family_name || metadata.name?.split(' ').slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || metaFirstName,
        lastName: prev.lastName || metaLastName,
        email: prev.email || user.email || '',
      }));

      // Then, load full profile from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || prev.firstName,
          lastName: profile.last_name || prev.lastName,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
        }));
      }
    };

    loadUserProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('1. Saving to DB...');

      // Save to Supabase
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user?.id || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
        });

      console.log('2. DB result:', dbError ? dbError : 'OK');

      console.log('3. Calling Edge Function...');

      // Send email notification via Edge Function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        },
      });

      console.log('4. Edge Function result:', { emailData, emailError });

      if (emailError) {
        console.error('Email Error:', emailError);
        toast.error(pageT.messageError || 'Une erreur est survenue');
      } else {
        toast.success(pageT.messageSent);
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
      }
    } catch (error) {
      console.error('5. Catch Error:', error);
      toast.error(pageT.messageError || 'Une erreur est survenue');
    }

    setIsSubmitting(false);
    console.log('6. Done');
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
            className="font-display text-4xl md:text-5xl text-pearl mb-4"
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

              <div className="pt-6">
                <h3 className="font-display text-xl mb-4">{t('followUs')}</h3>
                <div className="flex gap-4">
                  {['Facebook', 'Instagram', 'Pinterest'].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-gold hover:text-deep-black hover:border-gold transition-colors"
                    >
                      {social[0]}
                    </a>
                  ))}
                </div>
              </div>
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
