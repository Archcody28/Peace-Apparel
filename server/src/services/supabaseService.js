import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// TEMPORARY DIAGNOSTIC (Step 12 — do NOT commit).
// Determines the runtime Supabase key's JWT role WITHOUT printing the secret.
// Safe: decodes only the local JWT payload; no network; no secret logging.
// Remove this block (and the export) once the production key role is confirmed.
function diagnoseKeyRole() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    console.warn('Supabase runtime key: not set (SUPABASE_SERVICE_ROLE_KEY empty)')
    return
  }
  if (typeof key !== 'string' || key.split('.').length !== 3) {
    console.warn('Supabase runtime key format: non-JWT')
    return
  }
  try {
    const payloadB64 = key.split('.')[1]
        const pad = (s) => s + '='.repeat((4 - (s.length % 4)) % 4)
    const json = Buffer.from(pad(payloadB64.replace(/-/g, '+').replace(/_/g, '/')), 'base64').toString('utf8')
    const payload = JSON.parse(json)
    const role = payload.role ?? 'unknown'
    const iss = payload.iss ?? 'n/a'
    const ref = payload.ref ?? 'n/a'
    console.warn(`Supabase runtime key role: ${role} (iss=${iss}, ref=${ref})`)
  } catch {
    console.warn('Supabase runtime key format: non-JWT (decode failed)')
  }
}
if (process.env.NODE_ENV !== 'test' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  diagnoseKeyRole()
}
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase service credentials are not set in environment.')
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export default supabase
