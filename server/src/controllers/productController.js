import supabase from '../services/supabaseService.js';

// Canonical API representation: sizes/colors/images/categories are string[].
// Live database column types have NOT been verified. This existing boundary
// accepts arrays, JSON array strings and comma-separated input; it does not
// prove that these representations are accepted by the production database.
function toStringArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (value == null) return [];
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch { /* not JSON — fall through to CSV split */ }
    return s.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [String(value)];
}

function normalizeProduct(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    images: toStringArray(row.images),
    categories: toStringArray(row.categories ?? row.category),
    sizes: toStringArray(row.sizes),
    colors: toStringArray(row.colors),
  };
}

function coerceProductInput(body) {
  const product = { ...(body || {}) };
  for (const key of ['images', 'categories', 'sizes', 'colors']) {
    if (product[key] !== undefined) product[key] = toStringArray(product[key]);
  }
  return product;
}

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
    res.status(200).json((data || []).map(normalizeProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function createProduct(req, res) {
  try {
    const product = coerceProductInput(req.body);
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    res.status(201).json(normalizeProduct(data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id, ...rest } = req.body;
    // Mirrors homepageFeaturesController.updateHomepageFeature: a missing id must
    // be a controlled 400, and an update that matches no row is a 404, not a 500.
    if (!id) return res.status(400).json({ error: 'Product id is required' });
    const updates = coerceProductInput(rest);
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) {
      // PGRST116: .single() found no matching row — a not-found, not a server fault.
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Product not found' });
      throw error;
    }
    res.status(200).json(normalizeProduct(data));
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
