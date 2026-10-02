import supabase from '../services/supabaseService.js'

export async function getSettings(req, res) {
  try {
    const { data, error } = await req.supabase.from('settings').select('*').single()
    if (error && error.code !== 'PGRST116') throw error
    res.json(data || {})
  } catch (err) {
    console.error('Settings error:', err)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Public storefront settings.
 *
 * GET /api/settings is admin-only (full row). This handler exposes ONLY the
 * whitelisted public store-identity fields so Footer / Contact / WhatsApp
 * links can render the real database values. Never add secrets, payment keys,
 * credentials or internal configuration to PUBLIC_SETTINGS_FIELDS.
 */
const PUBLIC_SETTINGS_FIELDS = ['store_name', 'phone', 'email', 'address', 'whatsapp_number']

export async function getPublicSettings(req, res) {
  try {
    const { data, error } = await supabase.from('settings').select(PUBLIC_SETTINGS_FIELDS.join(',')).single()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return res.json({})
    const publicSettings = {}
    for (const field of PUBLIC_SETTINGS_FIELDS) {
      if (data[field] !== undefined) publicSettings[field] = data[field]
    }
    res.json(publicSettings)
  } catch (err) {
    console.error('Public settings error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function saveSettings(req, res) {
  try {
    const settings = req.body
    const { data: existing } = await req.supabase.from('settings').select('id').single()
    let result
    if (existing) {
      result = await req.supabase.from('settings').update(settings).eq('id', existing.id).select().single()
    } else {
      result = await req.supabase.from('settings').insert(settings).select().single()
    }
    if (result.error) throw result.error
    return res.json(result.data)
  } catch (err) {
    console.error('Save settings error:', err)
    res.status(500).json({ error: err.message })
  }
}
