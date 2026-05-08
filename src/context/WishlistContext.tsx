import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { WishlistContext } from '@/hooks/useWishlist';
import type { Product } from '@/types';

export { useWishlist } from '@/hooks/useWishlist';

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some((p) => p.id === productId);
  }, [items]);

  const toggleWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
