// Server-side store for authenticated admin Supabase sessions.
//
// The custom HS256 admin token (tokenService.js) only IDENTIFIES the admin;
// database/storage work must run as the admin's own Supabase Auth identity so
// RLS (public.is_admin()) authorizes it. loginAdmin stores the session that
// signInWithPassword returned here; requireAdmin resolves it per request.
// No privileged credential exists anywhere in this path.
//
// - Sessions live in process memory only: a restart means admins re-login.
// - Refresh-token rotation is serialized per user so concurrent admin requests
//   can never race a single-use refresh token.

const sessions = new Map(); // userId -> { accessToken, refreshToken, expiresAt }
const refreshing = new Map(); // userId -> Promise<string | null>

const EXPIRY_SKEW_SECONDS = 60;

function toEntry(session) {
  if (!session || !session.access_token || !session.refresh_token) return null;
  const expiresAt =
    typeof session.expires_at === 'number' && session.expires_at > 0
      ? session.expires_at
      : Math.floor(Date.now() / 1000) +
        (typeof session.expires_in === 'number' ? session.expires_in : 3600);
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt,
  };
}

/** Persist the Supabase session received at admin login. Returns false when
 *  the session payload is unusable (no token material). */
export function storeAdminSession(userId, session) {
  const entry = toEntry(session);
  if (!userId || !entry) return false;
  sessions.set(userId, entry);
  return true;
}

export function clearAdminSession(userId) {
  sessions.delete(userId);
}

/** Test/diagnostic helper: whether a session entry exists for a user. */
export function hasAdminSession(userId) {
  return sessions.has(userId);
}

/**
 * Resolve a valid Supabase access token for an admin, refreshing ahead of
 * expiry. Returns null when there is no stored session or the refresh is
 * rejected (revoked/expired refresh token) — callers must treat that as 401.
 * A transient network failure during refresh returns null but keeps the entry
 * so the next request retries instead of forcing an unnecessary re-login.
 */
export async function getAdminAccessToken(userId) {
  const entry = sessions.get(userId);
  if (!entry) return null;
  if (entry.expiresAt - EXPIRY_SKEW_SECONDS > Math.floor(Date.now() / 1000)) {
    return entry.accessToken;
  }
  const inFlight = refreshing.get(userId);
  if (inFlight) return inFlight;
  const task = refreshAccessToken(userId, entry).finally(() => refreshing.delete(userId));
  refreshing.set(userId, task);
  return task;
}

async function refreshAccessToken(userId, entry) {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: entry.refreshToken }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      // Definitive rejection: the refresh token is no longer valid.
      sessions.delete(userId);
      return null;
    }
    const body = await res.json();
    const next = toEntry({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_in: body.expires_in,
      expires_at: body.expires_at,
    });
    if (!next) {
      sessions.delete(userId);
      return null;
    }
    sessions.set(userId, next);
    return next.accessToken;
  } catch {
    // Network-level failure only: keep the entry, retry on the next request.
    return null;
  }
}
