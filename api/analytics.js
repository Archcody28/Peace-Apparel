import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const [products, orders, subscribers, testimonials] = await Promise.all([
      supabase.from('products').select('id,price,stock', { count: 'exact', head: true }),
      supabase.from('orders').select('*'),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }),
    ]);

    const totalRevenue = (orders.data || []).reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = (orders.data || []).filter(o => o.status === 'pending').length;
    const completedOrders = (orders.data || []).filter(o => o.status === 'completed').length;

    const statusCounts = {
      pending: (orders.data || []).filter(o => o.status === 'pending').length,
      processing: (orders.data || []).filter(o => o.status === 'processing').length,
      completed: (orders.data || []).filter(o => o.status === 'completed').length,
    };

    const last14Days = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      last14Days[key] = 0;
    }
    (orders.data || []).forEach(o => {
      const day = o.created_at ? o.created_at.split('T')[0] : null;
      if (day && last14Days.hasOwnProperty(day)) {
        last14Days[day] += o.total || 0;
      }
    });

    return res.status(200).json({
      totalProducts: products.count || 0,
      totalOrders: orders.data?.length || 0,
      totalSubscribers: subscribers.count || 0,
      totalTestimonials: testimonials.count || 0,
      totalRevenue,
      pendingOrders,
      completedOrders,
      statusCounts,
      revenueByDay: last14Days,
    });
  } catch (err) {
    console.error('Analytics API error:', err);
    res.status(500).json({ error: err.message });
  }
}
