import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { createOrder } from '@/lib/localStorage';
import { getShippingAddress, ShippingAddress, clearShippingAddress } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Package, MapPin, Loader2, RefreshCw, Edit2 } from 'lucide-react';
import { resolveImagePath } from '@/lib/utils';
import ShippingAddressModal from '@/components/ShippingAddressModal';
import { sendOrderConfirmationEmail, formatOrderItemsForEmail } from '@/services/emailService';

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
  };
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}> = ({ amount, orderData, onSuccess, onError, onCancel }) => {
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
    // Charger le script PayPal si pas encore chargé
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.paypal) {
          scriptLoadedRef.current = true;
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => {
            scriptLoadedRef.current = true;
            resolve();
          });
          return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
        script.async = true;
        script.onload = () => {
          console.log('[PayPal] Script loaded');
          scriptLoadedRef.current = true;
          resolve();
        };
        script.onerror = () => {
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

          createOrder: (_data: any, actions: any) => {
            const orderAmount = amountRef.current.toFixed(2);
            console.log('[PayPal] Creating order for', orderAmount, 'USD');

            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [{
                amount: {
                  value: orderAmount,
                  currency_code: 'USD'
                }
              }]
            });
          },

          onApprove: async (_data: any, actions: any) => {
            console.log('[PayPal] Payment approved');

            try {
              const details = await actions.order.capture();
              console.log('[PayPal] Capture success:', details.id);

              // Générer le numéro de commande UNE SEULE FOIS
              const orderNumber = `DP-${Date.now().toString(36).toUpperCase()}`;
              console.log('[PayPal] Numéro de commande généré:', orderNumber);

              // Envoyer l'email de confirmation IMMÉDIATEMENT après le paiement
              console.log('[PayPal] Envoi email de confirmation...');
              const data = orderDataRef.current;

              const orderItems = data.items
                .map(item => `• ${item.name} (x${item.quantity}) - ${data.formatPrice(item.price * item.quantity)}`)
                .join('\n');

              const emailSent = await sendOrderConfirmationEmail({
                order_number: orderNumber,
                order_items: orderItems,
                subtotal: data.formatPrice(data.subtotal),
                shipping: data.formatPrice(data.shippingCost),
                total: data.formatPrice(data.total),
              });

              console.log('[PayPal] Email envoyé:', emailSent);

              // Appeler le callback de succès avec le numéro de commande
              onSuccessRef.current({ ...details, generatedOrderNumber: orderNumber });
            } catch (err) {
              console.error('[PayPal] Capture/Email error:', err);
              onErrorRef.current(err);
            }
          },

          onError: (err: any) => {
            console.error('[PayPal] Error:', err);
            onErrorRef.current(err);
          },

          onCancel: () => {
            console.log('[PayPal] Cancelled');
            onCancelRef.current();
          }
        });

        await paypalButtonsRef.current.render(paypalContainerRef.current);
        console.log('[PayPal] Buttons rendered successfully');
        setIsLoading(false);

      } catch (err: any) {
        console.error('[PayPal] Render error:', err);
        setError('Erreur PayPal: ' + (err?.message || 'Unknown'));
        setIsLoading(false);
        isRenderedRef.current = false;
      }
    };

    loadScript()
      .then(renderPayPalButtons)
      .catch((err) => {
        console.error('[PayPal] Load error:', err);
        setError('Impossible de charger PayPal');
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
          Recharger
        </Button>
      </div>
    );
  }

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gold mr-2" />
          <span className="text-muted-foreground">Chargement PayPal...</span>
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
  const { t, formatPrice } = useLocale();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop');
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    // Récupérer l'adresse de livraison sauvegardée
    const savedAddress = getShippingAddress();
    if (!savedAddress) {
      // Pas d'adresse → retour au panier
      toast.error('Veuillez renseigner votre adresse de livraison');
      navigate('/shop');
      return;
    }

    setShippingAddress(savedAddress);
  }, [items, user, navigate]);

  // ============================================
  // SUCCÈS DU PAIEMENT
  // ============================================
  const handlePaymentSuccess = async (details: any) => {
    console.log('[Checkout] ========================================');
    console.log('[Checkout] handlePaymentSuccess APPELÉ !');
    console.log('[Checkout] PayPal details:', details);
    console.log('[Checkout] Numéro de commande reçu:', details.generatedOrderNumber);
    console.log('[Checkout] ========================================');

    setIsProcessing(true);

    try {
      // Récupérer le numéro de commande généré dans onApprove
      const orderNumber = details.generatedOrderNumber;

      // Récupérer l'email depuis deesse_current_user
      const currentUser = JSON.parse(localStorage.getItem('deesse_current_user') || '{}');
      const customerEmail = currentUser.email || user?.email || details.payer?.email_address || '';

      // Récupérer le profil depuis deesse_profiles
      const profiles = JSON.parse(localStorage.getItem('deesse_profiles') || '[]');
      const currentUserId = currentUser.id || user?.id;
      const userProfile = profiles.find((p: any) => p.userId === currentUserId);

      console.log('[Checkout] === DEBUG ===');
      console.log('[Checkout] orderNumber:', orderNumber);
      console.log('[Checkout] customerEmail:', customerEmail);

      // Construire le nom et l'adresse depuis le profil ou shippingAddress
      const customerName = userProfile
        ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
        : shippingAddress
          ? `${shippingAddress.firstName} ${shippingAddress.lastName}`
          : user?.email?.split('@')[0] || 'Client';

      const formattedAddress = userProfile
        ? `${userProfile.addressLine1 || ''}${userProfile.addressLine2 ? ', ' + userProfile.addressLine2 : ''}, ${userProfile.postalCode || ''} ${userProfile.city || ''}, ${userProfile.country || ''}`
        : shippingAddress
          ? `${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? ', ' + shippingAddress.addressLine2 : ''}, ${shippingAddress.postalCode} ${shippingAddress.city}, ${shippingAddress.country}`
          : 'Non spécifiée';

      // Alerte si email toujours vide
      if (!customerEmail) {
        console.error('[Checkout] ATTENTION: Aucun email trouvé pour le client!');
      }

      const orderItems = items.map((item) => ({
        productId: item.id,
        productName: item.name,
        productImage: item.image,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        variant: item.variant || item.size || item.quality,
      }));

      // Créer la commande avec le MÊME numéro que l'email
      const order = createOrder({
        userId: user?.id,
        customerEmail,
        customerName,
        customerPhone: shippingAddress?.phone,
        shippingAddress: formattedAddress,
        status: 'confirmed',
        items: orderItems,
        subtotal,
        shippingCost,
        total,
        paypalTransactionId: details.id,
        paypalStatus: details.status,
        notes: `PayPal Transaction ID: ${details.id}`,
      }, orderNumber);  // Passer le numéro de commande généré dans onApprove

      // Email envoyé dans onApprove de PayPal (pas ici pour éviter les doublons)

      // Nettoyer l'adresse temporaire après commande réussie
      clearShippingAddress();
      clearCart();
      navigate(`/payment-success?order_id=${order.id}&order_number=${order.orderNumber}`);
      toast.success('Paiement effectué avec succès !');
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Erreur lors de la création de la commande');
      setIsProcessing(false);
    }
  };

  // ============================================
  // MODIFIER L'ADRESSE
  // ============================================
  const handleEditAddress = () => {
    setShowAddressModal(true);
  };

  const handleAddressUpdated = () => {
    setShowAddressModal(false);
    const updatedAddress = getShippingAddress();
    if (updatedAddress) {
      setShippingAddress(updatedAddress);
    }
  };

  // ============================================
  // ERREUR DE PAIEMENT
  // ============================================
  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    console.error('Payment error message:', error?.message);

    let message = 'Une erreur est survenue lors du paiement';

    if (error?.message?.includes('Window closed') || error?.message?.includes('popup')) {
      message = 'La fenêtre de paiement a été fermée. Cliquez sur "Réessayer" pour continuer.';
    } else if (error?.message?.includes('INSTRUMENT_DECLINED')) {
      message = 'Le paiement a été refusé par PayPal.';
    } else if (error?.message?.includes('unauthorized')) {
      message = 'Erreur d\'autorisation PayPal. Vérifiez la configuration du compte sandbox.';
    } else if (error?.message?.includes('ORDER_NOT_APPROVED')) {
      message = 'La commande n\'a pas été approuvée. Veuillez réessayer.';
    } else if (error?.message?.includes('CURRENCY_NOT_SUPPORTED')) {
      message = 'La devise n\'est pas supportée par ce compte PayPal.';
    } else if (error?.message) {
      // Afficher le message d'erreur exact pour le debug
      message = `Erreur PayPal: ${error.message}`;
    }

    setPaypalError(message);
    toast.error(message);
    setIsProcessing(false);
  };

  // ============================================
  // ANNULATION
  // ============================================
  const handlePaymentCancel = () => {
    toast.info('Paiement annulé');
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
              Retour
            </Button>
            <h1 className="font-display text-2xl md:text-3xl font-semibold">
              <CreditCard className="w-6 h-6 inline-block mr-2 text-gold" />
              Finaliser la commande
            </h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gold" />
                    Récapitulatif ({items.length} article{items.length > 1 ? 's' : ''})
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
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span>{formatPrice(shippingCost)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-display font-semibold">
                    <span>Total</span>
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
                      Adresse de livraison
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditAddress}
                      className="text-gold hover:text-gold-dark"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Modifier
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
                  <p>{shippingAddress.country}</p>
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
                    Paiement sécurisé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
                      <p className="text-muted-foreground">Traitement en cours...</p>
                    </div>
                  ) : paypalError ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center">
                        <p className="font-medium">Erreur de paiement</p>
                        <p className="text-sm mt-1">{paypalError}</p>
                      </div>
                      <Button onClick={handleRetry} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Réessayer le paiement
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
                  Paiement 100% sécurisé via PayPal
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

