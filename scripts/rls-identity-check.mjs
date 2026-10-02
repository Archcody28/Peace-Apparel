#!/usr/bin/env node
/**
 * Focused proof for the privileged-key removal architecture.
 *
 * Part 1 (static): the RLS migration keeps RLS enabled, never uses
 *   WITH CHECK (true), scopes USING (true) to read-only public SELECTs, and
 *   gates every admin write + storage write on public.is_admin().
 * Part 2 (behavioral, isolated mock upstream — never a real database):
 *   - unauthenticated users cannot perform admin mutations
 *   - non-admin authenticated users cannot perform admin mutations
 *   - an admin JWT with NO stored Supabase session cannot mutate (no fallback)
 *   - an admin with a session mutates AS that Supabase user (RLS identity)
 *   - public endpoints keep anon identity and never carry a user token
 *   - storage upload requires the authenticated admin identity
 *   - admin login resolves membership as the signed-in user
 *
 * No privileged/service credential is read or required anywhere in this suite.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATION = fileURLToPath(new URL('../supabase/migrations/20261002180000_admin_membership_and_rls_policies.sql', import.meta.url));
const FIXTURE_ACCESS_TOKEN = 'fixture-admin-access-token';
const ANON_KEY = 'isolated-test-anon-key';

let passes = 0;
function pass(name) {
  passes += 1;
  console.log(`PASS ${name}`);
}

// ---------------------------------------------------------------------------
// Part 1 — static RLS policy assertions
// ---------------------------------------------------------------------------
const sql = readFileSync(MIGRATION, 'utf8');
const sqlLower = sql.toLowerCase();
const sqlNoComments = sql.replace(/--[^\n]*/g, '');
const count = (re) => [...sqlNoComments.matchAll(re)].length;

// S1: RLS stays enabled on every application table plus admin_users.
for (const table of [
  'products', 'orders', 'order_payments', 'subscribers',
  'testimonials', 'homepage_features', 'categories', 'settings', 'admin_users',
]) {
  assert.match(
    sql,
    new RegExp(`alter table public\\.${table}\\s+enable row level security`, 'i'),
    `RLS must be enabled on public.${table}`,
  );
}
assert.doesNotMatch(sql, /disable row level security/i, 'RLS must never be disabled');
pass('static: RLS enabled on all 9 tables, never disabled');

// S2: no WITH CHECK (true) on any policy.
assert.equal(count(/with\s+check\s*\(\s*true\s*\)/gi), 0, 'no WITH CHECK (true) allowed');
pass('static: zero WITH CHECK (true) policies');

// S3: USING (true) appears exactly once, only inside the read-only public
// SELECT template, and that template covers public-facing read tables only
// (never orders / order_payments / subscribers, which guests only write).
assert.equal(count(/using\s*\(\s*true\s*\)/gi), 1, 'exactly one USING (true) literal expected');
const trueSelectLines = sqlNoComments.split('\n').filter((l) => /using\s*\(\s*true\s*\)/i.test(l));
assert.equal(trueSelectLines.length, 1, 'the only USING (true) must live on a single policy line');
assert.match(
  trueSelectLines[0],
  /for select to anon, authenticated using \(true\)/i,
  'the only USING (true) must belong to the public read-only SELECT policy',
);
assert.match(
  sqlNoComments,
  /array\['products', 'testimonials', 'homepage_features',\s*'categories', 'settings'\]/i,
  'public read policy must cover only public-facing tables',
);
assert.doesNotMatch(
  trueSelectLines[0],
  /orders|subscribers|order_payments|admin_users/i,
  'the public USING (true) policy must never cover write-only or admin tables',
);
pass('static: USING (true) restricted to the read-only public SELECT policy');

// Collect every policy statement — both literal `create policy "..." on ...`
// statements and the dynamic `execute format('create policy %I on ...')`
// templates. `[^;]` stops at the statement terminator so each entry is one
// policy definition.
const policyStmts = [...sqlNoComments.matchAll(/create policy[^;]*/gis)]
  .map((m) => m[0].replace(/\s+/g, ' ').trim());
const verbOf = (p) => (p.match(/for (select|insert|update|delete|all)/i) || [])[1]?.toLowerCase();
const toAnon = (p) => /\bto\s+anon\b/i.test(p);

