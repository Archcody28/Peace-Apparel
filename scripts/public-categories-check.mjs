#!/usr/bin/env node
// Focused Phase 9 check: public categories read + admin mutation behavior.
// Isolated: mocked PostgREST upstream, never a real Supabase database.
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://127.0.0.1:0';
process.env.SUPABASE_ANON_KEY = 'isolated-test-anon-key';
process.env.ADMIN_JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.PAYSTACK_SECRET_KEY = '';

const PUBLIC_FIELDS = ['id', 'name'];
const NEW_ID = '00000000-0000-0000-0000-00000000cafe';
// Extra columns that exist in the table but must NEVER reach a public client.
const rows = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Ankara', slug: 'ankara', sort_order: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Bridal', slug: 'bridal', sort_order: 2, created_at: '2026-01-01T00:00:00Z' },
];

// 'ok' | 'fail' | 'empty' | 'duplicate' | 'notFound'
let mode = 'ok';
const upstreamSeen = [];

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const upstream = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    upstreamSeen.push({
      method: req.method,
      path: url.pathname,
      select: url.searchParams.get('select'),
      order: url.searchParams.get('order'),
      idFilter: url.searchParams.get('id'),
      authorization: req.headers.authorization || null,
      apikey: req.headers.apikey || null,
    });
    if (mode === 'fail') return json(res, 500, { message: 'upstream down' });

    if (req.method === 'GET' && url.pathname === '/rest/v1/categories') {
      return json(res, 200, mode === 'empty' ? [] : rows);
    }
    if (req.method === 'POST' && url.pathname === '/rest/v1/categories') {
      if (mode === 'duplicate') {
        return json(res, 409, {
          code: '23505',
          message: 'duplicate key value violates unique constraint "categories_name_key"',
          details: null,
          hint: null,
        });
      }
      const parsed = body ? JSON.parse(body) : {};
      // Whitelisting proof: the insert must only ever carry { name }.
      assert.deepEqual(Object.keys(parsed), ['name'], 'insert payload must only contain name');
      return json(res, 201, { id: NEW_ID, name: parsed.name });
    }
    if (req.method === 'PATCH' && url.pathname === '/rest/v1/categories') {
      if (mode === 'notFound') {
        return json(res, 406, {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
          details: 'Results contain 0 rows',
          hint: null,
        });
      }
      const parsed = body ? JSON.parse(body) : {};
      return json(res, 200, { id: NEW_ID, name: parsed.name });
    }
    if (req.method === 'DELETE' && url.pathname === '/rest/v1/categories') {
      res.writeHead(204);
      res.end();
      return;
    }
    return json(res, 500, { message: 'unexpected upstream call' });
  });
});
await new Promise((resolve, reject) => {
  upstream.once('error', reject);
  upstream.listen(0, '127.0.0.1', resolve);
});
process.env.SUPABASE_URL = `http://127.0.0.1:${upstream.address().port}`;


