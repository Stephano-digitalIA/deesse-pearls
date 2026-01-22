import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { resolveImagePath } from '@/lib/utils';

const CartDrawer: React.FC = () => {
  const { items, removeItem, updateQuantity, subtotal, shippingCost, total, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const { user } = useAuth();
  const { t, formatPrice } = useLocale();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isPaypalLoading, setIsPaypalLoading] = useState(false);

  const handleCheckout = async () => {
    if (isLoading || items.length === 0) return;

    // Check if user is logged in
    if (!user) {
      toast.error(t('pleaseLoginToCheckout') || 'Veuillez vous connecter pour passer commande');
      setIsCartOpen(false);
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const checkoutData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image ? `${window.location.origin}${item.image}` : null,
          variant: item.variant,
        })),
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment-cancelled`,
      };

      console.log('Checkout data:', checkoutData);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: checkoutData,
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      if (!data?.url) {
        console.error('No checkout URL in response:', data);
        throw new Error('NO_CHECKOUT_URL');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      console.error('Error details:', error?.message, error?.context, error?.details);
      toast.error(t('checkoutError') || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaypalCheckout = async () => {
    if (isPaypalLoading || items.length === 0) return;

    // Check if user is logged in
    if (!user) {
      toast.error(t('pleaseLoginToCheckout') || 'Veuillez vous connecter pour passer commande');
      setIsCartOpen(false);
      navigate('/auth');
      return;
    }

    setIsPaypalLoading(true);
    try {
      const checkoutData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image ? `${window.location.origin}${item.image}` : null,
          variant: item.variant,
        })),
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment-success?paypal=true`,
        cancelUrl: `${window.location.origin}/payment-cancelled`,
      };

      const { data, error } = await supabase.functions.invoke('create-paypal-checkout', {
        body: checkoutData,
      });

      if (error) {
        console.error('PayPal function error:', error);
        throw error;
      }
      if (!data?.url) {
        console.error('No PayPal URL in response:', data);
        throw new Error('NO_PAYPAL_URL');
      }

      // Redirect to PayPal Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('PayPal checkout error:', error);
      toast.error(t('checkoutError') || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsPaypalLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep-black/50 z-50"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-elegant z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-xl flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold" />
                {t('cart')}
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{t('emptyCart')}</p>
                  <Button
                    onClick={() => setIsCartOpen(false)}
                    variant="outline"
                    className="border-gold text-gold hover:bg-gold hover:text-deep-black"
                  >
                    {t('continueShopping')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.variant}-${item.size}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 p-3 bg-muted/30 rounded-lg"
                    >
                      <img
                        src={resolveImagePath(item.image)}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm font-medium truncate">{item.name}</h3>
                        {(item.variant || item.size || item.quality) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {[item.variant, item.size, item.quality].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        <p className="text-gold font-semibold mt-1">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-xs text-destructive hover:underline"
                          >
                            {t('remove')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('shipping')}</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-display font-semibold pt-2 border-t border-border">
                    <span>{t('total')}</span>
                    <span className="text-gold">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Checkout buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading || isPaypalLoading}
                    className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('processing') || 'Traitement...'}
                      </>
                    ) : (
                      t('checkout')
                    )}
                  </Button>

                  <Button
                    onClick={handlePaypalCheckout}
                    disabled={isLoading || isPaypalLoading}
                    className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold"
                  >
                    {isPaypalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('processing') || 'Traitement...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.64h6.304c2.098 0 3.744.44 4.893 1.307 1.178.888 1.753 2.18 1.71 3.839-.097 3.777-2.62 5.863-7.094 5.863H9.347l-.96 6.048a.64.64 0 0 1-.633.54h-.678v.66zm9.354-14.876c-.06.436-.147.87-.26 1.298-.896 3.413-3.178 4.966-6.78 4.966H8.068l-1.026 6.497h2.377l.82-5.18a.77.77 0 0 1 .757-.64h.91c3.428 0 6.08-1.574 6.859-4.852.324-1.364.21-2.519-.335-3.089z"/>
                        </svg>
                        PayPal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
