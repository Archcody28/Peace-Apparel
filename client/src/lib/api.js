export async function apiFetch(path, opts = {}) {
  const base = import.meta.env.VITE_API_URL || '';
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  // Attach the admin token (if present) so protected endpoints work.
  const token = localStorage.getItem('pa_admin_token');
  const headers = new Headers(opts.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...opts, headers });
}
