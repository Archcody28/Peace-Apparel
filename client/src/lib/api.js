export async function apiFetch(path, opts) {
  const base = import.meta.env.VITE_API_URL || '';
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  return fetch(url, opts);
}
