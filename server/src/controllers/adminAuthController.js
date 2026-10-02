import { createAuthClient, createUserClient } from '../services/supabaseService.js';
import { storeAdminSession } from '../services/adminSessionStore.js';
import { signAdminToken } from '../services/tokenService.js';

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Throwaway client: the shared public client must never inherit a session.
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user || !data.session) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Admin role = membership in public.admin_users — the exact table RLS
    // (public.is_admin()) authorizes. The check runs AS THE SIGNED-IN USER
    // (their access token), because admin_users is readable only by self or an
    // existing admin; the bare anon client would see zero rows. Membership rows
    // are insertable only by an existing admin, so a self-asserted
    // user_metadata.role from a public signup can never grant admin. Legacy
    // metadata admins are backfilled by migration
    // 20261002180000_admin_membership_and_rls_policies.sql.
    const userClient = createUserClient(data.session.access_token);
    const { data: memberships, error: membershipError } = await userClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', data.user.id);
    if (membershipError) throw membershipError;
    if (!Array.isArray(memberships) || memberships.length === 0) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Keep the Supabase session server-side so admin DB/storage operations run
    // as this authenticated user (requireAdmin resolves req.supabase). The
    // custom token below only identifies the admin; alone it grants no
    // database power — without a stored session, admin mutations answer 401.
    if (!storeAdminSession(data.user.id, data.session)) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
