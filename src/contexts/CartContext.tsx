import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  size?: string;
  quality?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHIPPING_COST = 10;
const CART_STORAGE_KEY = 'deesse-pearls-cart';

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Cart] Error loading from storage:', error);
  }
  return [];
};

const saveCartToStorage = (items: CartItem[]): void => {
  try {
    if (items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch (error) {
    console.error('[Cart] Error saving to storage:', error);
  }
};

// ============================================
// SUPABASE HELPERS
// ============================================
const loadCartFromSupabase = async (userId: string): Promise<CartItem[]> => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[Cart] Supabase load error:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.product_id,
      name: item.product_name,
      price: item.product_price,
      quantity: item.quantity,
      image: item.product_image || '',
      variant: item.variant,
      size: item.size,
      quality: item.quality,
    }));
  } catch (error) {
    console.error('[Cart] Supabase load error:', error);
    return [];
  }
};

const saveCartToSupabase = async (userId: string, items: CartItem[]): Promise<void> => {
  try {
    // Get current product IDs in the new cart
    const newProductIds = items.map(item => item.id);

    // Delete items that are no longer in the cart
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .not('product_id', 'in', newProductIds.length > 0 ? `(${newProductIds.join(',')})` : '()');

    if (deleteError) {
      console.error('[Cart] Supabase delete error:', deleteError);
    }

    // Upsert items (insert or update if exists)
    if (items.length > 0) {
      const cartItems = items.map(item => ({
        user_id: userId,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        product_image: item.image,
        quantity: item.quantity,
        variant: item.variant || null,
        size: item.size || null,
        quality: item.quality || null,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('cart_items')
        .upsert(cartItems, {
          onConflict: 'user_id,product_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[Cart] Supabase save error:', error);
      }
    } else {
      // If cart is empty, delete all items for this user
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('[Cart] Supabase save error:', error);
  }
};

const clearCartInSupabase = async (userId: string): Promise<void> => {
  try {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
  } catch (error) {
    console.error('[Cart] Supabase clear error:', error);
  }
};

// ============================================
// CART PROVIDER
// ============================================
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const prevUserRef = useRef<typeof user>(undefined);
  const isInitializedRef = useRef(false);
  const isSyncingRef = useRef(false);

  // ============================================
  // LOAD CART ON INIT AND USER CHANGE
  // ============================================
  useEffect(() => {
    let isMounted = true;
    const userId = user?.id;
    const prevUserId = prevUserRef.current?.id;

    const loadCart = async () => {
      // Initial load
      if (!isInitializedRef.current) {
        setIsLoading(true);

        try {
          if (userId) {
            // User is logged in: load from Supabase, merge with localStorage
            const supabaseCart = await loadCartFromSupabase(userId);
            const localCart = loadCartFromStorage();

            // Merge: combine local cart into Supabase cart
            const mergedCart = [...supabaseCart];
            for (const localItem of localCart) {
              const existing = mergedCart.find(
                item => item.id === localItem.id &&
                        item.variant === localItem.variant &&
                        item.size === localItem.size
              );
              if (existing) {
                existing.quantity += localItem.quantity;
              } else {
                mergedCart.push(localItem);
              }
            }

            if (isMounted) {
              setItems(mergedCart);
            }

            // Save merged cart to Supabase and clear localStorage
            if (localCart.length > 0) {
              await saveCartToSupabase(userId, mergedCart);
              localStorage.removeItem(CART_STORAGE_KEY);
            }
          } else {
            // Guest: load from localStorage
            if (isMounted) {
              setItems(loadCartFromStorage());
            }
          }
        } catch (e) {
          console.error('[Cart] Error loading cart:', e);
        } finally {
          if (isMounted) {
            isInitializedRef.current = true;
            setIsLoading(false);
            prevUserRef.current = user;
          }
        }
        return;
      }

      // User logged out
      if (prevUserId && !userId) {
        if (isMounted) {
          setItems([]);
          setIsCartOpen(false);
          prevUserRef.current = user;
        }
        return;
      }

      // User logged in
      if (!prevUserId && userId) {
        setIsLoading(true);

        try {
          // Load from Supabase and merge with localStorage
          const supabaseCart = await loadCartFromSupabase(userId);
          const localCart = loadCartFromStorage();

          const mergedCart = [...supabaseCart];
          for (const localItem of localCart) {
            const existing = mergedCart.find(
              item => item.id === localItem.id &&
                      item.variant === localItem.variant &&
                      item.size === localItem.size
            );
            if (existing) {
              existing.quantity += localItem.quantity;
            } else {
              mergedCart.push(localItem);
            }
          }

          if (isMounted) {
            setItems(mergedCart);
          }

          // Save merged cart to Supabase and clear localStorage
          if (localCart.length > 0 || mergedCart.length !== supabaseCart.length) {
            await saveCartToSupabase(userId, mergedCart);
          }
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch (e) {
          console.error('[Cart] Error loading cart on login:', e);
        } finally {
          if (isMounted) {
            setIsLoading(false);
            prevUserRef.current = user;
          }
        }
        return;
      }

      // User switched
      if (prevUserId && userId && prevUserId !== userId) {
        setIsLoading(true);
        try {
          const userCart = await loadCartFromSupabase(userId);
          if (isMounted) {
            setItems(userCart);
          }
        } catch (e) {
          console.error('[Cart] Error loading cart on user switch:', e);
        } finally {
          if (isMounted) {
            setIsLoading(false);
            prevUserRef.current = user;
          }
        }
        return;
      }

      prevUserRef.current = user;
    };

    loadCart();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ============================================
  // SYNC TO STORAGE ON ITEMS CHANGE
  // ============================================
  useEffect(() => {
    if (!isInitializedRef.current || isSyncingRef.current) return;

    const userId = user?.id;

    const syncCart = async () => {
      isSyncingRef.current = true;

      try {
        if (userId) {
          await saveCartToSupabase(userId, items);
        } else {
          saveCartToStorage(items);
        }
      } catch (e) {
        console.error('[Cart] Error syncing cart:', e);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Debounce sync to avoid too many writes
    const timeoutId = setTimeout(syncCart, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, user?.id]);

  // ============================================
  // CART ACTIONS
  // ============================================
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (item) => item.id === newItem.id &&
                  item.variant === newItem.variant &&
                  item.size === newItem.size
      );
      if (existingItem) {
        return prev.map((item) =>
          item.id === existingItem.id &&
          item.variant === existingItem.variant &&
          item.size === existingItem.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(async () => {
    const userId = user?.id;
    setItems([]);
    try {
      if (userId) {
        await clearCartInSupabase(userId);
      }
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error('[Cart] Error clearing cart:', e);
    }
  }, [user?.id]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = SHIPPING_COST;
  const total = subtotal + shippingCost;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shippingCost,
        total,
        isCartOpen,
        setIsCartOpen,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
