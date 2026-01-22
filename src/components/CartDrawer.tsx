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
          size: item.size,
          quality: item.quality,
        })),
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email,
        shippingCost: shippingCost,
      };

      console.log('PayPal checkout data:', checkoutData);

      const { data, error } = await supabase.functions.invoke('create-paypal-order', {
        body: checkoutData,
      });

      console.log('PayPal response:', { data, error });

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
      console.error('Error details:', error?.message, error?.context, error?.details);
      toast.error(t('checkoutError') || 'Une erreur est survenue lors du paiement');
    } finally {
      setIsLoading(false);
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
              <div className="border-t border-border p-4 pb-10 space-y-4">
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

                {/* PayPal Checkout Button - Official Branding */}
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full h-[45px] bg-[#FFC439] hover:bg-[#f0b72f] disabled:opacity-50 disabled:cursor-not-allowed rounded-[4px] flex items-center justify-center transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#003087]" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="101" height="24" viewBox="0 0 101 24">
                      <path fill="#003087" d="M12.237 2.8h-7.8c-.5 0-1 .4-1.1.9L1.137 17.8c-.1.5.3.9.8.9h3.7c.5 0 1-.4 1.1-.9l.6-3.8c.1-.5.5-.9 1.1-.9h2.5c5.1 0 8.1-2.5 8.8-7.4.3-2.1 0-3.8-1-5-1.1-1.3-3.1-1.9-5.5-1.9zm.9 7.3c-.4 2.8-2.6 2.8-4.6 2.8h-1.2l.8-5.2c.1-.3.3-.5.6-.5h.5c1.4 0 2.7 0 3.4.8.4.5.5 1.2.5 2.1z"/>
                      <path fill="#003087" d="M35.437 10h-3.7c-.3 0-.6.2-.6.5l-.2 1-.3-.4c-.8-1.2-2.6-1.6-4.4-1.6-4.1 0-7.6 3.1-8.3 7.5-.4 2.2.1 4.3 1.4 5.7 1.2 1.3 2.9 1.9 4.9 1.9 3.5 0 5.4-2.2 5.4-2.2l-.2 1c-.1.5.3.9.8.9h3.4c.5 0 1-.4 1.1-.9l2-12.5c.1-.4-.4-.9-.8-.9zm-5.4 7.2c-.4 2.1-2 3.6-4.2 3.6-1.1 0-2-.3-2.5-1-.5-.7-.7-1.6-.5-2.7.3-2.1 2.1-3.6 4.1-3.6 1.1 0 1.9.4 2.5 1 .6.8.8 1.7.6 2.7z"/>
                      <path fill="#003087" d="M55.337 10h-3.7c-.4 0-.7.2-.9.5l-5.2 7.6-2.2-7.3c-.1-.5-.6-.8-1.1-.8h-3.6c-.5 0-.9.5-.7 1l4.1 12.1-3.9 5.4c-.4.5 0 1.2.6 1.2h3.7c.4 0 .7-.2.9-.5l12.5-18c.4-.5 0-1.2-.5-1.2z"/>
                      <path fill="#009cde" d="M67.737 2.8h-7.8c-.5 0-1 .4-1.1.9l-2.2 14.1c-.1.5.3.9.8.9h4c.4 0 .7-.3.8-.7l.6-4c.1-.5.5-.9 1.1-.9h2.5c5.1 0 8.1-2.5 8.8-7.4.3-2.1 0-3.8-1-5-1.2-1.2-3.2-1.9-5.5-1.9zm.9 7.3c-.4 2.8-2.6 2.8-4.6 2.8h-1.2l.8-5.2c.1-.3.3-.5.6-.5h.5c1.4 0 2.7 0 3.4.8.4.5.6 1.2.5 2.1z"/>
                      <path fill="#009cde" d="M90.937 10h-3.7c-.3 0-.6.2-.6.5l-.2 1-.3-.4c-.8-1.2-2.6-1.6-4.4-1.6-4.1 0-7.6 3.1-8.3 7.5-.4 2.2.1 4.3 1.4 5.7 1.2 1.3 2.9 1.9 4.9 1.9 3.5 0 5.4-2.2 5.4-2.2l-.2 1c-.1.5.3.9.8.9h3.4c.5 0 1-.4 1.1-.9l2-12.5c.1-.4-.3-.9-.8-.9zm-5.3 7.2c-.4 2.1-2 3.6-4.2 3.6-1.1 0-2-.3-2.5-1-.5-.7-.7-1.6-.5-2.7.3-2.1 2.1-3.6 4.1-3.6 1.1 0 1.9.4 2.5 1 .6.8.8 1.7.6 2.7z"/>
                      <path fill="#009cde" d="M95.337 3.3l-2.3 14.3c-.1.5.3.9.8.9h3.2c.5 0 1-.4 1.1-.9l2.2-14.1c.1-.5-.3-.9-.8-.9h-3.5c-.3-.1-.5.2-.7.7z"/>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
