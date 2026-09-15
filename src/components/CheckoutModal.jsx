import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Truck, Store, MapPin, MessageCircle, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { formatCurrency, generateOrderId } from '../lib/utils.js';
import PaystackPayment from './PaystackPayment.jsx';

export default function CheckoutModal({ isOpen, onClose }) {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState('form');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('whatsapp');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    motorPark: '',
  });
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deliveryFees = {
    pickup: 0,
    doorstep: 3000,
    waybill: 0,
  };

  const total = subtotal + deliveryFees[deliveryMethod];

  const buildOrder = (id) => ({
    id,
    customer_name: formData.fullName,
    customer_email: formData.email,
    customer_phone: formData.phone,
    delivery_method: deliveryMethod,
    delivery_address: deliveryMethod === 'doorstep' ? formData.address : deliveryMethod === 'waybill' ? formData.motorPark : 'Pickup',
    items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, size: i.selectedSize, color: i.selectedColor })),
    subtotal,
    delivery_fee: deliveryFees[deliveryMethod],
    total,
    status: 'pending',
  });

  const openWhatsApp = (id) => {
    const itemsText = items.map(i => `- ${i.name} x${i.quantity} (${formatCurrency(i.price)})`).join('\n');
    const message = encodeURIComponent(
      `*New Order - ${id}*\n\n` +
      `*Customer:* ${formData.fullName}\n` +
      `*Email:* ${formData.email}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Delivery:* ${deliveryMethod.toUpperCase()}\n` +
      `*Address:* ${deliveryMethod === 'doorstep' ? formData.address : deliveryMethod === 'waybill' ? formData.motorPark : 'Pickup'}\n` +
      `*Payment:* ${paymentMethod.toUpperCase()}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Subtotal:* ${formatCurrency(subtotal)}\n` +
      `*Delivery:* ${formatCurrency(deliveryFees[deliveryMethod])}\n` +
      `*Total:* ${formatCurrency(total)}`
    );
    window.open(`https://wa.me/2348012345678?text=${message}`, '_blank');
  };

  const handleWhatsAppOrder = async () => {
    setLoading(true);
    const id = generateOrderId();
    setOrderId(id);

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOrder(id)),
      });
      if (!res.ok) throw new Error('Failed to save order');

      openWhatsApp(id);
      setStep('success');
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardSuccess = async (reference) => {
    setLoading(true);
    const id = generateOrderId();
    setOrderId(id);

    try {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          order: buildOrder(id),
          demo: !publicKey || !publicKey.startsWith('pk_'),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Payment verification failed');

      openWhatsApp(id);
      setStep('success');
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      return;
    }

    if (deliveryMethod === 'doorstep' && !formData.address) {
      setError('Please enter your delivery address.');
      return;
    }

    if (deliveryMethod === 'waybill' && !formData.motorPark) {
      setError('Please enter your nearest Lagos motor park.');
      return;
    }

    if (paymentMethod === 'whatsapp') {
      handleWhatsAppOrder();
    } else {
      setStep('payment');
    }
  };

  const closeAndReset = () => {
    setStep('form');
    setFormData({ fullName: '', email: '', phone: '', address: '', motorPark: '' });
    setDeliveryMethod('pickup');
    setPaymentMethod('whatsapp');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeAndReset}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative bg-cream rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={closeAndReset}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gold transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {step === 'form' && (
              <div className="p-8 md:p-10">
                <h2 className="font-display text-3xl font-bold mb-2">Complete Your Order</h2>
                <p className="text-gray-600 text-sm mb-8">Fill in your details and choose delivery & payment methods.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                        placeholder="Chioma Peace"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                      placeholder="+234 801 234 5678"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Delivery Method</label>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`p-4 rounded-xl border text-left transition-all ${deliveryMethod === 'pickup' ? 'border-gold bg-gold/10' : 'border-gray-200 bg-white hover:border-gold'}`}
                      >
                        <Store className="w-5 h-5 mb-2 text-gold-dark" />
                        <p className="font-semibold text-sm">Pickup</p>
                        <p className="text-xs text-gray-500">Free</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('doorstep')}
                        className={`p-4 rounded-xl border text-left transition-all ${deliveryMethod === 'doorstep' ? 'border-gold bg-gold/10' : 'border-gray-200 bg-white hover:border-gold'}`}
                      >
                        <Truck className="w-5 h-5 mb-2 text-gold-dark" />
                        <p className="font-semibold text-sm">Doorstep</p>
                        <p className="text-xs text-gray-500">+₦3,000 in Aba</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('waybill')}
                        className={`p-4 rounded-xl border text-left transition-all ${deliveryMethod === 'waybill' ? 'border-gold bg-gold/10' : 'border-gray-200 bg-white hover:border-gold'}`}
                      >
                        <MapPin className="w-5 h-5 mb-2 text-gold-dark" />
                        <p className="font-semibold text-sm">Waybill</p>
                        <p className="text-xs text-gray-500">To Lagos park</p>
                      </button>
                    </div>
                  </div>

                  {deliveryMethod === 'doorstep' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Delivery Address</label>
                      <textarea
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                        rows={3}
                        placeholder="123 Fashion Street, Aba"
                      />
                    </motion.div>
                  )}

                  {deliveryMethod === 'waybill' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Nearest Lagos Motor Park</label>
                      <input
                        type="text"
                        value={formData.motorPark}
                        onChange={e => setFormData({ ...formData, motorPark: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                        placeholder="Ojota Motor Park"
                      />
                    </motion.div>
                  )}

                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Payment Method</label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('whatsapp')}
                        className={`p-4 rounded-xl border text-left transition-all ${paymentMethod === 'whatsapp' ? 'border-gold bg-gold/10' : 'border-gray-200 bg-white hover:border-gold'}`}
                      >
                        <MessageCircle className="w-5 h-5 mb-2 text-green-600" />
                        <p className="font-semibold text-sm">WhatsApp Order</p>
                        <p className="text-xs text-gray-500">Confirm via chat</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border text-left transition-all ${paymentMethod === 'card' ? 'border-gold bg-gold/10' : 'border-gray-200 bg-white hover:border-gold'}`}
                      >
                        <CreditCard className="w-5 h-5 mb-2 text-gold-dark" />
                        <p className="font-semibold text-sm">Card Payment</p>
                        <p className="text-xs text-gray-500">Pay with Paystack</p>
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <div className="border-t border-gray-200 pt-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span>{formatCurrency(deliveryFees[deliveryMethod])}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="font-display">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-charcoal text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-gold hover:text-charcoal transition-colors disabled:opacity-70"
                  >
                    {loading ? 'Processing...' : paymentMethod === 'whatsapp' ? 'Place Order via WhatsApp' : 'Proceed to Card Payment'}
                  </button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="p-8 md:p-10">
                <h2 className="font-display text-3xl font-bold mb-2">Pay Securely</h2>
                <p className="text-gray-600 text-sm mb-6">Complete your payment of {formatCurrency(total)}.</p>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-medium">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span className="font-display">{formatCurrency(total)}</span>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <PaystackPayment
                  email={formData.email}
                  amount={total}
                  metadata={{ custom_fields: [{ display_name: 'Customer Name', variable_name: 'customer_name', value: formData.fullName }] }}
                  onSuccess={handleCardSuccess}
                  onClose={() => setLoading(false)}
                />

                <button
                  onClick={() => setStep('form')}
                  className="w-full mt-4 py-3 text-sm font-semibold underline underline-offset-4 hover:text-gold-dark transition-colors"
                >
                  Back to Order Details
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="p-10 md:p-16 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="font-display text-3xl font-bold mb-4">Order Received!</h2>
                <p className="text-gray-600 mb-2">Your order ID is</p>
                <p className="font-mono text-xl font-bold bg-gold/10 inline-block px-4 py-2 rounded-lg mb-6">{orderId}</p>
                <p className="text-gray-600 text-sm mb-8 max-w-md mx-auto">
                  {paymentMethod === 'card'
                    ? 'Your payment was successful. We have also opened WhatsApp with your order summary.'
                    : deliveryMethod === 'pickup'
                    ? 'You will receive a message shortly with pickup details.'
                    : 'We\'ve opened WhatsApp with your order summary. Send it to confirm your order.'}
                </p>
                <button
                  onClick={closeAndReset}
                  className="px-8 py-3 bg-charcoal text-white rounded-xl font-semibold hover:bg-gold hover:text-charcoal transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
