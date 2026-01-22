import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Try to get cached session from localStorage for instant display
const getCachedSession = (): { user: User | null; session: Session | null } => {
  try {
    const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.user && parsed?.access_token) {
        // Check if token is not expired (with 60s buffer)
        const expiresAt = parsed.expires_at;
        if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
          return {
            user: parsed.user as User,
            session: {
              access_token: parsed.access_token,
              refresh_token: parsed.refresh_token,
              expires_at: parsed.expires_at,
              expires_in: parsed.expires_in,
              token_type: parsed.token_type || 'bearer',
              user: parsed.user,
            } as Session,
          };
        }
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return { user: null, session: null };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with cached data for instant display
  const cached = getCachedSession();
  const [user, setUser] = useState<User | null>(cached.user);
  const [session, setSession] = useState<Session | null>(cached.session);
  // If we have cached data, don't show loading
  const [isLoading, setIsLoading] = useState(!cached.user);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin role:', error);
        return false;
      }
      return !!data;
    } catch {
      return false;
    }
  };

  // Sync user metadata to profiles table on login
  const syncUserProfile = async (user: User) => {
    try {
      const metadata = user.user_metadata || {};
      const email = user.email || null;
      const firstName = metadata.first_name || metadata.given_name || metadata.name?.split(' ')[0] || null;
      const lastName = metadata.last_name || metadata.family_name || metadata.name?.split(' ').slice(1).join(' ') || null;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Profile exists - only update empty fields (don't overwrite user's saved data)
        const updates: Record<string, string | null> = {};
        if (!existingProfile.email && email) updates.email = email;
        if (!existingProfile.first_name && firstName) updates.first_name = firstName;
        if (!existingProfile.last_name && lastName) updates.last_name = lastName;

        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id);
        }
      } else {
        // No profile exists - create one with user metadata
        await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
          });
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer admin check and profile sync to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id).then(setIsAdmin);
            // Sync profile on sign in (including OAuth callback)
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              syncUserProfile(session.user);
            }
          }, 0);
        } else {
          setIsAdmin(false);
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id).then(setIsAdmin);
        // Sync profile on initial load too
        syncUserProfile(session.user);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear local state immediately
    setUser(null);
    setSession(null);
    setIsAdmin(false);

    // Clear Supabase session (this also clears localStorage)
    await supabase.auth.signOut();

    // Force clear any cached session data
    try {
      const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
      localStorage.removeItem(storageKey);
    } catch (e) {
      // Ignore storage errors
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;

    // In embedded previews (iframes), Google OAuth can fail or be blocked.
    // We request the OAuth URL and redirect the TOP window ourselves.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (!error && data?.url) {
      // Redirect the top-level browsing context when possible.
      const target = window.top ?? window;
      target.location.assign(data.url);
    }

    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{
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
    }}>
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
