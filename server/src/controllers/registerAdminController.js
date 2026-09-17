import supabase from '../services/supabaseService.js'
import { signAdminToken } from '../services/tokenService.js'

function parseJsonBody(req) {
  if (!req) return {}
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  const rawBody = req.body && Buffer.isBuffer(req.body) ? req.body.toString() : req.body
  if (!rawBody) return {}
  try {
    return typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody
  } catch {
    return {}
  }
}

export async function registerAdmin(req, res) {
  try {
    const expectedSecret = process.env.ADMIN_REGISTRATION_SECRET
    const providedSecret = req.headers['x-admin-registration-secret']
    if (!expectedSecret) return res.status(503).json({ error: 'Admin registration is not enabled on this server' })
    if (!providedSecret || providedSecret !== expectedSecret) return res.status(401).json({ error: 'Unauthorized registration request' })

    const payload = parseJsonBody(req)
    const { email, password } = payload || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const normalizedEmail = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Valid email is required' })
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long' })

    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      // Role is assigned server-side only; any client-supplied role is ignored.
      user_metadata: { role: 'admin' },
    })

    if (error) throw error

    const token = signAdminToken({ userId: data.user.id, email: data.user.email, role: 'admin' })
    return res.status(201).json({ message: 'Admin registered successfully', token, user: { id: data.user.id, email: data.user.email, role: 'admin' } })
  } catch (err) {
    console.error('Register admin error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
