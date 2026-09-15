import supabase from '../services/supabaseService.js'

export async function getAnalytics(req, res) {
  try {
    const [products, orders, subscribers, testimonials] = await Promise.all([
      supabase.from('products').select('id,price,stock', { count: 'exact', head: true }),
      supabase.from('orders').select('*'),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }),
    ])

    const totalRevenue = (orders.data || []).reduce((sum, o) => sum + (o.total || 0), 0)

    const statusCounts = {
      pending: (orders.data || []).filter(o => o.status === 'pending').length,
      processing: (orders.data || []).filter(o => o.status === 'processing').length,
      completed: (orders.data || []).filter(o => o.status === 'completed').length,
    }

    const today = new Date()
    const last14Days = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      last14Days[key] = 0
    }
    (orders.data || []).forEach(o => {
      const day = o.created_at ? o.created_at.split('T')[0] : null
      if (day && Object.prototype.hasOwnProperty.call(last14Days, day)) {
        last14Days[day] += o.total || 0
      }
    })

    return res.json({
      totalProducts: products.count || 0,
      totalOrders: orders.data?.length || 0,
      totalSubscribers: subscribers.count || 0,
      totalTestimonials: testimonials.count || 0,
      totalRevenue,
      statusCounts,
      revenueByDay: last14Days,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: err.message })
  }
}
