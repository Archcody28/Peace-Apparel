import { extractBearerToken, verifyAdminToken } from '../services/tokenService.js';

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
 */
export function requireAdmin(req, res, next) {
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
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  return next();
}
