import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined
    if (loading) return;

    // If user is authenticated, redirect to account
    if (user) {
      navigate('/account', { replace: true });
    } else {
      // No user, redirect to auth page
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

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