let server;
try {
  const { default: app } = await import('../server/dist/app.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const { signAdminToken } = await import('../server/dist/services/tokenService.js');
  const { storeAdminSession } = await import('../server/dist/services/adminSessionStore.js');
  // Seed an authenticated Supabase session exactly the way loginAdmin does:
  // admin mutations must execute under the admin's OWN Supabase identity so
  // RLS (public.is_admin()) authorizes them — there is no privileged key.
  const adminUserId = crypto.randomUUID();
  const FIXTURE_ACCESS_TOKEN = 'fixture-admin-access-token';
  storeAdminSession(adminUserId, {
    access_token: FIXTURE_ACCESS_TOKEN,
    refresh_token: 'fixture-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
  const token = signAdminToken({ userId: adminUserId, email: 'fixture@example.test', role: 'admin' });
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const send = (method, payload, headers) =>
    fetch(`${base}/api/categories`, {
      method,
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  let n = 0;
  const pass = (name) => { n += 1; console.log(`PASS ${name}`); };

  // 1. Public read: 200 without a token, exactly the whitelisted fields.
  let before = upstreamSeen.length;
  let res = await fetch(`${base}/api/categories`, { signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 200, 'GET /api/categories must be public (200 without token)');
  let body = await res.json();
  assert.ok(Array.isArray(body), 'public categories body must be an array');
  assert.equal(body.length, rows.length, 'public categories must return every row');
  for (const row of body) {
    assert.deepEqual(Object.keys(row).sort(), [...PUBLIC_FIELDS].sort(), 'each row must contain exactly id+name');
    assert.ok(!('slug' in row) && !('sort_order' in row) && !('created_at' in row), 'no private columns may leak');
  }
  assert.deepEqual(body.map(r => r.name), rows.map(r => r.name), 'upstream ordering must be preserved');
  let calls = upstreamSeen.slice(before);
  assert.equal(calls.length, 1, 'public read must issue exactly one upstream select');
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].path, '/rest/v1/categories');
  assert.equal(calls[0].select, PUBLIC_FIELDS.join(','), 'upstream select must be the whitelist, never *');
  assert.ok(calls[0].order?.includes('sort_order.asc'), 'read must be ordered by sort_order');
  assert.ok(calls[0].order?.includes('name.asc'), 'read must tie-break on name for determinism');
  pass('public GET returns only id+name, ordered, without auth');

  // 2. Empty table => honest [] (not an error, not fake data).
  mode = 'empty';
  res = await fetch(`${base}/api/categories`, { signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 200, 'empty categories must still be 200');
  assert.deepEqual(await res.json(), [], 'empty categories must return []');
  pass('public GET returns [] for an empty categories table');
  mode = 'ok';

  // 3. Failure behavior: upstream down => 500 JSON error, no HTML, no crash.
  mode = 'fail';
  res = await fetch(`${base}/api/categories`, { signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 500, 'upstream failure must be 500');
  const failBody = await res.json();
  assert.ok(typeof failBody.error === 'string' && failBody.error.length > 0, 'failure must return { error }');
  pass('public GET failure returns JSON { error } instead of crashing');
  mode = 'ok';

  // 4. Mutations stay admin-only: 401 without a token, no upstream writes.
  before = upstreamSeen.length;
  for (const method of ['POST', 'PUT', 'DELETE']) {
    res = await send(method, { id: NEW_ID, name: 'Ankara' });
    assert.equal(res.status, 401, `${method} without token must be 401`);
  }
  assert.equal(upstreamSeen.slice(before).length, 0, 'rejected mutations must never reach the database');
  pass('POST/PUT/DELETE without a token are 401 and never touch the database');

  // 5. Validation happens before any database write.
  before = upstreamSeen.length;
  res = await send('POST', { name: '   ' }, auth);
  assert.equal(res.status, 400, 'POST with a blank name must be 400');
  res = await send('PUT', { name: 'New name' }, auth);
  assert.equal(res.status, 400, 'PUT without id must be 400');
  res = await send('PUT', { id: NEW_ID, name: '' }, auth);
  assert.equal(res.status, 400, 'PUT with a blank name must be 400');
  res = await send('DELETE', {}, auth);
  assert.equal(res.status, 400, 'DELETE without id must be 400');
  assert.equal(upstreamSeen.slice(before).length, 0, 'invalid mutations must not reach the database');
  pass('invalid mutations return 400 before any database write');

  // 6. Create: whitelisted insert, 201 with only id+name back.
  before = upstreamSeen.length;
  res = await send('POST', { name: 'Senator' }, auth);
  assert.equal(res.status, 201, 'valid POST must be 201');
  body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), [...PUBLIC_FIELDS].sort(), 'create response must be exactly id+name');
  assert.equal(body.name, 'Senator', 'create must echo the stored name');
  calls = upstreamSeen.slice(before);
  assert.equal(calls[0].select, PUBLIC_FIELDS.join(','), 'create must select back only the whitelist');
  assert.equal(calls[0].authorization, `Bearer ${FIXTURE_ACCESS_TOKEN}`,
    'admin create must execute as the admin Supabase identity, never a privileged key');
  assert.equal(calls[0].apikey, 'isolated-test-anon-key', 'every request must identify with the anon key');
  pass('admin create stores { name } and returns only id+name');

  // 7. Duplicate name => controlled 409 (not 500).
  mode = 'duplicate';
  res = await send('POST', { name: 'Senator' }, auth);
  assert.equal(res.status, 409, 'duplicate name must be 409');
  const dupBody = await res.json();
  assert.ok(/already exists/i.test(dupBody.error), '409 must carry a human-readable error');
  pass('duplicate category name returns 409 with a readable error');
  mode = 'ok';

  // 8. Update: unknown id => controlled 404 (PGRST116).
  mode = 'notFound';
  res = await send('PUT', { id: '00000000-0000-0000-0000-00000000dead', name: 'Nope' }, auth);
  assert.equal(res.status, 404, 'unknown category id must be 404');
  const missingBody = await res.json();
  assert.equal(missingBody.error, 'Category not found', '404 must carry the controller message');
  pass('update of an unknown id returns 404, not a server fault');
  mode = 'ok';

  // 9. Update success: 200 with only id+name.
  before = upstreamSeen.length;
  res = await send('PUT', { id: NEW_ID, name: 'Senator Wear' }, auth);
  assert.equal(res.status, 200, 'valid PUT must be 200');
  body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), [...PUBLIC_FIELDS].sort(), 'update response must be exactly id+name');
  assert.equal(body.name, 'Senator Wear', 'update must echo the new name');
  calls = upstreamSeen.slice(before);
  assert.equal(calls[0].method, 'PATCH', 'update must reach the database as PATCH');
  assert.equal(calls[0].idFilter, `eq.${NEW_ID}`, 'update must target only the requested id');
  pass('admin update targets one id and returns only id+name');

  // 10. Delete: { ok: true } and a single DELETE for that id.
  before = upstreamSeen.length;
  res = await send('DELETE', { id: NEW_ID }, auth);
  assert.equal(res.status, 200, 'valid DELETE must be 200');
  assert.deepEqual(await res.json(), { ok: true }, 'delete must acknowledge with { ok: true }');
  calls = upstreamSeen.slice(before);
  assert.equal(calls[0].method, 'DELETE', 'delete must reach the database as DELETE');
  assert.equal(calls[0].path, '/rest/v1/categories');
  assert.equal(calls[0].idFilter, `eq.${NEW_ID}`, 'delete must target only the requested id');
  pass('admin delete removes exactly one category row');

  console.log(`\nAll ${n} public-categories checks passed.`);
  process.exitCode = 0;
} catch (error) {
  console.error('Public categories check FAILED:', error.message);
  process.exitCode = 1;
} finally {
  if (server) { server.closeAllConnections(); server.close(); }
  upstream.closeAllConnections();
  upstream.close();
}

