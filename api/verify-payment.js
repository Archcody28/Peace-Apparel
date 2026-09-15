import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { reference, order, demo } = req.body;
    if (!reference || !order) {
      return res.status(400).json({ error: 'Reference and order are required' });
    }

    let paymentStatus = 'success';
    let gatewayResponse = null;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (demo || !secretKey) {
      // Demo mode: simulate successful verification
      paymentStatus = 'success';
      gatewayResponse = { demo: true, message: 'Simulated successful card payment' };
    } else {
      // Real Paystack verification
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });
      const paystackData = await paystackRes.json();
      gatewayResponse = paystackData;

      if (!paystackData.status || paystackData.data?.status !== 'success') {
        return res.status(400).json({ error: 'Payment verification failed', details: paystackData });
      }
      paymentStatus = 'success';
    }

    // Save order (orders table does not have payment columns, keep it clean)
    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (orderError) throw orderError;

    // Save payment record
    const { error: paymentError } = await supabase.from('order_payments').insert({
      order_id: savedOrder.id,
      payment_method: 'card',
      payment_reference: reference,
      payment_status: paymentStatus,
      amount: order.total,
      gateway_response: gatewayResponse,
    });

    if (paymentError) throw paymentError;

    return res.status(200).json({
      ok: true,
      order: savedOrder,
      demo: demo || !secretKey,
    });
  } catch (err) {
    console.error('Verify payment API error:', err);
    res.status(500).json({ error: err.message });
  }
}
