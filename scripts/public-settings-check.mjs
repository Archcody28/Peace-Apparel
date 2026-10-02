#!/usr/bin/env node
// Focused Phase 8 check: public settings response + consumer behavior.
// Isolated: mocked PostgREST upstream, never a real Supabase database.
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://127.0.0.1:0';
process.env.SUPABASE_ANON_KEY = 'isolated-test-anon-key';
process.env.ADMIN_JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.PAYSTACK_SECRET_KEY = '';

const PUBLIC_FIELDS = ['store_name', 'phone', 'email', 'address', 'whatsapp_number'];
const dbRow = {
  id: '00000000-0000-0000-0000-000000000001',
  store_name: 'Peace Apparel Test Store',
  phone: '+2349000000001',
  email: 'teststore@example.test',
  address: '1 Test Road, Aba',
  whatsapp_number: '+2349000000001',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

let failUpstream = false;
const upstreamSeen = [];
const upstream = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  upstreamSeen.push({ method: req.method, path: url.pathname, select: url.searchParams.get('select') });
  if (failUpstream) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'upstream down' }));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/rest/v1/settings') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dbRow));
    return;
  }
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'unexpected upstream call' }));
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
  let n = 0;
  const pass = (name) => { n += 1; console.log(`PASS ${name}`); };

  // 1. Public read succeeds with NO token and exposes ONLY whitelisted fields.
  const before = upstreamSeen.length;
  let res = await fetch(`${base}/api/settings/public`, { signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 200, 'GET /api/settings/public must be public (200 without token)');
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), [...PUBLIC_FIELDS].sort(), 'public body must contain exactly the whitelisted fields');
  for (const f of PUBLIC_FIELDS) assert.equal(body[f], dbRow[f], `public field ${f} must match the database row`);
  assert.ok(!('id' in body) && !('created_at' in body), 'public body must not leak id/timestamps');
  const lastCall = upstreamSeen.slice(before);
  assert.equal(lastCall.length, 1, 'public read must issue exactly one upstream select');
  assert.equal(lastCall[0].select, PUBLIC_FIELDS.join(','), 'upstream select must be the whitelist, never *');
  pass('public settings returns whitelisted DB values without auth');

  // 2. Failure behavior: upstream down => 500 JSON error, no crash, no HTML.
  failUpstream = true;
  res = await fetch(`${base}/api/settings/public`, { signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 500, 'public settings upstream failure must be 500');
  const errBody = await res.json();
  assert.ok(typeof errBody.error === 'string' && errBody.error.length > 0, 'failure must return { error }');
  pass('public settings failure returns JSON { error } instead of crashing');
  failUpstream = false;

  // 3. Admin protection unchanged.
  res = await fetch(`${base}/api/settings`, { signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 401, 'GET /api/settings without token must stay 401');
  pass('admin GET /api/settings still requires auth');
  res = await fetch(`${base}/api/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(5000) });
  assert.equal(res.status, 401, 'POST /api/settings without token must stay 401');
  pass('admin POST /api/settings still requires auth');

  console.log(`\nAll ${n} public-settings checks passed.`);
  process.exitCode = 0;
} catch (error) {
  console.error('Public settings check FAILED:', error.message);
  process.exitCode = 1;
} finally {
  if (server) { server.closeAllConnections(); server.close(); }
  upstream.closeAllConnections();
  upstream.close();
}
