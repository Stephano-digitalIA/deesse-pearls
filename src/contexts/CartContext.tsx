import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHIPPING_COST = 10;
const CART_STORAGE_KEY_PREFIX = 'deesse-pearls-cart-user-';
const CART_STORAGE_KEY_GUEST = 'deesse-pearls-cart-guest';

// Get storage key for a user (or guest)
const getCartStorageKey = (userId: string | null): string => {
  return userId ? `${CART_STORAGE_KEY_PREFIX}${userId}` : CART_STORAGE_KEY_GUEST;
};

// Load cart from localStorage for a specific user
const loadCartFromStorage = (userId: string | null): CartItem[] => {
  try {
    const key = getCartStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  }
  return [];
};

// Save cart to localStorage for a specific user
const saveCartToStorage = (userId: string | null, items: CartItem[]): void => {
  try {
    const key = getCartStorageKey(userId);
    if (items.length > 0) {
      localStorage.setItem(key, JSON.stringify(items));
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const prevUserRef = useRef<typeof user>(undefined);
  const isInitializedRef = useRef(false);

  // Handle user changes (login/logout)
  useEffect(() => {
    const prevUser = prevUserRef.current;

    // Initial load
    if (!isInitializedRef.current) {
      const initialCart = loadCartFromStorage(user?.id || null);
      setItems(initialCart);
      isInitializedRef.current = true;
      prevUserRef.current = user;
      return;
    }

    // User logged out
    if (prevUser && !user) {
      // Save the current cart for the user who is logging out
      saveCartToStorage(prevUser.id, items);
      // Clear the cart display (don't affect next user)
      setItems([]);
      // Close cart drawer
      setIsCartOpen(false);
    }

    // User logged in
    if (!prevUser && user) {
      // Load the user's saved cart
      const userCart = loadCartFromStorage(user.id);
      setItems(userCart);
    }

    // User switched (different user logged in)
    if (prevUser && user && prevUser.id !== user.id) {
      // Save previous user's cart
      saveCartToStorage(prevUser.id, items);
      // Load new user's cart
      const userCart = loadCartFromStorage(user.id);
      setItems(userCart);
    }

    prevUserRef.current = user;
  }, [user]);

  // Persist cart to localStorage whenever items change (for current user)
  useEffect(() => {
    if (isInitializedRef.current) {
      saveCartToStorage(user?.id || null, items);
    }
  }, [items, user?.id]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (item) => item.id === newItem.id && item.variant === newItem.variant && item.size === newItem.size
      );
      if (existingItem) {
        return prev.map((item) =>
          item.id === existingItem.id && item.variant === existingItem.variant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

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
