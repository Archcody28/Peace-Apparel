import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, Phone } from 'lucide-react';

export default function MobileNav({ isOpen, onClose, links }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-cream z-[80] md:hidden shadow-2xl"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-10">
                <span className="font-display text-2xl font-bold">Menu</span>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {links.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={link.path}
                      onClick={onClose}
                      className="block py-4 text-2xl font-display border-b border-gray-200 hover:text-gold-dark transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="space-y-4 pt-6 border-t border-gray-200">
                <a href="tel:+2348012345678" className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gold" />
                  <span>+234 801 234 5678</span>
                </a>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-4 py-3 bg-charcoal text-white rounded-xl text-sm flex-1">
                    <ShoppingBag className="w-4 h-4" /> Shop Now
                  </button>
                  <button className="p-3 border border-gray-200 rounded-xl">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
