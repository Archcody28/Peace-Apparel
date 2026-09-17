import supabase from '../services/supabaseService.js'

export async function verifyPayment(req, res) {
  try {
        const { reference, order } = req.body
    if (!reference || !order) return res.status(400).json({ error: 'Reference and order are required' })

    let paymentStatus = 'success'
    let gatewayResponse = null
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    // Demo mode is a SERVER-side decision: it is active only when no Paystack
    // secret is configured. A client can never force demo mode to mark an
    // order as paid while real verification is available.
    if (!secretKey) {
      gatewayResponse = { demo: true, message: 'Simulated successful card payment (demo mode: no PAYSTACK_SECRET_KEY configured)' }
    } else {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      })
      const paystackData = await paystackRes.json()
      gatewayResponse = paystackData
      if (!paystackData.status || paystackData.data?.status !== 'success') return res.status(400).json({ error: 'Payment verification failed' })
      paymentStatus = 'success'
    }

    const { data: savedOrder, error: orderError } = await supabase.from('orders').insert(order).select().single()
    if (orderError) throw orderError

    const { error: paymentError } = await supabase.from('order_payments').insert({
      order_id: savedOrder.id,
      payment_method: 'card',
      payment_reference: reference,
      payment_status: paymentStatus,
      amount: order.total,
      gateway_response: gatewayResponse,
    })
    if (paymentError) throw paymentError

    return res.json({ ok: true, order: savedOrder, demo: !secretKey })
  } catch (err) {
    console.error('Verify payment error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
