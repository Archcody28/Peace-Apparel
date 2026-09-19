import supabase from '../services/supabaseService.js'

export async function getHomepageFeatures(req, res) {
  try {
    const { section } = req.query || {}
    let query = supabase.from('homepage_features').select('*').order('sort_order', { ascending: true })
    if (section) query = query.eq('section', section)
    const { data, error } = await query
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('Homepage features error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function createHomepageFeature(req, res) {
  try {
    const feature = req.body
    const { data, error } = await supabase.from('homepage_features').insert(feature).select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('Create homepage feature error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function updateHomepageFeature(req, res) {
  try {
    const { id, ...updates } = req.body
    // Mirrors productController.updateProduct: a missing id must be a controlled
    // 400 rather than a 22P02 uuid cast error surfacing as a 500.
    if (!id) return res.status(400).json({ error: 'Feature id is required' })
    const { data, error } = await supabase.from('homepage_features').update(updates).eq('id', id).select().single()
    if (error) {
      // PGRST116: .single() found no matching row — a not-found, not a server fault.
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Homepage feature not found' })
      throw error
    }
    res.json(data)
  } catch (err) {
    console.error('Update homepage feature error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function deleteHomepageFeature(req, res) {
  try {
    const { id } = req.body
    const { error } = await supabase.from('homepage_features').delete().eq('id', id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete homepage feature error:', err)
    res.status(500).json({ error: err.message })
  }
}
