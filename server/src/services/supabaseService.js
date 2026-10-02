import { createClient } from '@supabase/supabase-js'
import { getAdminAccessToken } from './adminSessionStore.js'

// No privileged credential exists anywhere in this process. Every client is
// created with the public anon key, and authorization context is added
// explicitly and per use:
//   - default export:      public/anon context; shared reads and public writes.
//                          Never mutated, never carries a user token.
//   - createAuthClient():  throwaway client for signInWithPassword so the
//                          shared public client can never inherit a session.
//   - getAdminSupabaseClient(userId):
//                          anon key + that admin's own Supabase access token
//                          (from adminSessionStore), so RLS policies
//                          (public.is_admin()) authorize every admin operation
//                          as the authenticated user. Server never bypasses RLS.

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or SUPABASE_ANON_KEY is not set in environment.')
}

function buildClient(headers = {}) {
  return createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    ...(Object.keys(headers).length ? { global: { headers } } : {}),
  })
}

/** Public/anon client for public reads and public (guest) writes. */
const supabase = buildClient()
export default supabase

/** Fresh throwaway client for auth calls (admin login). Never shared. */
export function createAuthClient() {
  return buildClient()
}

/**
 * Client bound to one signed-in user's Supabase access token. Used for the
 * login-time membership check so RLS evaluates `auth.uid()` as that user
 * (public.admin_users is readable only by self or an existing admin).
 */
export function createUserClient(accessToken) {
  return buildClient({ Authorization: `Bearer ${accessToken}` })
}

/**
 * Admin client that executes as the authenticated Supabase user behind
 * requireAdmin. Returns null when no stored session exists for the user —
 * callers must answer 401 rather than fall back to any privileged path.
 */
export async function getAdminSupabaseClient(userId) {
  const accessToken = await getAdminAccessToken(userId)
  if (!accessToken) return null
  return buildClient({ Authorization: `Bearer ${accessToken}` })
}
