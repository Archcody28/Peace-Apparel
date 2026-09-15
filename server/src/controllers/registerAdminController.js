import crypto from 'crypto'
import supabase from '../services/supabaseService.js'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
const fallbackAdmins = globalThis.__peaceApparelAdmins || (globalThis.__peaceApparelAdmins = {})

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

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

function registerFallbackAdmin(email, password) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = fallbackAdmins[normalizedEmail]

  if (existing) {
    return { user: existing, token: signToken({ userId: existing.id, email: existing.email, exp: Date.now() + 86400000 }) }
  }

  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password: String(password),
    role: 'admin',
  }

  fallbackAdmins[normalizedEmail] = user

  return {
    user: { id: user.id, email: user.email, role: user.role },
    token: signToken({ userId: user.id, email: user.email, exp: Date.now() + 86400000 }),
  }
}

export async function registerAdmin(req, res) {
  try {
    const expectedSecret = process.env.ADMIN_REGISTRATION_SECRET
    const providedSecret = req.headers['x-admin-registration-secret']
    if (expectedSecret && providedSecret !== expectedSecret) return res.status(401).json({ error: 'Unauthorized registration request' })

    const payload = parseJsonBody(req)
    const { email, password } = payload || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const normalizedEmail = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Valid email is required' })
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long' })

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: { role: 'admin' },
      })

      if (error) throw error

      const token = signToken({ userId: data.user.id, email: data.user.email, exp: Date.now() + 86400000 })
      return res.status(201).json({ message: 'Admin registered successfully', token, user: { id: data.user.id, email: data.user.email, role: 'admin' } })
    } catch (err) {
      console.warn('Falling back to local admin registration:', err.message || err)
      const fallback = registerFallbackAdmin(normalizedEmail, password)
      return res.status(201).json({ message: 'Admin registered successfully (local fallback)', token: fallback.token, user: fallback.user })
    }
  } catch (err) {
    console.error('Register admin error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
