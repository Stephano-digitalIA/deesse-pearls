import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useUserProfile, ShippingAddress } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Package, MapPin, Loader2, RefreshCw, Edit2 } from 'lucide-react';
import { resolveImagePath } from '@/lib/utils';
import ShippingAddressModal from '@/components/ShippingAddressModal';
import { sendOrderConfirmationEmail, sendOrderNotificationToSeller } from '@/services/emailService';
import { getCountryName, Language } from '@/data/shippingTranslations';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb';

// ============================================
// COMPOSANT PAYPAL AVEC PROTECTION CONTRE RE-RENDERS
// ============================================
const PayPalButtons: React.FC<{
  amount: number;
  orderData: {
    items: Array<{ name: string; price: number; quantity: number }>;
    subtotal: number;
    shippingCost: number;
    total: number;
    formatPrice: (price: number) => string;
    customerEmail: string;
    customerName: string;
    shippingAddress: string;
  };
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}> = ({ amount, orderData, onSuccess, onError, onCancel }) => {
  const { t } = useLocale();
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRef = useRef<any>(null);
  const isRenderedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs pour les callbacks (évite les problèmes de closure)
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);
  const amountRef = useRef(amount);
  const orderDataRef = useRef(orderData);

  // Mettre à jour les refs quand les props changent
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onCancelRef.current = onCancel;
    amountRef.current = amount;
    orderDataRef.current = orderData;
  }, [onSuccess, onError, onCancel, amount, orderData]);

  useEffect(() => {
    // Diagnostic au montage
    console.log('[PayPal] Component mounted');
    console.log('[PayPal] PAYPAL_CLIENT_ID:', PAYPAL_CLIENT_ID);
    console.log('[PayPal] window.paypal exists:', !!window.paypal);
    console.log('[PayPal] Existing script tag:', document.querySelector('script[src*="paypal"]')?.getAttribute('src'));

    // Charger le script PayPal si pas encore chargé
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Already available
        if (window.paypal) {
          console.log('[PayPal] SDK already available');
          scriptLoadedRef.current = true;
          resolve();
          return;
        }

        // Remove any stale script tag (may have loaded with errors or wrong config)
        const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
        if (existingScript) {
          console.log('[PayPal] Removing stale script tag');
          existingScript.remove();
        }

        // Timeout: reject if SDK doesn't load within 15s
        const timeout = setTimeout(() => {
          reject(new Error('PayPal SDK load timeout'));
        }, 15000);

        const script = document.createElement('script');
        // disable-funding=card force l'utilisation du popup PayPal qui gère mieux les cartes
        // L'utilisateur pourra toujours payer par carte via le popup PayPal
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR&intent=capture&components=buttons&disable-funding=card`;
        script.async = true;
        script.onload = () => {
          clearTimeout(timeout);
          console.log('[PayPal] SDK loaded, window.paypal:', typeof window.paypal);
          scriptLoadedRef.current = true;
          if (window.paypal) {
            resolve();
          } else {
            reject(new Error('PayPal SDK loaded but window.paypal is undefined'));
          }
        };
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load PayPal script'));
        };
        document.body.appendChild(script);
      });
    };

    const renderPayPalButtons = async () => {
      // PROTECTION: Si déjà rendu, ne pas re-rendre
      if (isRenderedRef.current) {
        console.log('[PayPal] Already rendered, skipping');
        return;
      }

      if (!paypalContainerRef.current) {
        console.log('[PayPal] Container not ready');
        return;
      }

      if (!window.paypal) {
        console.log('[PayPal] SDK not ready');
        return;
      }

      console.log('[PayPal] Rendering buttons...');
      isRenderedRef.current = true;

      try {
        paypalButtonsRef.current = window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 48,
          },

          createOrder: async (_data: any, actions: any) => {
            try {
              const orderAmount = amountRef.current.toFixed(2);
              console.log('[PayPal] Creating order for', orderAmount, 'EUR');

              return await actions.order.create({
                purchase_units: [{
                  amount: {
                    currency_code: 'EUR',
                    value: orderAmount
                  },
                  description: 'Commande DeessePearls'
                }]
              });
            } catch (err: any) {
              console.error('[PayPal] createOrder error:', err);
              onErrorRef.current(err);
              throw err;
            }
          },

          onApprove: async (data: any, actions: any) => {
            console.log('[PayPal] Payment approved - data:', JSON.stringify(data));

            try {
              console.log('[PayPal] Capturing order...');
              const details = await actions.order.capture();
              console.log('[PayPal] Capture success - details:', JSON.stringify(details));

              // Passer les détails au callback — la commande sera sauvée
              // dans Supabase et l'email envoyé seulement après succès DB.
              console.log('[PayPal] Calling onSuccessRef...');
              onSuccessRef.current(details);
              console.log('[PayPal] onSuccessRef called');
            } catch (err: any) {
              console.error('[PayPal] Capture error:', err?.message || err);
              onErrorRef.current(err);
            }
          },

          onError: (err: any) => {
            console.error('[PayPal] Error:', err?.message || JSON.stringify(err));
            onErrorRef.current(err);
          },

          onCancel: (data: any) => {
            console.log('[PayPal] Cancelled - data:', JSON.stringify(data));
            onCancelRef.current();
          },

          // Pour les paiements par carte (si applicable)
          onShippingChange: (data: any) => {
            console.log('[PayPal] Shipping change:', JSON.stringify(data));
          }
        });

        await paypalButtonsRef.current.render(paypalContainerRef.current);
        console.log('[PayPal] Buttons rendered successfully');
        setIsLoading(false);

      } catch (err: any) {
        console.error('[PayPal] Render error:', err);
        setError(t('paypalErrorPrefix') + ': ' + (err?.message || 'Unknown'));
        setIsLoading(false);
        isRenderedRef.current = false;
      }
    };

    loadScript()
      .then(renderPayPalButtons)
      .catch((err) => {
        console.error('[PayPal] Load error:', err);
        setError(t('paypalLoadError'));
        setIsLoading(false);
      });

    // Cleanup
    return () => {
      console.log('[PayPal] Cleanup');
      if (paypalButtonsRef.current && typeof paypalButtonsRef.current.close === 'function') {
        try {
          paypalButtonsRef.current.close();
        } catch (e) {
          // Ignorer les erreurs de cleanup
        }
      }
      paypalButtonsRef.current = null;
      isRenderedRef.current = false;
    };
  }, []); // Dépendances vides pour éviter les re-renders

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive text-sm mb-2">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('reload')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gold mr-2" />
          <span className="text-muted-foreground">{t('loadingPaypal')}</span>
        </div>
      )}
      <div ref={paypalContainerRef} id="paypal-button-container" />
    </div>
  );
};

// Déclaration pour TypeScript
declare global {
  interface Window {
    paypal: any;
  }
}

// ============================================
// COMPOSANT PRINCIPAL CHECKOUT
// ============================================
const Checkout: React.FC = () => {
  const { items, subtotal, shippingCost, total, clearCart } = useCart();
  const { user } = useAuth();
  const { t, formatPrice, language } = useLocale();
  const navigate = useNavigate();
  const { profile, refreshProfile, isProfileComplete } = useUserProfile();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Charger l'adresse depuis le profil Supabase
  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop');
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile) {
      setShippingAddress(profile);
    }
  }, [items, user, navigate, profile]);

  // ============================================
  // SUCCÈS DU PAIEMENT
  // ============================================
  const handlePaymentSuccess = async (details: any) => {
    console.log('[Checkout] handlePaymentSuccess called, PayPal ID:', details.id);
    console.log('[Checkout] Current user:', user?.id, user?.email);

    setIsProcessing(true);

    try {
      // Vérifier que l'utilisateur est authentifié
      if (!user?.id) {
        console.error('[Checkout] No user logged in - cannot save order');
        toast.error('Vous devez être connecté pour finaliser la commande');
        setIsProcessing(false);
        return;
      }

      // Générer le numéro de commande
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderNumber = `DP-${year}${month}-${random}`;

      const customerEmail = user?.email || details.payer?.email_address || '';
      const firstName = user?.user_metadata?.first_name || shippingAddress?.firstName || '';
      const lastName = user?.user_metadata?.last_name || shippingAddress?.lastName || '';
      const customerName = `${firstName} ${lastName}`.trim() || user?.email?.split('@')[0] || 'Client';

      const formattedAddress = shippingAddress
        ? `${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? ', ' + shippingAddress.addressLine2 : ''}, ${shippingAddress.postalCode} ${shippingAddress.city}, ${getCountryName(shippingAddress.country, language as Language)}`
        : t('notSpecified');

      // 1. Sauvegarder la commande dans Supabase
      console.log('[Checkout] Saving order with user_id:', user.id);
      console.log('[Checkout] Order data:', { orderNumber, customerEmail, customerName, total });
      console.log('[Checkout] Starting Supabase insert...');

      const { data: savedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: shippingAddress?.phone || null,
          shipping_address: formattedAddress,
          status: 'paid',
          subtotal,
          shipping_cost: shippingCost,
          total,
          currency: 'EUR',
          paypal_order_id: details.id,
          paypal_status: details.status,
        })
        .select()
        .single();

      console.log('[Checkout] Insert completed - data:', savedOrder, 'error:', orderError);

      if (orderError) {
        console.error('[Checkout] Order save failed:', orderError.message, orderError.code, orderError.details);
        toast.error(`Erreur de sauvegarde: ${orderError.message}`);
        throw orderError;
      }

      console.log('[Checkout] Order saved successfully:', savedOrder.id);

      // 2. Sauvegarder les items de la commande
      const orderItems = items.map((item) => ({
        order_id: savedOrder.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        variant: item.variant || item.size || item.quality || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('[Checkout] Order items save error:', itemsError);
      }

      // 3. Commande créée avec succès → envoyer l'email de confirmation
      if (customerEmail) {
        const orderItemsText = items
          .map(item => `• ${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}`)
          .join('\n');

        const orderEmailData = {
          order_number: orderNumber,
          order_items: orderItemsText,
          subtotal: formatPrice(subtotal),
          shipping: formatPrice(shippingCost),
          total: formatPrice(total),
          customer_email: customerEmail,
          customer_name: customerName,
          shipping_address: formattedAddress,
        };

        try {
          // Send confirmation email to customer
          await sendOrderConfirmationEmail(orderEmailData);
          console.log('[Checkout] Confirmation email sent to customer');

          // Send notification to seller/admin
          await sendOrderNotificationToSeller(orderEmailData);
          console.log('[Checkout] Notification email sent to seller');
        } catch (emailErr) {
          // L'email échoue silencieusement — la commande est déjà sauvée
          console.error('[Checkout] Email send failed (order is saved):', emailErr);
        }
      }

      // 4. Succès complet → vider le panier et rediriger
      console.log('[Checkout] Clearing cart and redirecting...');
      await clearCart();
      // Small delay to ensure state is fully updated before navigation
      const redirectUrl = `/payment-success?order_id=${savedOrder.id}&order_number=${orderNumber}`;
      console.log('[Checkout] Navigating to:', redirectUrl);
      setTimeout(() => {
        navigate(redirectUrl);
      }, 100);
      toast.success(t('paymentSuccessToast'));
    } catch (error) {
      console.error('[Checkout] Order creation error:', error);
      toast.error(t('orderCreationError'));
      setIsProcessing(false);
    }
  };

  // ============================================
  // MODIFIER L'ADRESSE
  // ============================================
  const handleEditAddress = () => {
    setShowAddressModal(true);
  };

  const handleAddressUpdated = async () => {
    setShowAddressModal(false);
    await refreshProfile();
  };

  // ============================================
  // ERREUR DE PAIEMENT
  // ============================================
  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    console.error('Payment error message:', error?.message);

    let message = t('paymentErrorOccurred');

    if (error?.message?.includes('Window closed') || error?.message?.includes('popup')) {
      message = t('paymentWindowClosed');
    } else if (error?.message?.includes('INSTRUMENT_DECLINED')) {
      message = t('paymentDeclined');
    } else if (error?.message?.includes('unauthorized')) {
      message = t('authorizationError');
    } else if (error?.message?.includes('ORDER_NOT_APPROVED')) {
      message = t('orderNotApproved');
    } else if (error?.message?.includes('CURRENCY_NOT_SUPPORTED')) {
      message = t('currencyNotSupported');
    } else if (error?.message) {
      message = `${t('paypalErrorPrefix')}: ${error.message}`;
    }

    setPaypalError(message);
    toast.error(message);
    setIsProcessing(false);
  };

  // ============================================
  // ANNULATION
  // ============================================
  const handlePaymentCancel = () => {
    toast.info(t('paymentCancelled'));
    setIsProcessing(false);
  };

  // ============================================
  // RÉESSAYER
  // ============================================
  const handleRetry = () => {
    setPaypalError(null);
    setIsProcessing(false);
    setRetryKey(prev => prev + 1);
  };

  // ============================================
  // CHARGEMENT
  // ============================================
  if (items.length === 0 || !user || !shippingAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-pearl py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
            <h1 className="font-display text-2xl md:text-3xl font-semibold">
              <CreditCard className="w-6 h-6 inline-block mr-2 text-gold" />
              {t('checkoutTitle')}
            </h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gold" />
                    {t('orderSummary')} ({items.length} {items.length > 1 ? t('articles') : t('article')})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.variant}`} className="flex gap-4">
                      <img
                        src={resolveImagePath(item.image)}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        {(item.variant || item.size || item.quality) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.variant, item.size, item.quality].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        <p className="text-sm mt-1">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-gold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('subtotal')}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('shipping')}</span>
                      <span>{formatPrice(shippingCost)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-display font-semibold">
                    <span>{t('total')}</span>
                    <span className="text-gold">{formatPrice(total)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="w-4 h-4 text-gold" />
                      {t('shippingAddress')}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditAddress}
                      className="text-gold hover:text-gold-dark"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      {t('edit')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </p>
                  <p>{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  <p>{shippingAddress.postalCode} {shippingAddress.city}</p>
                  <p>{getCountryName(shippingAddress.country, language as Language)}</p>
                  {shippingAddress.phone && (
                    <p className="mt-2 text-foreground">{shippingAddress.phone}</p>
                  )}
                  <p className="text-foreground">{shippingAddress.email}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Section */}
            <div className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gold" />
                    {t('securePaymentTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
                      <p className="text-muted-foreground">{t('processingPayment')}</p>
                    </div>
                  ) : paypalError ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center">
                        <p className="font-medium">{t('paymentError')}</p>
                        <p className="text-sm mt-1">{paypalError}</p>
                      </div>
                      <Button onClick={handleRetry} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('retryPayment')}
                      </Button>
                    </div>
                  ) : (
                    <PayPalButtons
                      key={retryKey}
                      amount={total}
                      orderData={{
                        items: items.map(item => ({ name: item.name, price: item.price, quantity: item.quantity })),
                        subtotal,
                        shippingCost,
                        total,
                        formatPrice,
                        customerEmail: user?.email || shippingAddress?.email || '',
                        customerName: `${user?.user_metadata?.first_name || shippingAddress?.firstName || ''} ${user?.user_metadata?.last_name || shippingAddress?.lastName || ''}`.trim() || 'Client',
                        shippingAddress: shippingAddress
                          ? `${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? ', ' + shippingAddress.addressLine2 : ''}, ${shippingAddress.postalCode} ${shippingAddress.city}, ${getCountryName(shippingAddress.country, language as Language)}`
                          : t('notSpecified'),
                      }}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onCancel={handlePaymentCancel}
                    />
                  )}

                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <img
                        src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_mc_vs_dc_ae.jpg"
                        alt="PayPal accepted cards"
                        className="h-6"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  <span className="text-green-500 mr-1">🔒</span>
                  {t('securePaymentViaPaypal')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal pour modifier l'adresse */}
      <ShippingAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onConfirm={handleAddressUpdated}
      />
    </div>
  );
};

export default Checkout;

