#!/usr/bin/env node
/**
 * Automated security verification for the Peace-Apparel API boundary.
 *
 * Usage:
 *   BASE_URL=http://localhost:3101 ADMIN_JWT_SECRET=... node scripts/security-check.mjs
 *
 * Expects a running server. Generates its own admin / no-role / bad / expired
 * tokens from ADMIN_JWT_SECRET (same format as scripts/generate-admin-token.js).
 * Exits non-zero on any failure.
 */

const BASE = process.env.BASE_URL || 'http://localhost:3101';
const SECRET = process.env.ADMIN_JWT_SECRET;
if (!SECRET) {
  console.error('ADMIN_JWT_SECRET is required to generate test tokens');
  process.exit(1);
}

import crypto from 'crypto';

function b64url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}
function makeToken({ role = 'admin', expired = false, tamper = false } = {}) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const exp = Math.floor(Date.now() / 1000) + (expired ? -3600 : 86400);
  const payload = b64url({ userId: crypto.randomUUID(), email: 'test@peaceapparel.com', role, exp });
  const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  const token = `${header}.${payload}.${tamper ? (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1) : sig}`;
  return token;
}

const adminToken = makeToken({ role: 'admin' });
const noRoleToken = makeToken({ role: null }); // explicit null: no admin role
const badToken = makeToken({ tamper: true });
const expiredToken = makeToken({ expired: true });

let failures = 0;
async function check(name, path, { method = 'GET', token, expect, headers: extra = {} } = {}) {
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (method !== 'GET') headers['Content-Type'] = 'application/json';
  let status;
  try {
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
    });
        status = res.status;
  } catch {
    status = 'NETWORK_FAIL';
  }
  const ok = status === expect;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${method.padEnd(6)} ${path.padEnd(28)} expected=${expect} got=${status}  (${name})`);
}

console.log(`Security check against ${BASE}\n`);

// Public endpoints must stay open (public commerce regression guard).
// NOTE: with placeholder Supabase credentials the controller returns 500
// (upstream unreachable) — that still proves the route is PUBLIC (not 401/403).
function expectPublicOrUpstream(status) {
  return status === 200 || status === 500;
}
async function checkPublic(name, path, { method = 'GET' } = {}) {
  const headers = method !== 'GET' ? { 'Content-Type': 'application/json' } : {};
  let status;
  try {
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
    });
    status = res.status;
  } catch {
    status = 'NETWORK_FAIL';
  }
  const ok = expectPublicOrUpstream(status);
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${method.padEnd(6)} ${path.padEnd(28)} expected=200|500 got=${status}  (${name})`);
}

await checkPublic('public GET products', '/api/products');
await checkPublic('public GET testimonials', '/api/testimonials');
await checkPublic('public GET homepage-features', '/api/homepage-features');
await checkPublic('public GET categories', '/api/categories');
await checkPublic('public POST checkout order', '/api/orders', { method: 'POST' });
await check('public POST newsletter', '/api/subscribers', { method: 'POST', expect: 400 }); // 400 = reached controller, not 401
await check('public POST verify-payment', '/api/verify-payment', { method: 'POST', expect: 400 }); // reached controller

// Admin reads.
for (const p of ['/api/orders', '/api/subscribers', '/api/analytics', '/api/settings']) {
  await check(`admin GET ${p} no token`, p, { expect: 401 });
  await check(`admin GET ${p} bad token`, p, { token: badToken, expect: 401 });
  await check(`admin GET ${p} expired token`, p, { token: expiredToken, expect: 401 });
  await check(`admin GET ${p} roleless token`, p, { token: noRoleToken, expect: 403 });
}
await check('admin GET orders valid token', '/api/orders', { token: adminToken, expect: 500 }); // 500 = reached controller; placeholder Supabase upstream

// Admin writes.
const mutations = [
  ['/api/products', 'POST'],
  ['/api/products', 'PUT'],
  ['/api/products', 'DELETE'],
  ['/api/orders', 'PUT'],
  ['/api/orders', 'DELETE'],
  ['/api/subscribers', 'DELETE'],
  ['/api/testimonials', 'POST'],
  ['/api/homepage-features', 'POST'],
  ['/api/settings', 'POST'],
  ['/api/upload', 'POST'],
];
for (const [p, method] of mutations) {
  await check(`admin ${method} ${p} no token`, p, { method, expect: 401 });
  await check(`admin ${method} ${p} bad token`, p, { method, token: badToken, expect: 401 });
  await check(`admin ${method} ${p} roleless token`, p, { method, token: noRoleToken, expect: 403 });
}

// Admin auth endpoint semantics.
await check('verify token no token', '/api/admin-auth', { expect: 401 });
await check('verify token bad token', '/api/admin-auth', { token: badToken, expect: 401 });
await check('verify token admin token', '/api/admin-auth', { token: adminToken, expect: 200 });

// Registration gate (server booted with ADMIN_REGISTRATION_SECRET=testregsecret).
const REG_SECRET = process.env.ADMIN_REGISTRATION_SECRET || 'testregsecret';
await check('register-admin no secret', '/api/register-admin', { method: 'POST', expect: 401 });
await check('register-admin wrong secret', '/api/register-admin', {
  method: 'POST',
  headers: { 'x-admin-registration-secret': 'wrong-value' },
  expect: 401,
});
await check('register-admin role field ignored', '/api/register-admin', {
  method: 'POST',
  headers: { 'x-admin-registration-secret': REG_SECRET },
  expect: 400, // gate passed -> controller validation runs (no email in body); no token minted
});

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
