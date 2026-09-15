import supabase from '../../../api/db-client.js';

export async function getProducts(req, res) {
  try {
    const { category, search, featured, limit = 200 } = req.query;
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') query = query.contains('categories', [category]);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (featured === 'true') query = query.eq('featured', true);
    if (limit) query = query.limit(parseInt(limit));
    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function createProduct(req, res) {
  try {
    const product = req.body;
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id, ...updates } = req.body;
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.body;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
