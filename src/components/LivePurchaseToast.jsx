import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils.js';

const fakePurchases = [
  { name: 'Adaeze Ankara Gown', location: 'Lagos', price: 45000, time: '2 min ago' },
  { name: 'Royal Senator Set', location: 'Abuja', price: 78000, time: '5 min ago' },
  { name: 'Bridal Lace Asoebi', location: 'Port Harcourt', price: 125000, time: '8 min ago' },
  { name: 'Igbo Traditional Wear', location: 'Aba', price: 92000, time: '12 min ago' },
  { name: 'Yoruba Agbada Set', location: 'Ibadan', price: 85000, time: '15 min ago' },
];

export default function LivePurchaseToast() {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const showRandom = () => {
      const item = fakePurchases[Math.floor(Math.random() * fakePurchases.length)];
      setCurrent(item);
      setTimeout(() => setCurrent(null), 5000);
    };

    const timers = [8000, 25000, 55000, 95000].map(t => setTimeout(showRandom, t));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0, x: -50, y: 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="fixed bottom-6 left-4 z-[95] max-w-xs"
        >
          <div className="glass rounded-2xl p-4 shadow-xl border-l-4 border-gold">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Someone just purchased</p>
                <p className="font-semibold text-sm leading-tight">{current.name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{current.location}</span>
                  <span className="text-gold font-semibold">{formatCurrency(current.price)}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{current.time}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
