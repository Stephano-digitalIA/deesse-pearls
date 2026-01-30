import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Product info needed for favorites
export interface FavoriteProduct {
  id: string;
  name: string;
  image: string;
  price: number;
}

// Full favorite data from database
export interface FavoriteItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  product_price: number;
}

interface FavoritesContextType {
  favorites: string[];
  favoriteItems: FavoriteItem[];
  addFavorite: (product: FavoriteProduct) => Promise<boolean>;
  removeFavorite: (productId: string) => Promise<boolean>;
  toggleFavorite: (product: FavoriteProduct) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => Promise<boolean>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from Supabase
  const loadFavorites = useCallback(async (userId: string) => {
    console.log('[Favorites] Loading favorites for user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id, product_id, product_name, product_image, product_price')
        .eq('user_id', userId);

      console.log('[Favorites] Loaded:', { count: data?.length, error: error?.message });

      if (error) {
        console.error('[Favorites] Error loading:', error);
        return { ids: [], items: [] };
      }

      const ids = (data || []).map((item: any) => item.product_id);
      const items: FavoriteItem[] = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || '',
        product_image: item.product_image || '',
        product_price: item.product_price || 0,
      }));

      return { ids, items };
    } catch (error) {
      console.error('[Favorites] Exception loading:', error);
      return { ids: [], items: [] };
    }
  }, []);

  // Listen to auth state changes — onAuthStateChange handles INITIAL_SESSION (v2.39+).
  // No separate getSession() call to avoid session-lock deadlock.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (!currentUser || event === 'SIGNED_OUT') {
        setFavorites([]);
        setFavoriteItems([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { ids, items } = await loadFavorites(currentUser.id);
      setFavorites(ids);
      setFavoriteItems(items);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadFavorites]);

  const addFavorite = useCallback(async (product: FavoriteProduct): Promise<boolean> => {
    console.log('[Favorites] addFavorite called with:', product);
    console.log('[Favorites] Current user:', user?.id, user?.email);

    if (!user) {
      console.error('[Favorites] No user logged in');
      return false;
    }

    if (!product) {
      console.error('[Favorites] No product provided');
      return false;
    }

    // Vérifier que les données produit sont présentes (chaîne vide = invalide)
    if (!product.name || product.name.trim() === '') {
      console.error('[Favorites] Missing product name:', product);
      return false;
    }

    const productId = product.id?.toString();
    if (!productId) {
      console.error('[Favorites] Missing product id:', product);
      return false;
    }

    // Image peut être vide, on met une valeur par défaut
    const productImage = product.image || '/placeholder.jpg';

    console.log('[Favorites] Adding favorite:', {
      productId,
      productName: product.name,
      productImage,
      productPrice: product.price,
      userId: user.id
    });

    // Optimistic update for favorites array
    setFavorites((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });

    // Optimistic update for favoriteItems
    const newItem: FavoriteItem = {
      id: `temp-${productId}`,
      product_id: productId,
      product_name: product.name,
      product_image: productImage,
      product_price: product.price || 0,
    };
    setFavoriteItems((prev) => {
      if (prev.some(item => item.product_id === productId)) return prev;
      return [...prev, newItem];
    });

    try {
      // Fetch user profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      // Save to Supabase with upsert (handles duplicates automatically)
      const insertData = {
        user_id: user.id,
        user_email: user.email || '',
        user_first_name: profile?.first_name || '',
        user_last_name: profile?.last_name || '',
        product_id: productId,
        product_name: product.name,
        product_image: productImage,
        product_price: product.price || 0,
      };

      console.log('[Favorites] Upserting data:', insertData);

      const { data, error } = await supabase
        .from('user_favorites')
        .upsert(insertData, {
          onConflict: 'user_id,product_id'
        })
        .select();

      console.log('[Favorites] Upsert response:', { data, error });

      if (error) {
        console.error('[Favorites] Error adding favorite:', error.message, error.code, error.details, error.hint);
        // Revert on error
        setFavorites((prev) => prev.filter((id) => id !== productId));
        setFavoriteItems((prev) => prev.filter((item) => item.product_id !== productId));
        return false;
      }

      // Update the temp ID with the real one from database
      if (data && data[0]) {
        setFavoriteItems((prev) => prev.map((item) =>
          item.product_id === productId ? { ...item, id: data[0].id } : item
        ));
      }

      console.log('[Favorites] Successfully added to database:', data);
      return true;
    } catch (e) {
      console.error('[Favorites] Exception:', e);
      setFavorites((prev) => prev.filter((id) => id !== productId));
      setFavoriteItems((prev) => prev.filter((item) => item.product_id !== productId));
      return false;
    }
  }, [user?.id, user?.email]);

  const removeFavorite = useCallback(async (productId: string): Promise<boolean> => {
    if (!user?.id) {
      console.error('[Favorites] No user logged in');
      return false;
    }

    const userId = user.id;
    console.log('[Favorites] Removing favorite:', { productId, userId });

    // Save previous state for potential revert using functional update
    let previousFavorites: string[] = [];
    let previousItems: FavoriteItem[] = [];

    // Optimistic update - capture previous state
    setFavorites((prev) => {
      previousFavorites = prev;
      return prev.filter((id) => id !== productId);
    });
    setFavoriteItems((prev) => {
      previousItems = prev;
      return prev.filter((item) => item.product_id !== productId);
    });

    try {
      // Remove from Supabase
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        console.error('[Favorites] Error removing favorite:', error.message);
        // Revert on error
        setFavorites(previousFavorites);
        setFavoriteItems(previousItems);
        return false;
      }

      console.log('[Favorites] Successfully removed from database');
      return true;
    } catch (e) {
      console.error('[Favorites] Exception:', e);
      setFavorites(previousFavorites);
      setFavoriteItems(previousItems);
      return false;
    }
  }, [user?.id]);

  // Use a ref for favorites to avoid dependency issues in toggleFavorite
  const favoritesRef = useRef(favorites);
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  const toggleFavorite = useCallback(async (product: FavoriteProduct): Promise<boolean> => {
    const productId = product.id.toString();
    // Use ref to get current favorites without adding dependency
    if (favoritesRef.current.includes(productId)) {
      return await removeFavorite(productId);
    } else {
      return await addFavorite(product);
    }
  }, [addFavorite, removeFavorite]);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const clearFavorites = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      console.error('[Favorites] No user logged in');
      return false;
    }

    const userId = user.id;

    // Save previous state for potential revert using functional update
    let previousFavorites: string[] = [];
    let previousItems: FavoriteItem[] = [];

    // Optimistic update - capture previous state
    setFavorites((prev) => {
      previousFavorites = prev;
      return [];
    });
    setFavoriteItems((prev) => {
      previousItems = prev;
      return [];
    });

    try {
      // Delete all from Supabase
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[Favorites] Error clearing favorites:', error.message);
        // Revert on error
        setFavorites(previousFavorites);
        setFavoriteItems(previousItems);
        return false;
      }

      console.log('[Favorites] Successfully cleared all favorites');
      return true;
    } catch (e) {
      console.error('[Favorites] Exception:', e);
      setFavorites(previousFavorites);
      setFavoriteItems(previousItems);
      return false;
    }
  }, [user?.id]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteItems,
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
