import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Package, ShoppingCart, MessageSquare, Users, Settings, Home } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');

  const commands = [
    { name: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' },
    { name: 'Products', icon: Package, section: 'products' },
    { name: 'Orders', icon: ShoppingCart, section: 'orders' },
    { name: 'Testimonials', icon: MessageSquare, section: 'testimonials' },
    { name: 'Homepage Products', icon: Home, section: 'homepage' },
    { name: 'Subscribers', icon: Users, section: 'subscribers' },
    { name: 'Settings', icon: Settings, section: 'settings' },
  ];

  const filtered = commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-32 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands..."
                className="flex-1 outline-none text-sm"
                autoFocus
              />
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">ESC</span>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {filtered.map(cmd => (
                <button
                  key={cmd.section}
                  onClick={() => {
                    onNavigate(cmd.section);
                    onClose();
                    setQuery('');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left transition-colors"
                >
                  <cmd.icon className="w-4 h-4 text-gold-dark" />
                  <span className="text-sm font-medium">{cmd.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
