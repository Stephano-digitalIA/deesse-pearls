import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================
interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; needsRegistration?: boolean }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null; alreadyExists?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUpWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HELPERS
// ============================================
function supabaseUserToUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    user_metadata: {
      first_name: supabaseUser.user_metadata?.full_name?.split(' ')[0] || supabaseUser.user_metadata?.first_name,
      last_name: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || supabaseUser.user_metadata?.last_name,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
    },
  };
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (error) {
    console.error('AuthContext: Error checking admin role:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

// ============================================
// PROVIDER
// ============================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ============================================
  // INITIALISATION
  // ============================================
  useEffect(() => {
    console.log('AuthContext: Initializing...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      console.log('Supabase: Auth state changed:', event, supabaseSession?.user?.email || 'null');

      if (supabaseSession?.user) {
        const appUser = supabaseUserToUser(supabaseSession.user);
        setUser(appUser);
        setSession({ user: appUser, access_token: supabaseSession.access_token });

        const admin = await checkIsAdmin(supabaseSession.user.id);
        setIsAdmin(admin);
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: supabaseSession } }) => {
      if (supabaseSession?.user) {
        const appUser = supabaseUserToUser(supabaseSession.user);
        setUser(appUser);
        setSession({ user: appUser, access_token: supabaseSession.access_token });

        const admin = await checkIsAdmin(supabaseSession.user.id);
        setIsAdmin(admin);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================
  // CONNEXION EMAIL/PASSWORD
  // ============================================
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return {
          error: new Error('Aucun compte trouvé avec cet email ou mot de passe incorrect.'),
          needsRegistration: true,
        };
      }
      return { error: new Error(error.message) };
    }

    if (data.user) {
      const appUser = supabaseUserToUser(data.user);
      setUser(appUser);
      setSession({ user: appUser, access_token: data.session?.access_token || '' });

      const admin = await checkIsAdmin(data.user.id);
      setIsAdmin(admin);

      toast.success('Connexion réussie !');
    }

    return { error: null };
  };

  // ============================================
  // INSCRIPTION EMAIL/PASSWORD
  // ============================================
  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          full_name: `${firstName || ''} ${lastName || ''}`.trim(),
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return {
          error: new Error('Un compte existe déjà avec cet email. Veuillez vous connecter.'),
          alreadyExists: true,
        };
      }
      return { error: new Error(error.message) };
    }

    if (data.user) {
      const appUser = supabaseUserToUser(data.user);
      setUser(appUser);
      setSession({ user: appUser, access_token: data.session?.access_token || '' });
      setIsAdmin(false);
    }

    return { error: null };
  };

  // ============================================
  // DÉCONNEXION
  // ============================================
  const signOut = async () => {
    console.log('AuthContext: Signing out...');

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('AuthContext: Supabase signOut error (ignored):', err);
    }

    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  // ============================================
  // CONNEXION GOOGLE (OAuth)
  // ============================================
  const signInWithGoogle = async () => {
    console.log('AuthContext: Starting Google sign-in with Supabase...');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error(error.message);
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const signUpWithGoogle = async () => {
    return signInWithGoogle();
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        signInWithGoogle,
        signUpWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
