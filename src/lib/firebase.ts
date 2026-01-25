import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.apiKey !== ''
  );
};

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('Firebase: Persistence set to LOCAL'))
      .catch((err) => console.error('Firebase: Persistence error:', err));
    
    console.log('Firebase: Initialized successfully');
  } catch (error) {
    console.error('Firebase: Initialization error:', error);
  }
}

export type FirebaseUser = User;

// Utilise signInWithPopup (fonctionne mieux en localhost)
export const signInWithGoogle = async (): Promise<{ user: User | null; error: Error | null }> => {
  if (!auth || !googleProvider) {
    return { user: null, error: new Error('Firebase non configuré') };
  }
  
  try {
    console.log('Firebase: Starting popup sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    
    if (result.user) {
      console.log('Firebase: Popup sign-in successful:', result.user.email);
      return { user: result.user, error: null };
    }
    
    return { user: null, error: new Error('Aucun utilisateur retourné') };
  } catch (error: any) {
    console.error('Firebase: Popup error:', error.code, error.message);
    
    // Ignorer les erreurs de popup fermée par l'utilisateur
    if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: null }; // Pas d'erreur, juste annulé
    }
    
    if (error.code === 'auth/cancelled-popup-request') {
      return { user: null, error: null };
    }
    
    return { user: null, error: new Error(error.message || 'Échec connexion Google') };
  }
};

// Gardé pour compatibilité mais non utilisé
export const checkRedirectResult = async (): Promise<{ user: User | null; error: Error | null }> => {
  return { user: null, error: null };
};

export const signOutFirebase = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
    console.log('Firebase: Signed out');
  }
};

export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    return () => {};
  }
  
  console.log('Firebase: Setting up auth state listener');
  return onAuthStateChanged(auth, (user) => {
    console.log('Firebase: Auth state changed:', user?.email || 'null');
    callback(user);
  });
};

export const getCurrentFirebaseUser = (): User | null => {
  return auth?.currentUser || null;
};

export const getFirebaseAuth = (): Auth | null => auth;