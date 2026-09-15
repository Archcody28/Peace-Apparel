import supabase from '../services/supabaseService.js'

export async function getSettings(req, res) {
  try {
    const { data, error } = await supabase.from('settings').select('*').single()
    if (error && error.code !== 'PGRST116') throw error
    res.json(data || {})
  } catch (err) {
    console.error('Settings error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function saveSettings(req, res) {
  try {
    const settings = req.body
    const { data: existing } = await supabase.from('settings').select('id').single()
    let result
    if (existing) {
      result = await supabase.from('settings').update(settings).eq('id', existing.id).select().single()
    } else {
      result = await supabase.from('settings').insert(settings).select().single()
    }
    if (result.error) throw result.error
    return res.json(result.data)
  } catch (err) {
    console.error('Save settings error:', err)
    res.status(500).json({ error: err.message })
  }
}
