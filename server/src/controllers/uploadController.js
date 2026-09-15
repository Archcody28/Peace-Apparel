import supabase from '../services/supabaseService.js'

export async function uploadFile(req, res) {
  try {
    const { fileName, fileBase64, contentType } = req.body
    if (!fileName || !fileBase64) return res.status(400).json({ error: 'fileName and fileBase64 are required' })

    const buffer = Buffer.from(fileBase64, 'base64')
    const safeName = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`

    const { data, error } = await supabase.storage
      .from('peace-apparel')
      .upload(safeName, buffer, { contentType: contentType || 'image/jpeg', upsert: true })

    if (error) throw error

    const { data: urlData } = supabase.storage.from('peace-apparel').getPublicUrl(safeName)
    return res.json({ url: urlData.publicUrl, path: safeName })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message })
  }
}
