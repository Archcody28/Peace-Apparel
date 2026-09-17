import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import { apiFetch } from '../lib/api';

const AuthContext = createContext({ user: null, session: null, loading: true, isAdmin: false });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = useCallback(async (token) => {
    if (!token) {
      const stored = localStorage.getItem('pa_admin_token');
      token = stored;
    }
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const res = await apiFetch('/api/admin-auth', { headers: { Authorization: `Bearer ${token}` } });
      setIsAdmin(res.ok);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        checkAdmin(session?.access_token);
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
        checkAdmin(session?.access_token);
        setLoading(false);
      });

      return () => subscription?.unsubscribe?.();
    } catch {
      return undefined;
    }
  }, [checkAdmin]);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, setIsAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
