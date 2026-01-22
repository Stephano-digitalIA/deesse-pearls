import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight, Package, MapPin, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLocale } from '@/contexts/LocaleContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  name: string;
  quantity: number;
  unitAmount: number;
  total: number;
}

interface ShippingAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

interface OrderDetails {
  id: string;
  customerEmail: string | null;
  customerName: string | null;
  amountTotal: number;
  currency: string;
  paymentStatus: string;
  shippingAddress: ShippingAddress | null;
  items: OrderItem[];
  createdAt: string;
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paypalToken = searchParams.get('token');
  const { clearCart } = useCart();
  const { t } = useLocale();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const capturePayPalPayment = async () => {
      if (!paypalToken) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Capturing PayPal payment:', paypalToken);

        const { data, error } = await supabase.functions.invoke('capture-paypal-payment', {
          body: { orderId: paypalToken },
        });

        if (error) throw error;

        if (data?.order) {
          const order = data.order;
          setOrderDetails({
            id: order.id,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            amountTotal: order.total,
            currency: 'EUR',
            paymentStatus: 'paid',
            shippingAddress: order.shipping_address ? {
              line1: order.shipping_address.line1,
              line2: order.shipping_address.line2,
              city: order.shipping_address.city,
              postalCode: order.shipping_address.postal_code,
              country: order.shipping_address.country,
            } : null,
            items: order.order_items?.map((item: any) => ({
              name: item.product_name,
              quantity: item.quantity,
              unitAmount: item.unit_price,
              total: item.total_price,
            })) || [],
            createdAt: order.created_at,
          });
        }
      } catch (err) {
        console.error('Error capturing PayPal payment:', err);
        setError('Impossible de finaliser le paiement');
      } finally {
        setIsLoading(false);
      }
    };

    capturePayPalPayment();
  }, [paypalToken]);

  // Send confirmation email when order details are loaded
  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (!orderDetails || emailSent || !orderDetails.customerEmail) return;

      try {
        const { error } = await supabase.functions.invoke('send-order-confirmation', {
          body: {
            customerEmail: orderDetails.customerEmail,
            customerName: orderDetails.customerName || 'Client',
            orderNumber: orderDetails.id.slice(-8).toUpperCase(),
            orderDate: new Date(orderDetails.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
            items: orderDetails.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: Math.round(item.unitAmount * 100),
            })),
            subtotal: Math.round(orderDetails.amountTotal * 100),
            shipping: 0,
            total: Math.round(orderDetails.amountTotal * 100),
            shippingAddress: orderDetails.shippingAddress ? {
              line1: orderDetails.shippingAddress.line1,
              line2: orderDetails.shippingAddress.line2,
              city: orderDetails.shippingAddress.city,
              postal_code: orderDetails.shippingAddress.postalCode,
              country: orderDetails.shippingAddress.country,
            } : undefined,
          },
        });

        if (error) {
          console.error('Error sending confirmation email:', error);
        } else {
          console.log('Confirmation email sent successfully');
          setEmailSent(true);
        }
      } catch (err) {
        console.error('Error sending confirmation email:', err);
      }
    };

    sendConfirmationEmail();
  }, [orderDetails, emailSent]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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
        ) : error ? (
          <div className="text-center text-muted-foreground py-8">
            <p>{error}</p>
            {paypalToken && (
              <p className="text-sm mt-2">
                Référence PayPal: <span className="font-mono">{paypalToken.slice(-8).toUpperCase()}</span>
              </p>
            )}
          </div>
        ) : orderDetails ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Order Reference */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Receipt className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg">Récapitulatif de commande</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Référence</span>
                  <p className="font-mono font-medium">{orderDetails.id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{formatDate(orderDetails.createdAt)}</p>
                </div>
                {orderDetails.customerName && (
                  <div>
                    <span className="text-muted-foreground">Client</span>
                    <p className="font-medium">{orderDetails.customerName}</p>
                  </div>
                )}
                {orderDetails.customerEmail && (
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p className="font-medium">{orderDetails.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg">Articles commandés</h2>
              </div>
              
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} × {formatPrice(item.unitAmount, orderDetails.currency)}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.total, orderDetails.currency)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center font-display text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(orderDetails.amountTotal, orderDetails.currency)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {orderDetails.shippingAddress && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg">Adresse de livraison</h2>
                </div>
                
                <div className="text-sm">
                  {orderDetails.shippingAddress.line1 && <p>{orderDetails.shippingAddress.line1}</p>}
                  {orderDetails.shippingAddress.line2 && <p>{orderDetails.shippingAddress.line2}</p>}
                  <p>
                    {orderDetails.shippingAddress.postalCode} {orderDetails.shippingAddress.city}
                  </p>
                  {orderDetails.shippingAddress.country && <p>{orderDetails.shippingAddress.country}</p>}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Button asChild variant="outline">
            <Link to="/shop" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Continuer mes achats
            </Link>
          </Button>
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              Retour à l'accueil
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
