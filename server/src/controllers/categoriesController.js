import supabase from '../services/supabaseService.js'

/**
 * Public category payload: exactly the fields consumers need.
 * - id   -> React list keys and admin mutation targets (same exposure as the
 *           public products read, which already returns product ids).
 * - name -> display text for Products chips, Footer links and admin lists.
 * Ordering (sort_order) happens server-side only and is never sent to clients.
 * Never widen this to '*': slug/image_url/created_at stay in the database.
 */
const PUBLIC_CATEGORY_FIELDS = ['id', 'name']
const PUBLIC_CATEGORY_SELECT = PUBLIC_CATEGORY_FIELDS.join(',')

function cleanName(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Defense in depth: project every row onto the public whitelist before it is
 * sent, mirroring getPublicSettings. The upstream select already asks for only
 * id+name, but nothing extra can ever leak even if the database returns more
 * columns than requested (mocked upstreams, view changes, select regressions).
 */
function toPublicCategory(row) {
  const publicRow = {}
  for (const field of PUBLIC_CATEGORY_FIELDS) {
    if (row && row[field] !== undefined) publicRow[field] = row[field]
  }
  return publicRow
}

function isDuplicateNameError(error) {
  return error && (error.code === '23505' || /duplicate key/i.test(error.message || ''))
}

export async function getCategories(req, res) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(PUBLIC_CATEGORY_SELECT)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }) // deterministic tie-break for equal sort_order
    if (error) throw error
    res.json((data || []).map(toPublicCategory))
  } catch (err) {
    console.error('Categories error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function createCategory(req, res) {
  try {
    const name = cleanName(req.body && req.body.name)
    if (!name) return res.status(400).json({ error: 'Category name is required' })
    // Whitelisted insert: clients cannot set id, sort_order or created_at.
    const { data, error } = await supabase
      .from('categories')
      .insert({ name })
      .select(PUBLIC_CATEGORY_SELECT)
      .single()
    if (error) {
      if (isDuplicateNameError(error)) {
        return res.status(409).json({ error: 'A category with that name already exists' })
      }
      throw error
    }
    res.status(201).json(toPublicCategory(data))
  } catch (err) {
    console.error('Create category error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function updateCategory(req, res) {
  try {
    const { id, name } = req.body || {}
    // Mirrors productController.updateProduct: missing id is a controlled 400,
    // an update matching no row is a 404 (PGRST116), not a server fault.
    if (!id) return res.status(400).json({ error: 'Category id is required' })
    const trimmed = cleanName(name)
    if (!trimmed) return res.status(400).json({ error: 'Category name is required' })
    const { data, error } = await supabase
      .from('categories')
      .update({ name: trimmed })
      .eq('id', id)
      .select(PUBLIC_CATEGORY_SELECT)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Category not found' })
      if (isDuplicateNameError(error)) {
        return res.status(409).json({ error: 'A category with that name already exists' })
      }
      throw error
    }
    res.json(toPublicCategory(data))
  } catch (err) {
    console.error('Update category error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Category id is required' })
    // Deletes only the categories row. Products keep their stored category
    // values — no cascade, no product data is touched.
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete category error:', err)
    res.status(500).json({ error: err.message })
  }
}
