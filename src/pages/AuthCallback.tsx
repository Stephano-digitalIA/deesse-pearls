import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        navigate('/auth', { replace: true });
        return;
      }

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

      navigate('/account', { replace: true });
    };

    run();
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
