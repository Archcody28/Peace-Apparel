import supabase from '../services/supabaseService.js';
import { signAdminToken } from '../services/tokenService.js';

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Privilege-escalation guard: only users provisioned as admins (see
    // scripts/create-admin.js, which sets user_metadata.role = 'admin')
    // may obtain an admin token. Client-supplied fields are never trusted.
    const role = data.user.user_metadata?.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const token = signAdminToken({ userId: data.user.id, email: data.user.email, role: 'admin' });
    return res.json({ token, user: { id: data.user.id, email: data.user.email, role: 'admin' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function verifyAdmin(req, res) {
  // Token already verified and identity attached by requireAuth middleware.
  return res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role } });
}
