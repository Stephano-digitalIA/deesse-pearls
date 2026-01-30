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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, MapPin, Package, LogOut, Save } from 'lucide-react';
import { getCountriesWithPriority, normalizeCountryToCode, getCountryName, Language, PRIORITY_COUNTRY_CODES, shippingTranslations } from '@/data/shippingTranslations';
import OrderCard from '@/components/OrderCard';

interface OrderForDisplay {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  shipping_address: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  order_items: {
    id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

const Account: React.FC = () => {
  const { user, session, isLoading } = useAuth();
  const { t, language, formatPrice } = useLocale();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [orders, setOrders] = useState<OrderForDisplay[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('FR'); // Use country code

  useEffect(() => {
    // Avoid bouncing back to /auth while OAuth session is still being persisted.
    if (!isLoading && !user && !session) {
      navigate('/auth', { replace: true });
    }
  }, [user, session, isLoading, navigate]);

  useEffect(() => {
    if (user?.id) {
      console.log('[Account] User detected, loading data...', user.id);
      fetchProfile();
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) {
      setIsLoadingData(false);
      return;
    }

    console.log('[Account] Fetching profile for user:', user.id);

    // Safety timeout: force loading false after 8 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('[Account] Profile fetch timeout after 8s');
      setIsLoadingData(false);
    }, 8000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[Account] Profile result:', { data, error: error?.message });

      if (error) {
        console.error('[Account] Profile fetch error:', error);
      }

      if (data) {
        setProfile(data);
        setFirstName(data.first_name || user.user_metadata?.first_name || '');
        setLastName(data.last_name || user.user_metadata?.last_name || '');
        setPhone(data.phone || '');
        setAddressLine1(data.address_line1 || '');
        setAddressLine2(data.address_line2 || '');
        setCity(data.city || '');
        setPostalCode(data.postal_code || '');
        setCountry(normalizeCountryToCode(data.country || 'FR'));
      } else {
        console.log('[Account] No profile found, using user metadata');
        setFirstName(user.user_metadata?.first_name || '');
        setLastName(user.user_metadata?.last_name || '');
      }
    } catch (e) {
      console.error('[Account] fetchProfile error:', e);
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoadingData(false);
    }
  };

  const fetchOrders = async () => {
    if (!user?.id) {
      setIsLoadingOrders(false);
      return;
    }

    console.log('[Account] Fetching orders for user:', user.id);

    // Safety timeout: force loading false after 8 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('[Account] Orders fetch timeout after 8s');
      setIsLoadingOrders(false);
    }, 8000);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[Account] Orders query result:', {
        count: data?.length,
        error: error?.message,
        firstOrder: data?.[0]?.order_number
      });

      if (error) {
        console.error('[Account] Error fetching orders:', error);
        return;
      }

      const displayOrders: OrderForDisplay[] = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        created_at: order.created_at,
        shipping_address: {
          line1: order.shipping_address,
        },
        order_items: (order.order_items || []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      }));

      console.log('[Account] Mapped orders:', displayOrders.length);
      setOrders(displayOrders);
    } catch (e) {
      console.error('[Account] fetchOrders error:', e);
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city: city,
          postal_code: postalCode,
          country: country,
        })
        .eq('user_id', user.id)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) throw error;

      toast({
        title: t('profileUpdated'),
        description: t('infoSaved'),
      });
    } catch (e) {
      console.error('[Account] Save error:', e);
      toast({
        title: t('error'),
        description: t('cannotSaveProfile'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    console.log('[Account] Forcing immediate logout...');
    localStorage.clear();
    sessionStorage.clear();
    try { indexedDB.deleteDatabase('supabase'); } catch {}
    supabase.auth.signOut().catch(() => {});
    window.location.href = '/';
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

  // Show name immediately from user_metadata (available before profile loads)
  const welcomeName = user?.user_metadata?.first_name || firstName || user?.email?.split('@')[0] || '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-pearl">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <p className="text-muted-foreground animate-pulse">{t('loading')}…</p>
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
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/20"
        >
          <h1 className="font-display text-2xl md:text-3xl font-semibold mb-1">
            {t('welcome')} <span className="text-gold">{welcomeName}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </motion.div>

        {/* Header with logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">
              {t('myAccount')}
            </h2>
            {isLoadingData && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('loadingProfile')}
              </p>
            )}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('lastName')}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addressLine2">{t('addressComplement')}</Label>
                    <Input
                      id="addressLine2"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('city')}</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t('postalCode')}</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="country">{t('country')}</Label>
                    <Select
                      value={country}
                      onValueChange={setCountry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={shippingTranslations[language as Language]?.selectCountry || 'Select a country'}>
                          {country ? getCountryName(country, language as Language) : (shippingTranslations[language as Language]?.selectCountry || 'Select a country')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {getCountriesWithPriority(language as Language).map((c, index) => (
                          <SelectItem
                            key={c.code}
                            value={c.code}
                            className={c.isPriority && index === PRIORITY_COUNTRY_CODES.length - 1 ? 'border-b border-border mb-1' : ''}
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <CardDescription>
                  {isLoadingOrders
                    ? t('loading') + '...'
                    : orders.length > 0
                      ? `${orders.length} commande${orders.length > 1 ? 's' : ''}`
                      : t('noOrdersYet')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  </div>
                ) : orders.length === 0 ? (
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
                      <OrderCard
                        key={order.id}
                        order={order}
                        getStatusLabel={getStatusLabel}
                        getStatusColor={getStatusColor}
                        getDateLocale={getDateLocale}
                        formatPrice={formatPrice}
                        t={t}
                      />
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
