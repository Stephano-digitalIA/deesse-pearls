import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired';

const ConfirmSignup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    const confirmSignup = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setErrorMessage('Token de confirmation manquant');
        return;
      }

      console.log('[ConfirmSignup] Confirming with token:', token.substring(0, 10) + '...');

      try {
        const { data, error } = await supabase.functions.invoke('confirm-signup', {
          body: { token },
        });

        if (error) {
          console.error('[ConfirmSignup] Edge Function error:', error);
          setStatus('error');
          setErrorMessage(error.message || 'Erreur lors de la confirmation');
          return;
        }

        if (data?.error) {
          console.error('[ConfirmSignup] Confirmation error:', data.error);

          // Check if token expired
          if (data.expired) {
            setStatus('expired');
            setErrorMessage(data.error);
          } else {
            setStatus('error');
            setErrorMessage(data.error);
          }
          return;
        }

        // Success!
        console.log('[ConfirmSignup] Account confirmed successfully:', data);
        setStatus('success');
        setUserEmail(data.user?.email || '');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth', { state: { email: data.user?.email } });
        }, 3000);

      } catch (error: any) {
        console.error('[ConfirmSignup] Exception:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Erreur lors de la confirmation');
      }
    };

    confirmSignup();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-pearl flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-md"
      >
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              )}
              {(status === 'error' || status === 'expired') && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
            </div>

            <CardTitle className="text-2xl">
              {status === 'loading' && 'Confirmation en cours...'}
              {status === 'success' && '✅ Inscription confirmée !'}
              {status === 'expired' && '⏰ Lien expiré'}
              {status === 'error' && '❌ Erreur'}
            </CardTitle>

            {status !== 'loading' && (
              <CardDescription className="text-base pt-2">
                {status === 'success' && (
                  <>
                    Votre compte <span className="font-semibold text-gold">{userEmail}</span> a été créé avec succès.
                  </>
                )}
                {status === 'expired' && (
                  <>Le lien de confirmation a expiré. Veuillez vous réinscrire.</>
                )}
                {status === 'error' && (
                  <>{errorMessage || 'Une erreur est survenue lors de la confirmation.'}</>
                )}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Veuillez patienter pendant que nous activons votre compte...
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">Compte activé avec succès</p>
                      <ul className="space-y-1 text-green-700">
                        <li>✓ Votre email a été vérifié</li>
                        <li>✓ Votre compte est maintenant actif</li>
                        <li>✓ Vous pouvez vous connecter</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Redirection automatique vers la page de connexion...
                  </p>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                  >
                    Se connecter maintenant
                  </Button>
                </div>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Lien de confirmation expiré</p>
                      <p className="text-amber-700">
                        Pour des raisons de sécurité, les liens de confirmation sont valides pendant 24 heures uniquement.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/auth', { state: { tab: 'signup' } })}
                  className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                >
                  Créer un nouveau compte
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">Erreur de confirmation</p>
                      <p className="text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate('/auth', { state: { tab: 'signup' } })}
                    className="w-full bg-gold hover:bg-gold-dark text-deep-black font-semibold"
                  >
                    Réessayer l'inscription
                  </Button>
                  <Button
                    onClick={() => navigate('/contact')}
                    variant="outline"
                    className="w-full"
                  >
                    Contacter le support
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding */}
        <div className="text-center mt-6">
          <h2 className="font-display text-2xl font-semibold">
            <span className="text-gold">DEESSE</span> PEARLS
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            La Perle Noire de Tahiti
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmSignup;
