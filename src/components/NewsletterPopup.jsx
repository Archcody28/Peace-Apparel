import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Mail } from 'lucide-react';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const seen = sessionStorage.getItem('pa_newsletter_seen');
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        sessionStorage.setItem('pa_newsletter_seen', 'true');
        setTimeout(() => setIsOpen(false), 2500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const close = () => {
    setIsOpen(false);
    sessionStorage.setItem('pa_newsletter_seen', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="relative bg-cream rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gold transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid sm:grid-cols-5">
              <div className="sm:col-span-2 bg-gradient-gold p-6 flex items-center justify-center min-h-[160px] sm:min-h-0">
                <div className="text-center">
                  <Gift className="w-12 h-12 mx-auto text-charcoal mb-3" />
                  <p className="font-display text-2xl font-bold text-charcoal">10% OFF</p>
                  <p className="text-charcoal/80 text-xs uppercase tracking-wider">First Order</p>
                </div>
              </div>
              <div className="sm:col-span-3 p-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-dark mb-2">Join the Family</p>
                <h3 className="font-display text-2xl font-bold mb-3">Get Exclusive Access</h3>
                <p className="text-gray-600 text-sm mb-5">Subscribe for new arrivals, styling tips, and member-only offers.</p>

                {status === 'success' ? (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold">
                    Welcome! Your discount code is <span className="font-mono">PEACE10</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-charcoal text-white py-3 rounded-xl font-semibold text-sm hover:bg-gold hover:text-charcoal transition-colors disabled:opacity-70"
                    >
                      {status === 'loading' ? 'Subscribing...' : 'Unlock My Discount'}
                    </button>
                    {status === 'error' && <p className="text-red-500 text-xs">Something went wrong. Try again.</p>}
                  </form>
                )}
                <p className="text-[10px] text-gray-400 mt-3">No spam, unsubscribe anytime.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
