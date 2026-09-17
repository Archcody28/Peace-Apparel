#!/usr/bin/env node
// Run the existing boundary assertions, then successful mocked controller reads.
// Never connect this suite to a real Supabase database.
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let successfulReads = false;
const upstreamRequests = [];
// Synthetic fixtures test HTTP plumbing only; these are NOT schema evidence.
const ordersFixture = [{ id: 'local-order-fixture', total: 123 }];
const productsFixture = [{ id: 'local-product-fixture', sizes: ['S', 'M'], colors: ['Gold'], images: [], categories: [] }];
const upstream = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  upstreamRequests.push({ method: req.method, path: url.pathname, select: url.searchParams.get('select') });
  if (successfulReads && req.method === 'GET') {
    const fixture = url.pathname === '/rest/v1/orders' ? ordersFixture
      : url.pathname === '/rest/v1/products' ? productsFixture : null;
    if (fixture) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fixture));
      return;
    }
  }
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Isolated security-test upstream unavailable' }));
});
await new Promise((resolve, reject) => {
  upstream.once('error', reject);
  upstream.listen(0, '127.0.0.1', resolve);
});

// Override inherited credentials before importing the application's services.
process.env.SUPABASE_URL = `http://127.0.0.1:${upstream.address().port}`;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'isolated-test-placeholder';
process.env.ADMIN_JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.ADMIN_REGISTRATION_SECRET = crypto.randomBytes(32).toString('hex');
process.env.PAYSTACK_SECRET_KEY = '';

let server;
try {
  const { default: app } = await import('../server/dist/app.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const child = spawn(process.execPath, [fileURLToPath(new URL('./security-check.mjs', import.meta.url))], {
    env: { ...process.env, BASE_URL: `http://127.0.0.1:${server.address().port}` },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  const timeout = setTimeout(() => child.kill(), 30000);
  let code;
  try {
    code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });
  } finally {
    clearTimeout(timeout);
  }
  console.log(output);
  const lines = output.split('\n');
  const passed = lines.filter((line) => line.startsWith('PASS ')).length;
  const failed = lines.filter((line) => line.startsWith('FAIL ')).length;
  console.log(`Boundary assertions: ${passed} passed; ${failed} failed. Child exit: ${code}`);
  assert.equal(code, 0, 'Existing boundary suite must exit successfully');
  assert.equal(failed, 0, 'No boundary assertions may fail');
  assert.equal(passed, 60, 'Preserve all 60 existing boundary assertions');

  successfulReads = true;
  const base = `http://127.0.0.1:${server.address().port}`;
  const { signAdminToken } = await import('../server/dist/services/tokenService.js');
  const token = signAdminToken({ userId: crypto.randomUUID(), email: 'fixture@example.test', role: 'admin' });
  for (const [route, fixture, headers] of [
    ['/api/orders', ordersFixture, { Authorization: `Bearer ${token}` }],
    ['/api/products', productsFixture, {}],
  ]) {
    const before = upstreamRequests.length;
    const response = await fetch(base + route, { headers, signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200, `${route} must return 200, never accept 500`);
    assert.deepEqual(await response.json(), fixture, `${route} must return mock database data`);
    assert.deepEqual(upstreamRequests.slice(before), [{
      method: 'GET', path: route.replace('/api/', '/rest/v1/'), select: '*',
    }], `${route} must reach the expected mock PostgREST resource`);
    console.log(`PASS controller integration ${route}: HTTP 200, expected body and upstream request`);
  }
  console.log('60 boundary assertions + 2 mocked controller scenarios passed. Live schema/persistence NOT verified.');
  process.exitCode = 0;
} catch (error) {
  console.error('Local security runner failed:', error.message);
  console.error('Build the server first: npm run build:server');
  process.exitCode = 1;
} finally {
  if (server) {
    server.closeAllConnections();
    server.close();
  }
  upstream.closeAllConnections();
  upstream.close();
}
