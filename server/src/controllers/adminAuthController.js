import supabase from '../services/supabaseService.js'
import crypto from 'crypto'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
const fallbackAdmins = globalThis.__peaceApparelAdmins || (globalThis.__peaceApparelAdmins = {})

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

function verifyTokenRaw(token) {
  try {
    const [header, body, signature] = token.split('.')
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
    if (signature !== expected) return null
    return JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    return null
  }
}

function fallbackLogin(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const admin = fallbackAdmins[normalizedEmail]
  if (!admin) return null
  if (admin.password !== String(password)) return null
  return {
    token: signToken({ userId: admin.id, email: admin.email, exp: Date.now() + 86400000 }),
    user: { id: admin.id, email: admin.email, role: admin.role || 'admin' },
  }
}

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body || {}
    const fallback = fallbackLogin(email, password)

    if (fallback) return res.json(fallback)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) return res.status(401).json({ error: 'Invalid credentials' })
      const token = signToken({ userId: data.user.id, email: data.user.email, exp: Date.now() + 86400000 })
      return res.json({ token, user: { id: data.user.id, email: data.user.email } })
    } catch (err) {
      const fallbackAfterTry = fallbackLogin(email, password)
      if (fallbackAfterTry) return res.json(fallbackAfterTry)
      return res.status(401).json({ error: err.message || 'Invalid credentials' })
    }
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function verifyAdmin(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = verifyTokenRaw(token)
    if (!payload || payload.exp < Date.now()) return res.status(401).json({ error: 'Token expired' })
    return res.json({ user: { id: payload.userId, email: payload.email } })
  } catch (err) {
    console.error('Verify admin error:', err)
    res.status(500).json({ error: err.message })
  }
}
