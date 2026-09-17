import crypto from 'crypto';

// Canonical admin JWT implementation for the whole server.
// ONE place signs, ONE place verifies. No secret fallbacks.
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'ADMIN_JWT_SECRET is not set. Admin authentication cannot start securely. ' +
    'Set ADMIN_JWT_SECRET in server/.env (do NOT reuse other secrets).'
  );
}

const TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24h

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** Sign an admin token. Payload: { userId, email, role }. exp is seconds (standard JWT). */
export function signAdminToken({ userId, email, role = 'admin' }) {
  const header = base64urlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64urlJson({
    userId,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

/**
 * Verify a token. Returns the payload or null.
 * Accepts legacy tokens whose exp was stored in milliseconds.
 */
export function verifyAdminToken(token) {
  try {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString());
    if (parsedHeader.alg !== 'HS256') return null; // algorithm pinning

    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const body = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!body.exp) return null;
    const expMs = body.exp > 1e12 ? body.exp : body.exp * 1000; // legacy ms tokens
    if (expMs < Date.now()) return null; // expired

    return { userId: body.userId, email: body.email, role: body.role };
  } catch {
    return null; // malformed / tampered
  }
}

/** Extract the Bearer token from an Authorization header, or null. */
export function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
