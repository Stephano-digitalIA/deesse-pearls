import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLocale } from '@/contexts/LocaleContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const { t } = useLocale();

  useEffect(() => {
    // Clear the cart after successful payment
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 bg-green-500/10 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>

          <h1 className="font-display text-3xl md:text-4xl mb-4">
            {t('paymentSuccessTitle') || 'Merci pour votre commande !'}
          </h1>
          
          <p className="text-muted-foreground mb-8">
            {t('paymentSuccessMessage') || 'Votre paiement a été effectué avec succès. Vous recevrez un email de confirmation avec les détails de votre commande.'}
          </p>

          {sessionId && (
            <p className="text-sm text-muted-foreground mb-8">
              {t('orderReference') || 'Référence'}: <span className="font-mono text-foreground">{sessionId.slice(-8).toUpperCase()}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-deep-black">
              <Link to="/shop" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                {t('continueShopping') || 'Continuer les achats'}
              </Link>
            </Button>
            <Button asChild className="bg-gold hover:bg-gold-dark text-deep-black">
              <Link to="/" className="flex items-center gap-2">
                {t('backToHome') || 'Retour à l\'accueil'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
