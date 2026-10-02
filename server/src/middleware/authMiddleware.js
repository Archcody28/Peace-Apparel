import { extractBearerToken, verifyAdminToken } from '../services/tokenService.js';
import { getAdminSupabaseClient } from '../services/supabaseService.js';

/**
 * requireAuth — 401 unless a valid, non-expired admin JWT is presented.
 * Attaches a trusted identity to req.user: { id, email, role }.
 * The identity NEVER comes from the request body.
 */
export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    // Invalid, malformed, tampered, or expired — no detail leaked.
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = { id: payload.userId, email: payload.email, role: payload.role || null };
  return next();
}

/**
 * requireAdmin — authenticates the request and requires the admin role.
 * 401 when authentication fails, 403 when the identity is not an admin.
 * Usable standalone at the route boundary: requireAdmin, controller.
 *
 * On success it also resolves req.supabase: a client executing as the admin's
 * OWN Supabase Auth identity (session captured at login), so RLS authorizes
 * every subsequent read/write. When no Supabase session exists for the token
 * (restart, expired refresh, minted test token) the request is refused with
 * 401 — there is no privileged fallback.
 */
export async function requireAdmin(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    // Invalid, malformed, tampered, or expired — no detail leaked.
    return res.status(401).json({ error: 'Authentication required' });
  }
  if ((payload.role || null) !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  try {
    const client = await getAdminSupabaseClient(payload.userId);
    if (!client) {
      return res.status(401).json({ error: 'Admin session expired, please sign in again' });
    }
    req.user = { id: payload.userId, email: payload.email, role: payload.role };
    req.supabase = client;
    return next();
  } catch (err) {
    console.error('Admin Supabase session error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
