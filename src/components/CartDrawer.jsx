import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { formatCurrency } from '../lib/utils.js';
import CheckoutModal from './CheckoutModal.jsx';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={closeCart}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-cream z-[101] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-gold-dark" />
                  <h2 className="font-display text-xl font-bold">Your Cart ({totalItems})</h2>
                </div>
                <button
                  onClick={closeCart}
                  className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto cart-scrollbar p-6">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-display text-lg mb-2">Your cart is empty</p>
                    <p className="text-gray-500 text-sm mb-6">Discover our luxury African fashion collection.</p>
                    <Link
                      to="/products"
                      onClick={closeCart}
                      className="px-6 py-3 bg-charcoal text-white rounded-xl text-sm font-semibold hover:bg-gold hover:text-charcoal transition-colors"
                    >
                      Shop Collection
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm"
                      >
                        <img
                          src={item.images?.[0] || item.image}
                          alt={item.name}
                          className="w-20 h-24 object-cover rounded-xl"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-semibold text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.selectedSize && `Size: ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && ' / '}
                            {item.selectedColor && `Color: ${item.selectedColor}`}
                          </p>
                          <p className="font-semibold text-sm mt-2">{formatCurrency(item.price)}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-gray-200 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                className="p-1.5 hover:bg-gray-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                className="p-1.5 hover:bg-gray-50"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-display text-xl font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Shipping calculated at checkout.</p>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="w-full bg-charcoal text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors"
                  >
                    Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={closeCart}
                    className="w-full mt-3 py-3 text-sm font-semibold underline underline-offset-4 hover:text-gold-dark transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
