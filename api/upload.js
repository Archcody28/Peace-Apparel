import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, fileBase64, contentType } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'fileName and fileBase64 are required' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const safeName = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const { data, error } = await supabase.storage
      .from('peace-apparel')
      .upload(safeName, buffer, { contentType: contentType || 'image/jpeg', upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('peace-apparel').getPublicUrl(safeName);
    return res.status(200).json({ url: urlData.publicUrl, path: safeName });
  } catch (err) {
    console.error('Upload API error:', err);
    res.status(500).json({ error: err.message });
  }
}
