import { useState } from 'react';
import { CreditCard, Loader2, Lock } from 'lucide-react';

export default function PaystackPayment({ email, amount, metadata, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const isConfigured = Boolean(publicKey && publicKey.startsWith('pk_'));

  const handlePaystack = () => {
    if (!isConfigured) {
      setError('Paystack is not configured. Please contact the store admin.');
      return;
    }

    setLoading(true);
    setError('');

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      currency: 'NGN',
      ref: `PA-${Date.now()}`,
      metadata,
      callback: (response) => {
        setLoading(false);
        onSuccess(response.reference);
      },
      onClose: () => {
        setLoading(false);
        if (onClose) onClose();
      },
    });

    handler.openIframe();
  };

  const handleDemoPayment = async () => {
    setLoading(true);
    setError('');
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    setLoading(false);
    onSuccess(`DEMO-${Date.now()}`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-gold-dark flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Secure Card Payment</p>
          <p className="text-xs text-gray-600 mt-1">
            {isConfigured
              ? 'You will be redirected to Paystack to complete your payment securely.'
              : 'Card payments are currently in demo mode. No real charge will be made.'}
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

      {isConfigured ? (
        <button
          onClick={handlePaystack}
          disabled={loading}
          className="w-full bg-charcoal text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {loading ? 'Processing...' : 'Pay with Card'}
        </button>
      ) : (
        <button
          onClick={handleDemoPayment}
          disabled={loading}
          className="w-full bg-charcoal text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {loading ? 'Processing...' : 'Test Pay with Card'}
        </button>
      )}
    </div>
  );
}
