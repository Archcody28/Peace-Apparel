import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data || {});
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const settings = req.body;
      const { data: existing } = await supabase.from('settings').select('id').single();
      let result;
      if (existing) {
        result = await supabase.from('settings').update(settings).eq('id', existing.id).select().single();
      } else {
        result = await supabase.from('settings').insert(settings).select().single();
      }
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Settings API error:', err);
    res.status(500).json({ error: err.message });
  }
}
