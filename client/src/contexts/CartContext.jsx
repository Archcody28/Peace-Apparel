import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext({
  items: [],
  isOpen: false,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  toggleCart: () => {},
  openCart: () => {},
  closeCart: () => {},
  totalItems: 0,
  subtotal: 0,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pa_cart')) || [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pa_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1, selectedSize, selectedColor) => {
    setItems(prev => {
      const existing = prev.find(i =>
        i.id === product.id &&
        i.selectedSize === selectedSize &&
        i.selectedColor === selectedColor
      );
      if (existing) {
        return prev.map(i =>
          i.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...product, quantity, selectedSize, selectedColor }];
    });
    setIsOpen(true);
  };

  const removeItem = (id, selectedSize, selectedColor) => {
    setItems(prev => prev.filter(i =>
      !(i.id === id && i.selectedSize === selectedSize && i.selectedColor === selectedColor)
    ));
  };

  const updateQuantity = (id, selectedSize, selectedColor, quantity) => {
    if (quantity < 1) return removeItem(id, selectedSize, selectedColor);
    setItems(prev => prev.map(i =>
      i.id === id && i.selectedSize === selectedSize && i.selectedColor === selectedColor
        ? { ...i, quantity }
        : i
    ));
  };

  const clearCart = () => setItems([]);
  const toggleCart = () => setIsOpen(p => !p);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, updateQuantity, clearCart,
      toggleCart, openCart, closeCart, totalItems, subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
