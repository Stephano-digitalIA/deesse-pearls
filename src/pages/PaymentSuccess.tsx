import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight, Package, MapPin, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLocale } from '@/contexts/LocaleContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: OrderItem[];
}

const localeMap: Record<string, string> = {
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

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const orderNumber = searchParams.get('order_number');
  const { clearCart } = useCart();
  const { t, formatPrice, language } = useLocale();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to home if user is not authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Clear cart only once on mount (not on clearCart identity change)
  const hasCleared = useRef(false);
  useEffect(() => {
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (error) {
          console.error('[PaymentSuccess] Error fetching order:', error);
        } else if (data) {
          setOrder({
            id: data.id,
            order_number: data.order_number,
            created_at: data.created_at,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            shipping_address: data.shipping_address,
            subtotal: data.subtotal,
            shipping_cost: data.shipping_cost,
            total: data.total,
            items: data.order_items || [],
          });
        }
      } catch (err) {
        console.error('[PaymentSuccess] Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Email envoyé dans Checkout.tsx (onApprove PayPal) - pas de doublon ici

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(localeMap[language] || 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>

          <h1 className="font-display text-3xl md:text-4xl mb-3">
            {t('paymentSuccessTitle') || 'Merci pour votre commande !'}
          </h1>

          <p className="text-muted-foreground">
            {t('paymentSuccessMessage') || 'Votre paiement a été effectué avec succès. Vous recevrez un email de confirmation.'}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Order Reference */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Receipt className="w-5 h-5 text-gold" />
                <h2 className="font-display text-lg">{t('orderRecap')}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('orderNumber')}</span>
                  <p className="font-mono font-medium">{order.order_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('date')}</span>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('client')}</span>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('email')}</span>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('status')}</span>
                  <p className="font-medium text-green-500">{t('orderConfirmed')}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-gold" />
                <h2 className="font-display text-lg">{t('orderedItems')}</h2>
              </div>

              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.total_price)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('shipping')}</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center font-display text-lg">
                <span>{t('total')}</span>
                <span className="text-gold">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-gold" />
                  <h2 className="font-display text-lg">{t('shippingAddress')}</h2>
                </div>

                <div className="text-sm">
                  <p>{order.shipping_address}</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : orderNumber ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-card border border-border rounded-lg p-6 text-center"
          >
            <Receipt className="w-10 h-10 text-gold mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">{t('orderLabel')} #{orderNumber}</p>
            <p className="text-muted-foreground text-sm">
              {t('orderRegisteredSuccess')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center text-muted-foreground py-8"
          >
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
            <p>{t('paymentProcessedSuccess')}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Button asChild variant="outline">
            <Link to="/account" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('viewMyOrders')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/shop" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {t('continueShopping')}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              {t('backToHome')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