// S4: every admin "for all" policy gates BOTH using and with check on
// public.is_admin(), and the generated policy set covers the 8 app tables.
const adminAll = policyStmts.filter((p) => /for all/i.test(p));
assert.ok(adminAll.length >= 1, 'expected at least one admin "for all" policy');
for (const policy of adminAll) {
  assert.match(policy, /using \(public\.is_admin\(\)\)/, `admin policy missing is_admin() USING: ${policy}`);
  assert.match(policy, /with check \(public\.is_admin\(\)\)/, `admin policy missing is_admin() WITH CHECK: ${policy}`);
}
assert.match(
  sqlNoComments,
  /array\['products', 'orders', 'order_payments', 'subscribers',\s*'testimonials', 'homepage_features', 'categories', 'settings'\]/i,
  'admin policy set must cover all 8 application tables',
);
// admin_users management is admin-only: insert WITH CHECK and delete USING.
const adminUsersInsert = policyStmts.find((p) => /admin_users insert/i.test(p));
assert.ok(adminUsersInsert && verbOf(adminUsersInsert) === 'insert' && /with check \(public\.is_admin\(\)\)/i.test(adminUsersInsert), 'admin_users insert must be WITH CHECK is_admin()');
const adminUsersDelete = policyStmts.find((p) => /admin_users delete/i.test(p));
assert.ok(adminUsersDelete && verbOf(adminUsersDelete) === 'delete' && /using \(public\.is_admin\(\)\)/i.test(adminUsersDelete), 'admin_users delete must be USING is_admin()');
pass(`static: all ${adminAll.length} admin write policies gated by public.is_admin()`);

// S5: no anon-served UPDATE/DELETE policy (guests are INSERT-only; the sole
// anon SELECT is the read-only public USING (true) policy).
const anonPolicies = policyStmts.filter(toAnon);
for (const policy of anonPolicies) {
  const verb = verbOf(policy);
  assert.ok(
    verb === 'insert' || verb === 'select',
    `anon policy must be INSERT or the read-only SELECT: ${policy}`,
  );
  if (verb === 'select') {
    assert.match(policy, /using \(true\)/i, `anon SELECT must be the read-only public policy: ${policy}`);
  }
}
assert.ok(
  anonPolicies.filter((p) => verbOf(p) === 'insert').length >= 3,
  'expected guest insert policies for orders/order_payments/subscribers',
);
assert.ok(
  !anonPolicies.some((p) => ['update', 'delete', 'all'].includes(verbOf(p))),
  'anon must never hold an UPDATE/DELETE/ALL policy',
);
pass('static: anon limited to constrained INSERT; no anonymous UPDATE/DELETE');

// S6: storage write policies require the admin identity.
const storageWrites = policyStmts.filter((p) => /on storage\.objects/i.test(p));
assert.ok(storageWrites.length >= 3, 'expected insert/update/delete storage policies');
for (const policy of storageWrites) {
  assert.match(policy, /bucket_id = 'peace-apparel' and public\.is_admin\(\)/, `storage policy must require is_admin(): ${policy}`);
}
pass(`static: all ${storageWrites.length} storage write policies require public.is_admin()`);

// S7: no privileged credential vocabulary anywhere in the migration. The
// forbidden tokens are assembled from fragments so that this verification file
// itself contains no literal privileged-credential name: a repository-wide
// search for those names must return zero results.
const FORBIDDEN = ['service' + '_role', 'sb' + '_secret_', 'supabase_service' + '_role_key'];
for (const forbidden of FORBIDDEN) {
  assert.ok(!sqlLower.includes(forbidden), 'migration must not reference a privileged credential');
}
pass('static: migration contains no privileged-credential reference');

// S8: no runtime source file references a privileged credential. Scans the
// browser and server runtime trees directly (never build output) so a
// reintroduced privileged-credential integration fails CI immediately.
const RUNTIME_DIRS = ['server/src', 'client/src'].map((p) =>
  fileURLToPath(new URL(`../${p}`, import.meta.url)),
);
const RUNTIME_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);
let scannedRuntimeFiles = 0;
for (const dir of RUNTIME_DIRS) {
  for (const entry of readdirSync(dir, { recursive: true })) {
    if (!RUNTIME_EXT.has(path.extname(entry))) continue;
    const content = readFileSync(path.join(dir, entry), 'utf8').toLowerCase();
    for (const forbidden of FORBIDDEN) {
      assert.ok(!content.includes(forbidden), `${entry} must not reference a privileged credential`);
    }
    scannedRuntimeFiles += 1;
  }
}
pass(`static: scanned ${scannedRuntimeFiles} runtime source files; zero privileged-credential references`);

