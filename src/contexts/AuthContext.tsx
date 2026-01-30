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
    let isMounted = true;

    // Helper to clear all auth state
    const clearAuthState = () => {
      if (!isMounted) return;
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsLoading(false);
    };

    // Helper to nuke stale tokens from all storage
    const nukeTokens = () => {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      try { indexedDB.deleteDatabase('supabase'); } catch {}
    };

    // Catch auth errors globally (registered FIRST, before any Supabase call)
    const handleAuthError = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const msg = error?.message || '';
      if (
        error?.name === 'AuthApiError' ||
        msg.includes('Refresh Token') ||
        msg.includes('refresh_token') ||
        msg.includes('Invalid Refresh Token')
      ) {
        console.warn('[Auth] Invalid token detected, cleaning up:', msg);
        event.preventDefault();
        nukeTokens();
        supabase.auth.signOut().catch(() => {});
        clearAuthState();
      }
    };
    window.addEventListener('unhandledrejection', handleAuthError);

    // Safety timeout: force isLoading=false after 5s if Supabase is unreachable
    const timeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    // Initialize auth with explicit error handling
    const initAuth = async () => {
      try {
        // Try to get existing session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('[Auth] getSession error, cleaning up:', error.message);
          nukeTokens();
          clearAuthState();
          return;
        }

        if (data.session?.user && isMounted) {
          const appUser = supabaseUserToUser(data.session.user);
          setUser(appUser);
          setSession({ user: appUser, access_token: data.session.access_token });
          checkIsAdmin(data.session.user.id).then(setIsAdmin).catch(() => setIsAdmin(false));
        }

        if (isMounted) setIsLoading(false);
      } catch (e: any) {
        console.warn('[Auth] Init error, cleaning up:', e?.message);
        nukeTokens();
        clearAuthState();
      }
    };

    // Listen for auth state changes (after initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      console.log('[Auth] Event:', event);

      if (!isMounted) return;

      if (supabaseSession?.user) {
        const appUser = supabaseUserToUser(supabaseSession.user);
        setUser(appUser);
        setSession({ user: appUser, access_token: supabaseSession.access_token });
        checkIsAdmin(supabaseSession.user.id).then(setIsAdmin).catch(() => setIsAdmin(false));
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
      clearTimeout(timeout);
      setIsLoading(false);
    });

    // Run init
    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleAuthError);
    };
  }, []);

  // ============================================
  // CONNEXION EMAIL/PASSWORD
  // ============================================
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
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

    // State updates handled by onAuthStateChange
    toast.success('Connexion réussie !');
    return { error: null };
  };

  // ============================================
  // INSCRIPTION EMAIL/PASSWORD
  // ============================================
  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { error } = await supabase.auth.signUp({
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

    // State updates handled by onAuthStateChange
    return { error: null };
  };

  // ============================================
  // DÉCONNEXION
  // ============================================
  const signOut = async () => {
    console.log('[Auth] signOut called');
    setUser(null);
    setSession(null);
    setIsAdmin(false);

    // Clear all browser storage so no stale token can survive
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    try { indexedDB.deleteDatabase('supabase'); } catch {}

    // Fire-and-forget — never await, never block
    supabase.auth.signOut().catch(() => {});
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
