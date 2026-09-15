import supabase from '../services/supabaseService.js'

export async function getCategories(req, res) {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('Categories error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function createCategory(req, res) {
  try {
    const category = req.body
    const { data, error } = await supabase.from('categories').insert(category).select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('Create category error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function updateCategory(req, res) {
  try {
    const { id, ...updates } = req.body
    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Update category error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.body
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete category error:', err)
    res.status(500).json({ error: err.message })
  }
}
