import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, MapPin, Package, LogOut, Save } from 'lucide-react';
import { z } from 'zod';

// Validation schema for profile
const profileSchema = z.object({
  first_name: z.string().max(50, 'First name too long').optional().nullable(),
  last_name: z.string().max(50, 'Last name too long').optional().nullable(),
  phone: z.string().regex(/^[+0-9\s()-]{0,20}$/, 'Invalid phone format').optional().nullable().or(z.literal('')),
  address_line1: z.string().max(200, 'Address too long').optional().nullable(),
  address_line2: z.string().max(200, 'Address too long').optional().nullable(),
  city: z.string().max(100, 'City name too long').optional().nullable(),
  postal_code: z.string().max(10, 'Postal code too long').optional().nullable(),
  country: z.string().max(100, 'Country name too long').optional().nullable(),
});
interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

const Account: React.FC = () => {
  const { user, session, isLoading, signOut } = useAuth();
  const { t, language, formatPrice } = useLocale();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('France');

  useEffect(() => {
    // Avoid bouncing back to /auth while OAuth session is still being persisted.
    if (!isLoading && !user && !session) {
      navigate('/auth', { replace: true });
    }
  }, [user, session, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOrders();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setPhone(data.phone || '');
      setAddressLine1(data.address_line1 || '');
      setAddressLine2(data.address_line2 || '');
      setCity(data.city || '');
      setPostalCode(data.postal_code || '');
      setCountry(data.country || 'France');
    }
    setIsLoadingData(false);
  };

  const fetchOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation
    const profileData = {
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
      address_line1: addressLine1 || null,
      address_line2: addressLine2 || null,
      city: city || null,
      postal_code: postalCode || null,
      country: country || null,
    };

    const validationResult = profileSchema.safeParse(profileData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: t('error'),
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', user.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: t('error'),
        description: t('cannotSaveProfile'),
        variant: "destructive",
      });
    } else {
      toast({
        title: t('profileUpdated'),
        description: t('infoSaved'),
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('orderPending'),
      confirmed: t('orderConfirmed'),
      shipped: t('orderShipped'),
      delivered: t('orderDelivered'),
      cancelled: t('orderCancelled'),
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDateLocale = () => {
    const locales: Record<string, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      de: 'de-DE',
      es: 'es-ES',
      pt: 'pt-PT',
      it: 'it-IT',
      nl: 'nl-NL',
      ja: 'ja-JP',
      ko: 'ko-KR',
    };
    return locales[language] || 'fr-FR';
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-pearl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-4xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
              {t('myAccount')}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('logout')}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gold data-[state=active]:text-deep-black">
              <User className="w-4 h-4 mr-2" />
              {t('profile')}
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-gold data-[state=active]:text-deep-black">
              <Package className="w-4 h-4 mr-2" />
              {t('orders')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gold" />
                    {t('personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('firstName')}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Marie"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('lastName')}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gold" />
                    {t('shippingAddress')}
                  </CardTitle>
                  <CardDescription>
                    {t('shippingAddressDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addressLine1">{t('address')}</Label>
                    <Input
                      id="addressLine1"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Rue de la Perle"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addressLine2">{t('addressComplement')}</Label>
                    <Input
                      id="addressLine2"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Appartement, étage, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('city')}</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t('postalCode')}</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="country">{t('country')}</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="France"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full md:w-auto bg-gold hover:bg-gold-dark text-deep-black font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('saveChanges')}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gold" />
                  {t('orderHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('noOrdersYet')}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/shop')}
                    >
                      {t('discoverShop')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-semibold">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString(getDateLocale(), {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gold">{formatPrice(order.total)}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Account;
