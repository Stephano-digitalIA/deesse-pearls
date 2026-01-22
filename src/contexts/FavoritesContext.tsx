import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from Supabase
  const loadFavorites = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading favorites:', error);
        return [];
      }

      return (data || []).map((item: { product_id: string }) => item.product_id);
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const savedFavorites = await loadFavorites(currentUser.id);
        setFavorites(savedFavorites);
      } else {
        setFavorites([]);
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (event === 'SIGNED_OUT') {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && currentUser) {
        setIsLoading(true);
        const savedFavorites = await loadFavorites(currentUser.id);
        setFavorites(savedFavorites);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFavorites]);

  const addFavorite = useCallback(async (productId: string) => {
    if (!user) return;

    // Optimistic update
    setFavorites((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });

    // Save to Supabase
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        user_email: user.email,
        product_id: productId,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error adding favorite:', error);
      // Revert on error
      setFavorites((prev) => prev.filter((id) => id !== productId));
    }
  }, [user]);

  const removeFavorite = useCallback(async (productId: string) => {
    if (!user) return;

    // Optimistic update
    setFavorites((prev) => prev.filter((id) => id !== productId));

    // Remove from Supabase
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing favorite:', error);
      // Revert on error
      setFavorites((prev) => [...prev, productId]);
    }
  }, [user]);

  const toggleFavorite = useCallback((productId: string) => {
    if (favorites.includes(productId)) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const clearFavorites = useCallback(async () => {
    if (!user) return;

    // Optimistic update
    const previousFavorites = [...favorites];
    setFavorites([]);

    // Delete all from Supabase
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing favorites:', error);
      // Revert on error
      setFavorites(previousFavorites);
    }
  }, [user, favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
