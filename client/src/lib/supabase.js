import { createClient } from '@supabase/supabase-js';

// Browser Supabase client (anon key only — never a service-role key).
// Retained for AuthContext's getSession/onAuthStateChange subscriptions.
// No direct browser table/storage operations were found in the current client.
// Table operations and uploads use Express; this does not prove live RLS safety.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default supabase;
