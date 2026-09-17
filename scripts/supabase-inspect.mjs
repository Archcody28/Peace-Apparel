// READ-ONLY Supabase schema inspection (Phase 4 Step 4).
// - Loads server/.env via the same mechanism as server/src/loadEnv.ts.
// - Never prints secret values; only presence, shapes and types.
// - Performs GET-only requests (OpenAPI metadata, single-row samples with
//   values redacted, storage bucket listing). No insert/update/delete/rpc.
// Usage: node scripts/supabase-inspect.mjs
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../server/.env', import.meta.url)), quiet: true });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('== 1. Environment (presence only) ==');
for (const name of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_JWT_SECRET']) {
  const v = process.env[name];
  console.log(`${name}: ${v && v.trim() ? 'PRESENT' : 'MISSING'}${v && v.trim() ? ` (length ${v.trim().length})` : ''}`);
}
if (!SUPABASE_URL?.trim() || !SERVICE_ROLE?.trim()) {
  console.log('BLOCKED: missing Supabase credentials; live inspection aborted.');
  process.exit(2);
}

const TABLES = ['products', 'orders', 'order_payments', 'subscribers', 'testimonials', 'homepage_features', 'categories', 'settings'];
const headers = {
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
  Accept: 'application/openapi+json',
};

const redact = (row) => {
  const shape = {};
  for (const [k, v] of Object.entries(row)) {
    shape[k] = v === null ? 'null' : Array.isArray(v) ? `array(${v.length})[${typeof v[0]}]` : typeof v === 'string' ? `string(${v.length})` : typeof v;
  }
  return shape;
};

try {
  console.log('\n== 2. Connectivity / service-role auth ==');
  const host = new URL(SUPABASE_URL).host;
  console.log(`Endpoint host: ${host}`); // host only; never the key
  const openapiRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/`, { headers, signal: AbortSignal.timeout(15000) });
  console.log(`GET /rest/v1/ -> HTTP ${openapiRes.status}`);
  if (!openapiRes.ok) {
    console.log(openapiRes.status === 401 || openapiRes.status === 403 ? 'Authentication FAILED (service role rejected).' : 'Endpoint reachable but metadata request failed.');
    process.exit(2);
  }
  const spec = await openapiRes.json();
  const defs = spec.definitions ?? {};
  const tableNames = Object.keys(defs);
  console.log(`OpenAPI schema loaded: ${tableNames.length} exposed relations (service-role auth succeeded).`);
  console.log(`Exposed relations: ${tableNames.sort().join(', ')}`);
  console.log('Project identity: metadata served by the configured endpoint host; treated as the intended project (host above).');

  console.log('\n== 2b. Service-role privilege proof (read-only auth admin probe) ==');
  // /auth/v1/admin/users requires true service-role privileges; count only.
  const authRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users?per_page=1`, { headers, signal: AbortSignal.timeout(15000) });
  if (authRes.ok) {
    const authBody = await authRes.json();
    console.log(`GET /auth/v1/admin/users -> HTTP ${authRes.status}; users returned: ${authBody.users?.length ?? '?'}; total (redacted): ${typeof authBody.total === 'number' ? 'numeric' : 'n/a'}`);
    console.log('Service-role privileges CONFIRMED (admin endpoint accessible).');
  } else {
    console.log(`GET /auth/v1/admin/users -> HTTP ${authRes.status}; service-role privilege proof inconclusive.`);
  }

  console.log('\n== 3. Live table metadata (columns / types / keys) ==');
  for (const table of TABLES) {
    const def = defs[table];
    if (!def) { console.log(`\n[${table}] NOT PRESENT in exposed schema`); continue; }
    const required = new Set(def.required ?? []);
    console.log(`\n[${table}] present; columns:`);
    for (const [col, meta] of Object.entries(def.properties ?? {})) {
      const type = meta.type === 'array' ? `${meta.type}<${meta.items?.type ?? '?'}>` : [meta.type, meta.format].filter(Boolean).join(':');
      const note = (meta.description ?? '').replace(/\s*Note:\s*/g, '').replace(/<p>/gi, '').replace(/<\/p>/gi, '').replace(/\s+/g, ' ').trim();
      console.log(`  ${col.padEnd(24)} ${type.padEnd(16)} ${required.has(col) ? 'NOT NULL/req' : 'nullable'} ${note ? `| ${note}` : ''}`);
    }
  }

  console.log('\n== 3b. Direct table probes (read-only GET, existence check) ==');
  const selectHeaders = { ...headers, Accept: 'application/json' };
  for (const table of TABLES) {
    try {
      const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?select=*&limit=1`, { headers: selectHeaders, signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const rows = await res.json();
        console.log(`[${table}] EXISTS, HTTP ${res.status}, rows returned: ${rows.length}${rows.length ? ` shape: ${JSON.stringify(redact(rows[0]))}` : ' (empty)'}`);
      } else {
        const body = await res.json().catch(() => ({}));
        console.log(`[${table}] HTTP ${res.status} code=${body.code ?? 'n/a'} message=${(body.message ?? 'n/a').slice(0, 120)} hint=${(body.hint ?? '').slice(0, 80)}`);
      }
    } catch (e) {
      console.log(`[${table}] probe error: ${e.name}: ${e.message}`);
    }
  }

  console.log('\n== 3c. Live row shapes (values REDACTED; first row only) ==');
  for (const table of TABLES) {
    if (!defs[table]) continue;
    try {
      const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?select=*&limit=1`, { headers: selectHeaders, signal: AbortSignal.timeout(15000) });
      if (!res.ok) { console.log(`[${table}] sample query HTTP ${res.status} (no rows read)`); continue; }
      const rows = await res.json();
      if (!rows.length) { console.log(`[${table}] empty table (0 rows) — shape from metadata only`); continue; }
      console.log(`[${table}] live row shape: ${JSON.stringify(redact(rows[0]))}`);
    } catch (e) {
      console.log(`[${table}] sample query error: ${e.name}: ${e.message}`);
    }
  }

  console.log('\n== 4. Storage (read-only listing) ==');
  try {
    const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/bucket`, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.log(`Bucket listing HTTP ${res.status} (cannot inspect storage)`); }
    else {
      const buckets = await res.json();
      for (const b of buckets) console.log(`bucket: ${b.name} public=${b.public} created=${b.created_at ?? 'n/a'}`);
      if (!buckets.length) console.log('No buckets visible to service role.');
    }
  } catch (e) { console.log(`Storage listing error: ${e.message}`); }

  console.log('\n== RLS note ==');
  console.log('RLS/policy internals are not exposed through the REST metadata API; service-role queries bypass RLS, so per-table policy state is reported as UNKNOWN here unless a direct Postgres connection is provided.');
} catch (e) {
  console.log(`FATAL: ${e.name}: ${e.message}`);
  process.exit(2);
}
