import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { User, Session } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

// Vérifier le rôle admin dans la table user_roles de Supabase
async function checkIsAdminFromDB(userId: string): Promise<boolean> {
  if (!userId) {
    console.log('[Auth] No user ID provided');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (error) {
      console.log('[Auth] Error checking admin role:', error.message);
      return false;
    }

    const isAdmin = !!data;
    console.log('[Auth] Checking admin for user ID:', userId);
    console.log('[Auth] isAdmin from DB:', isAdmin);

    return isAdmin;
  } catch (e: any) {
    console.error('[Auth] Exception checking admin:', e?.message);
    return false;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const clearAuthState = () => {
      if (!isMounted) return;
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsLoading(false);
    };

    const timeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('[Auth] getSession error:', error.message);
          clearAuthState();
          return;
        }

        if (data.session?.user && isMounted) {
          const appUser = supabaseUserToUser(data.session.user);
          setUser(appUser);
          setSession({ user: appUser, access_token: data.session.access_token });
          const adminStatus = await checkIsAdminFromDB(data.session.user.id);
          setIsAdmin(adminStatus);
        }

        if (isMounted) setIsLoading(false);
      } catch (e: any) {
        console.warn('[Auth] Init error:', e?.message);
        clearAuthState();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      console.log('[Auth] Event:', event);

      if (!isMounted) return;

      if (supabaseSession?.user) {
        console.log('[Auth] User logged in:', supabaseSession.user.email, 'ID:', supabaseSession.user.id);
        const appUser = supabaseUserToUser(supabaseSession.user);
        setUser(appUser);
        setSession({ user: appUser, access_token: supabaseSession.access_token });
        const adminStatus = await checkIsAdminFromDB(supabaseSession.user.id);
        console.log('[Auth] Admin status result:', adminStatus);
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
      clearTimeout(timeout);
      setIsLoading(false);
    });

    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    toast.success('Connexion réussie');
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setIsAdmin(false);

    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}

    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/${import.meta.env.VITE_ADMIN_SECRET || 'admin2025'}`,
      },
    });

    if (error) {
      toast.error(error.message);
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signIn,
        signOut,
        signInWithGoogle,
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
