import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { apiFetch } from '../lib/api';

const AuthContext = createContext({ user: null, session: null, loading: true, isAdmin: false, checkAdmin: async () => false });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Validates an admin token (defaults to the stored one) and records the result.
  // Returns true only when the server accepted the token. apiFetch rejects on
  // non-2xx, so an invalid/expired/rejected token lands in the catch below and
  // never produces an authenticated state. Token values are never logged.
  const checkAdmin = useCallback(async (token) => {
    if (!token) {
      const stored = localStorage.getItem('pa_admin_token');
      token = stored;
    }
    if (!token) {
      setIsAdmin(false);
      return false;
    }
    try {
      await apiFetch('/api/admin-auth', { headers: { Authorization: `Bearer ${token}` } });
      setIsAdmin(true);
      return true;
    } catch {
      setIsAdmin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        // Await the admin validation before releasing `loading`: otherwise
        // ProtectedAdmin reads isAdmin=false while the check is still in
        // flight and redirects a valid session to /login (admin data then
        // never loads on refresh or hard navigation to /admin).
        await checkAdmin(session?.access_token);
      } catch {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    init();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // This event can fire while `init` is still awaiting its own check;
        // release `loading` only after this validation settles as well so a
        // race between the two paths cannot expose isAdmin=false to the router.
        checkAdmin(session?.access_token).finally(() => setLoading(false));
      });

      return () => subscription?.unsubscribe?.();
    } catch {
      return undefined;
    }
  }, [checkAdmin]);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, setIsAdmin, checkAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
