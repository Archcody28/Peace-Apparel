import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import { formatCurrency } from '../lib/utils.js';
import { useCart } from '../contexts/CartContext.jsx';

export default function ProductCard({ product, onQuickView }) {
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, product.sizes?.[0], product.colors?.[0]);
  };

  return (
    <motion.div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden image-zoom-container bg-gray-100">
          {!imageLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={product.images?.[0] || product.image || '/placeholder.jpg'}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {product.discount && (
            <span className="absolute top-3 left-3 bg-gold text-charcoal text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              {product.discount}% Off
            </span>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white/90 text-charcoal text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-4 right-4 flex gap-2"
          >
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-charcoal text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" /> Add
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView?.(product);
              }}
              className="w-11 h-11 bg-white rounded-xl flex items-center justify-center hover:bg-gold transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        <div className="p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-dark mb-1">{product.category || product.categories?.[0]}</p>
          <h3 className="font-display text-base font-semibold mb-2 group-hover:text-gold-dark transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{formatCurrency(product.price)}</span>
            {product.oldPrice && (
              <span className="text-gray-400 text-sm line-through">{formatCurrency(product.oldPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold hover:text-charcoal">
        <Heart className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
