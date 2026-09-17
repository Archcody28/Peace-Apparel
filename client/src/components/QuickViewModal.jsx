import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../lib/utils.js';
import { useCart } from '../contexts/CartContext.jsx';
import { Link } from 'react-router-dom';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0]);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAdd = () => {
    addItem(product, quantity, selectedSize, selectedColor);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative bg-cream rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gold transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-square md:aspect-auto">
                <img
                  src={product.images?.[0] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <p className="text-xs uppercase tracking-[0.2em] text-gold-dark mb-2">{product.categories?.[0]}</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{product.name}</h2>
                <p className="text-2xl font-semibold mb-6">{formatCurrency(product.price)}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>

                {product.sizes?.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Size</label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                            selectedSize === size
                              ? 'bg-charcoal text-white border-charcoal'
                              : 'bg-white border-gray-200 hover:border-gold'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.colors?.length > 0 && (
                  <div className="mb-6">
                    <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                            selectedColor === color
                              ? 'bg-charcoal text-white border-charcoal'
                              : 'bg-white border-gray-200 hover:border-gold'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center border border-gray-200 rounded-xl bg-white">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-3 hover:bg-gray-50 rounded-l-xl"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="p-3 hover:bg-gray-50 rounded-r-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    className="flex-1 bg-charcoal text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>
                </div>

                <Link
                  to={`/products/${product.id}`}
                  onClick={onClose}
                  className="text-sm font-semibold underline underline-offset-4 hover:text-gold-dark transition-colors"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
