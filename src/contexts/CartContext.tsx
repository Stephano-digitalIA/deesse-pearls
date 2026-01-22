import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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

interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, variant?: string, size?: string) => void;
  updateQuantity: (id: string, quantity: number, variant?: string, size?: string) => void;
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

// Extract user info from Supabase user object
const extractUserInfo = (user: User): UserInfo => {
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    firstName: metadata.first_name || metadata.given_name || metadata.name?.split(' ')[0] || '',
    lastName: metadata.last_name || metadata.family_name || metadata.name?.split(' ').slice(1).join(' ') || '',
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from Supabase for logged-in user (by email)
  const loadCartFromSupabase = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_carts')
        .select('*')
        .eq('user_email', email);

      if (error) {
        console.error('Error loading cart from Supabase:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.product_id,
        name: item.product_name,
        price: Number(item.product_price),
        quantity: item.quantity,
        image: item.product_image || '',
        variant: item.variant || undefined,
        size: item.size || undefined,
        quality: item.quality || undefined,
      }));
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }, []);

  // Save entire cart to Supabase (replace all items)
  const saveCartToSupabase = useCallback(async (user: UserInfo, cartItems: CartItem[]) => {
    if (!user.email) return;

    try {
      // Delete existing cart items for this user (by email)
      await supabase
        .from('user_carts')
        .delete()
        .eq('user_email', user.email);

      // Insert new cart items
      if (cartItems.length > 0) {
        const itemsToInsert = cartItems.map((item) => ({
          user_id: user.id,
          user_email: user.email,
          user_first_name: user.firstName || null,
          user_last_name: user.lastName || null,
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          product_image: item.image,
          quantity: item.quantity,
          variant: item.variant || null,
          size: item.size || null,
          quality: item.quality || null,
        }));

        const { error } = await supabase
          .from('user_carts')
          .insert(itemsToInsert);

        if (error) {
          console.error('Error saving cart to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user || null;

      if (user) {
        const info = extractUserInfo(user);
        setUserInfo(info);
        // Load cart from Supabase by email
        const savedCart = await loadCartFromSupabase(info.email);
        setItems(savedCart);
      } else {
        setUserInfo(null);
        setItems([]);
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;

      // User logged out
      if (event === 'SIGNED_OUT') {
        setItems([]);
        setUserInfo(null);
        setIsLoading(false);
        return;
      }

      // User logged in
      if (event === 'SIGNED_IN' && user) {
        const info = extractUserInfo(user);
        setUserInfo(info);
        setIsLoading(true);
        const savedCart = await loadCartFromSupabase(info.email);
        setItems(savedCart);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCartFromSupabase]);

  // Save cart to Supabase when items change (debounced)
  useEffect(() => {
    if (!userInfo || isLoading) return;

    const timeoutId = setTimeout(() => {
      saveCartToSupabase(userInfo, items);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [items, userInfo, isLoading, saveCartToSupabase]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === newItem.id &&
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

  const removeItem = useCallback((id: string, variant?: string, size?: string) => {
    setItems((prev) => prev.filter((item) =>
      !(item.id === id && item.variant === variant && item.size === size)
    ));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, variant?: string, size?: string) => {
    if (quantity < 1) {
      removeItem(id, variant, size);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        (item.id === id && item.variant === variant && item.size === size)
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

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
