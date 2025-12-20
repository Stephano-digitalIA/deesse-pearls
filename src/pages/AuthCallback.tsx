import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const waitForSession = async () => {
      // Some OAuth flows might not provide a `code` query param (or it can be lost if redirecting across domains).
      // We try to exchange the code when present, then we wait until the session is actually available before redirecting.
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast({
            title: 'Connexion impossible',
            description: error.message,
            variant: 'destructive',
          });
          navigate('/auth', { replace: true });
          return;
        }
      }

      // Wait until the session is available (prevents /account redirecting back to /auth due to timing)
      for (let i = 0; i < 15; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate('/account', { replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      toast({
        title: 'Connexion non finalisée',
        description: 'Merci de réessayer la connexion Google.',
        variant: 'destructive',
      });
      navigate('/auth', { replace: true });
    };

    void waitForSession();
  }, [navigate, toast]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm text-muted-foreground">Finalisation de la connexion…</p>
      </div>
    </main>
  );
};

export default AuthCallback;
