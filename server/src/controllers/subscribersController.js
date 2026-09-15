import supabase from '../services/supabaseService.js'

export async function getSubscribers(req, res) {
  try {
    const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('Subscribers error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function createSubscriber(req, res) {
  try {
    const { email } = req.body
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' })
    }
    const { data, error } = await supabase.from('subscribers').insert({ email }).select().single()
    if (error) {
      // Handle unique constraint: return ok if already exists
      if (error.code === '23505') return res.status(200).json({ ok: true, existing: true })
      throw error
    }
    res.status(201).json(data)
  } catch (err) {
    console.error('Create subscriber error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function deleteSubscriber(req, res) {
  try {
    const { id } = req.body
    const { error } = await supabase.from('subscribers').delete().eq('id', id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete subscriber error:', err)
    res.status(500).json({ error: err.message })
  }
}
