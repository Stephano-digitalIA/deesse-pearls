import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { resolveImagePath } from '@/lib/utils';
import ShippingAddressModal from '@/components/ShippingAddressModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CartDrawer: React.FC = () => {
  const { items, removeItem, updateQuantity, subtotal, shippingCost, total, isCartOpen, setIsCartOpen } = useCart();
  const { t, formatPrice } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleCheckout = () => {
    // Check if user is authenticated
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // Show shipping address modal
    setShowAddressModal(true);
  };

  const handleAddressConfirmed = () => {
    // Close modal and cart, then navigate to checkout
    setShowAddressModal(false);
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleLoginRedirect = () => {
    setShowAuthDialog(false);
    setIsCartOpen(false);
    navigate('/auth');
  };

  const handleContinueShopping = () => {
    setIsCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/shop');
  };

  return (
    <>
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
                  <ShoppingCart className="w-5 h-5 text-gold" />
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
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">{t('emptyCart')}</p>
                    <Button
                      onClick={handleContinueShopping}
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

                  {/* Checkout button */}
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                  >
                    {t('checkout')}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Shipping Address Modal */}
      <ShippingAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onConfirm={handleAddressConfirmed}
      />

      {/* Authentication Required Dialog */}
      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-gold" />
              {t('loginRequiredTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('loginRequiredForCheckout')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLoginRedirect}
              className="bg-gold hover:bg-gold-dark text-deep-black"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {t('loginNow')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CartDrawer;
