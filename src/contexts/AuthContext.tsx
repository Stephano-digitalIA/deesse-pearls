import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as LocalUser,
  getCurrentUser,
  setCurrentUser,
  getUserByEmail,
  createUser,
  updateUser,
  initializeDefaultData,
  getUsers,
  setUsers,
  upsertProfile,
  getProfileByUserId,
} from '@/lib/localStorage';
import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutFirebase,
  isFirebaseConfigured,
  onAuthChange,
  FirebaseUser,
} from '@/lib/firebase';
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
function localUserToUser(localUser: LocalUser): User {
  const profile = getProfileByUserId(localUser.id);
  return {
    id: localUser.id,
    email: localUser.email,
    user_metadata: {
      first_name: profile?.firstName,
      last_name: profile?.lastName,
    },
  };
}

function firebaseUserToUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    user_metadata: {
      first_name: firebaseUser.displayName?.split(' ')[0],
      last_name: firebaseUser.displayName?.split(' ').slice(1).join(' '),
      avatar_url: firebaseUser.photoURL || undefined,
    },
  };
}

function getOrCreateLocalUser(firebaseUser: FirebaseUser): LocalUser | null {
  if (!firebaseUser.email) return null;

  let localUser = getUserByEmail(firebaseUser.email);

  if (!localUser) {
    console.log('AuthContext: Creating new local user for:', firebaseUser.email);
    const users = getUsers();
    const newLocalUser: LocalUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      password: '',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    users.push(newLocalUser);
    setUsers(users);

    const displayNameParts = firebaseUser.displayName?.split(' ') || [];
    upsertProfile({
      userId: firebaseUser.uid,
      firstName: displayNameParts[0] || '',
      lastName: displayNameParts.slice(1).join(' ') || '',
    });

    localUser = newLocalUser;
  }

  return localUser;
}

// ============================================
// PROVIDER
// ============================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fonction pour connecter un utilisateur Firebase
  const loginFirebaseUser = (firebaseUser: FirebaseUser, showToast: boolean = true) => {
    console.log('AuthContext: Logging in Firebase user:', firebaseUser.email);
    
    const localUser = getOrCreateLocalUser(firebaseUser);
    
    if (localUser) {
      const appUser = firebaseUserToUser(firebaseUser);
      setCurrentUser(localUser);
      setUser(appUser);
      setSession({ user: appUser, access_token: 'firebase-token' });
      setIsAdmin(localUser.role === 'admin');
      
      if (showToast) {
        toast.success('Connexion Google réussie !');
      }
      return true;
    }
    return false;
  };

  // ============================================
  // INITIALISATION
  // ============================================
  useEffect(() => {
    console.log('AuthContext: Initializing...');
    initializeDefaultData();

    // Vérifier session localStorage existante
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log('AuthContext: Found localStorage session:', currentUser.email);
      const appUser = localUserToUser(currentUser);
      setUser(appUser);
      setSession({ user: appUser, access_token: 'local-token' });
      setIsAdmin(currentUser.role === 'admin');
      setIsLoading(false);
      return;
    }

    // Écouter les changements Firebase (pour persistance)
    if (isFirebaseConfigured()) {
      const unsubscribe = onAuthChange((firebaseUser) => {
        if (firebaseUser && !user) {
          loginFirebaseUser(firebaseUser, false);
        }
        setIsLoading(false);
      });

      // Timeout de sécurité
      setTimeout(() => setIsLoading(false), 2000);

      return () => unsubscribe();
    }

    setIsLoading(false);
  }, []);

  // ============================================
  // CONNEXION EMAIL/PASSWORD
  // ============================================
  const signIn = async (email: string, password: string) => {
    const localUser = getUserByEmail(email);

    if (!localUser) {
      return {
        error: new Error('Aucun compte trouvé avec cet email. Veuillez vous inscrire.'),
        needsRegistration: true,
      };
    }

    if (!localUser.password) {
      return {
        error: new Error('Ce compte utilise la connexion Google. Cliquez sur "Continuer avec Google".'),
      };
    }

    if (localUser.password !== password) {
      return { error: new Error('Mot de passe incorrect') };
    }

    const appUser = localUserToUser(localUser);
    setCurrentUser(localUser);
    setUser(appUser);
    setSession({ user: appUser, access_token: 'local-token' });
    setIsAdmin(localUser.role === 'admin');

    return { error: null };
  };

  // ============================================
  // INSCRIPTION EMAIL/PASSWORD
  // ============================================
  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const existingUser = getUserByEmail(email);

    if (existingUser) {
      return {
        error: new Error('Un compte existe déjà avec cet email. Veuillez vous connecter.'),
        alreadyExists: true,
      };
    }

    const newUser = createUser(email, password, 'user');

    if (firstName || lastName) {
      upsertProfile({
        userId: newUser.id,
        firstName: firstName || '',
        lastName: lastName || '',
      });
    }

    const appUser = localUserToUser(newUser);
    setCurrentUser(newUser);
    setUser(appUser);
    setSession({ user: appUser, access_token: 'local-token' });
    setIsAdmin(false);

    return { error: null };
  };

  // ============================================
  // DÉCONNEXION
  // ============================================
  const signOut = async () => {
    console.log('AuthContext: Signing out...');
    
    if (isFirebaseConfigured()) {
      await signOutFirebase();
    }

    setCurrentUser(null);
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    const localUser = getUserByEmail(email);
    if (!localUser) {
      return { error: new Error('Aucun compte trouvé avec cet email.') };
    }
    if (!localUser.password) {
      return { error: new Error('Ce compte utilise Google.') };
    }
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const storedUser = getCurrentUser();
    if (!storedUser) {
      return { error: new Error('Non authentifié') };
    }
    updateUser(storedUser.id, { password: newPassword });
    return { error: null };
  };

  // ============================================
  // CONNEXION GOOGLE (avec popup)
  // ============================================
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured()) {
      return { error: new Error('La connexion Google n\'est pas configurée.') };
    }

    console.log('AuthContext: Starting Google sign-in...');
    
    const { user: firebaseUser, error } = await firebaseSignInWithGoogle();
    
    if (error) {
      toast.error(error.message);
      return { error };
    }
    
    if (firebaseUser) {
      // Connecter l'utilisateur immédiatement
      loginFirebaseUser(firebaseUser, true);
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