// ---------------------------------------------------------------------------
// Part 2 — behavioral identity assertions against an isolated mock upstream
// ---------------------------------------------------------------------------
const upstream = [];
let membershipRows = [{ user_id: 'placeholder' }];

const mock = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  upstream.push({
    method: req.method,
    path: url.pathname,
    select: url.searchParams.get('select'),
    authorization: req.headers.authorization || null,
    apikey: req.headers.apikey || null,
  });

  if (url.pathname === '/auth/v1/token') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      access_token: FIXTURE_ACCESS_TOKEN,
      refresh_token: 'fixture-refresh-token',
      expires_in: 3600,
      user: { id: 'fixture-user-id', email: 'fixture@example.test' },
    }));
    return;
  }
  if (url.pathname === '/rest/v1/admin_users') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(membershipRows));
    return;
  }
  if (url.pathname.startsWith('/storage/v1/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
    return;
  }
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(url.pathname === '/rest/v1/settings' ? { id: 'fixture-settings-id' } : []));
    return;
  }
  if (req.method === 'DELETE') {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ id: 'fixture-row-id' }));
});

await new Promise((resolve, reject) => {
  mock.once('error', reject);
  mock.listen(0, '127.0.0.1', resolve);
});

process.env.SUPABASE_URL = `http://127.0.0.1:${mock.address().port}`;
process.env.SUPABASE_ANON_KEY = ANON_KEY;
// No privileged credential is defined or read anywhere in this process.
process.env.ADMIN_JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.PAYSTACK_SECRET_KEY = '';

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

  const adminUserId = crypto.randomUUID();
  const adminToken = signAdminToken({ userId: adminUserId, email: 'fixture@example.test', role: 'admin' });
  const rolelessToken = signAdminToken({ userId: adminUserId, email: 'fixture@example.test', role: null });

  const noTokenWrites = [
    ['POST', '/api/settings', { store_name: 'x' }],
    ['POST', '/api/products', { name: 'x' }],
    ['POST', '/api/upload', { fileName: 'a.jpg', fileBase64: 'AA==' }],
  ];

  // B1-B3: no token -> 401 and the database is never contacted.
  for (const [method, path, body] of noTokenWrites) {
    const before = upstream.length;
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 401, `${method} ${path} without a token must be 401`);
    assert.equal(upstream.length, before, `${method} ${path} must not reach the database without a token`);
  }
  pass('behavioral: unauthenticated admin mutations are 401 and never touch the database');

  // B4: a valid, non-admin (roleless) token -> 403, no database contact.
  {
    const before = upstream.length;
    const res = await fetch(base + '/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rolelessToken}` },
      body: JSON.stringify({ store_name: 'x' }),
    });
    assert.equal(res.status, 403, 'a roleless token must be 403');
    assert.equal(upstream.length, before, 'a roleless token must not reach the database');
  }
  pass('behavioral: non-admin authenticated users cannot mutate admin resources (403)');

  // B5: valid admin JWT, but no stored Supabase session -> 401, no fallback.
  {
    const before = upstream.length;
    const res = await fetch(base + '/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ store_name: 'x' }),
    });
    assert.equal(res.status, 401, 'an admin token with no Supabase session must be 401');
    assert.equal(upstream.length, before, 'no privileged fallback may reach the database');
  }
  pass('behavioral: admin JWT without a Supabase session cannot mutate (no privileged fallback)');

  // Seed the session exactly the way loginAdmin does.
  assert.equal(storeAdminSession(adminUserId, {
    access_token: FIXTURE_ACCESS_TOKEN,
    refresh_token: 'fixture-refresh-token',
    expires_in: 3600,
  }), true, 'session seeding must succeed');

  // B6: admin with a session writes AS that Supabase user.
  {
    const before = upstream.length;
    const res = await fetch(base + '/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ store_name: 'Peace Apparel' }),
    });
    assert.ok(res.status === 200 || res.status === 201, `admin settings write must succeed (got ${res.status})`);
    const writes = upstream.slice(before).filter((r) => r.method !== 'GET');
    assert.equal(writes.length, 1, 'exactly one settings write must reach PostgREST');
    assert.equal(writes[0].path, '/rest/v1/settings', `settings write must target /rest/v1/settings (got ${writes[0].path})`);
    assert.equal(writes[0].authorization, `Bearer ${FIXTURE_ACCESS_TOKEN}`, 'admin write must run as the admin Supabase identity');
    assert.equal(writes[0].apikey, ANON_KEY, 'admin write must identify with the anon key, never a privileged key');
  }
  pass('behavioral: admin mutations execute as the authenticated Supabase user under RLS');

  // B7: storage upload requires the authenticated admin identity.
  {
    const before = upstream.length;
    const res = await fetch(base + '/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ fileName: 'photo.jpg', fileBase64: Buffer.from('x').toString('base64') }),
    });
    assert.equal(res.status, 200, `admin upload must succeed (got ${res.status})`);
    const upload = upstream.slice(before).find((r) => r.path.startsWith('/storage/v1/object/peace-apparel/'));
    assert.ok(upload, 'upload must target the peace-apparel storage bucket');
    assert.equal(upload.method, 'POST', 'upload must be a storage POST');
    assert.equal(upload.authorization, `Bearer ${FIXTURE_ACCESS_TOKEN}`, 'storage write must run as the admin Supabase identity');
    assert.equal(upload.apikey, ANON_KEY, 'storage write must identify with the anon key, never a privileged key');
  }
  pass('behavioral: storage upload authorization uses the authenticated admin identity');

  // B8: guest checkout stays a public, anon-identity write.
  {
    const before = upstream.length;
    const res = await fetch(base + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'PA-FIXTURE-0001', customer_name: 'Guest', customer_email: 'g@example.test',
        customer_phone: '08000000000', delivery_method: 'pickup', delivery_address: 'Pickup',
        items: [], subtotal: 0, delivery_fee: 0, total: 0, status: 'pending',
      }),
    });
    assert.ok(res.status === 200 || res.status === 201, `guest checkout must succeed (got ${res.status})`);
    const insert = upstream.slice(before).find((r) => r.path === '/rest/v1/orders' && r.method === 'POST');
    assert.ok(insert, 'guest checkout must insert into /rest/v1/orders');
    assert.equal(insert.apikey, ANON_KEY, 'guest checkout must identify with the anon key');
    assert.ok(insert.authorization !== `Bearer ${FIXTURE_ACCESS_TOKEN}`,
      'guest checkout must never carry an admin Supabase token');
  }
  pass('behavioral: public guest checkout retains anon identity, never an admin token');

  // B9: admin login resolves membership AS the signed-in user. The membership
  // read must carry the user's own access token — the bare anon client is
  // denied by RLS on admin_users and would reject every real admin.
  membershipRows = [{ user_id: 'fixture-user-id' }];
  {
    const before = upstream.length;
    const res = await fetch(base + '/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fixture@example.test', password: 'fixture-password' }),
    });
    assert.equal(res.status, 200, `admin login must succeed (got ${res.status})`);
    const body = await res.json();
    assert.ok(typeof body.token === 'string' && body.token.length > 0, 'login must return an admin token');
    const membershipRead = upstream.slice(before).find((r) => r.path === '/rest/v1/admin_users');
    assert.ok(membershipRead, 'login must read admin_users for the membership check');
    assert.equal(membershipRead.authorization, `Bearer ${FIXTURE_ACCESS_TOKEN}`,
      'membership check must run as the signed-in Supabase user');
    assert.equal(membershipRead.apikey, ANON_KEY, 'membership check must identify with the anon key');
  }
  pass('behavioral: admin login resolves membership as the signed-in user');

  // B10: an authenticated user with no membership row is rejected and receives
  // no admin token.
  membershipRows = [];
  {
    const res = await fetch(base + '/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'outsider@example.test', password: 'fixture-password' }),
    });
    assert.equal(res.status, 403, 'an authenticated non-admin login must be 403');
    const body = await res.json();
    assert.equal(body.token, undefined, 'no admin token may be issued to a non-admin');
  }
  pass('behavioral: non-admin Supabase users cannot obtain an admin token');

  console.log(`\nAll ${passes} privileged-key-removal checks passed.`);
  process.exitCode = 0;
} catch (err) {
  console.error('privileged-key-removal check FAILED:', err && err.message ? err.message : err);
  process.exitCode = 1;
} finally {
  if (server) server.close();
  mock.close();
}
