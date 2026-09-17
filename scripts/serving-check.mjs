#!/usr/bin/env node
// Tests the real serving module and built SPA without importing Supabase or mocks.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import serveFrontend, { resolveFrontendPath } from '../server/dist/serveFrontend.js';

const require = createRequire(new URL('../server/package.json', import.meta.url));
const express = require('express');
const root = fileURLToPath(new URL('../', import.meta.url));
const built = path.join(root, 'client/dist');
const html = await readFile(path.join(built, 'index.html'), 'utf8');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'peace-serving-'));
let server;
try {
  assert.equal(resolveFrontendPath(path.join(root, 'server')), built);
  await mkdir(path.join(temporary, 'public'));
  await writeFile(path.join(temporary, 'public/index.html'), html);
  assert.equal(resolveFrontendPath(temporary), path.join(temporary, 'public'));
  const app = express();
  serveFrontend(app, built);
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const route of ['/', '/products', '/products/test-id', '/admin', '/admin/products']) {
    const res = await fetch(base + route, { headers: { Accept: 'text/html' } });
    assert.equal(res.status, 200, route);
    assert.equal(await res.text(), html, route);
    console.log(`PASS SPA ${route}`);
  }
  const asset = html.match(/src="(\/assets\/[^" ]+\.js)"/)[1];
  const res = await fetch(base + asset);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  for (const method of ['GET', 'POST', 'HEAD']) {
    const api = await fetch(base + '/api/not-a-route', { method, headers: { Accept: 'text/html' } });
    assert.equal(api.status, 404);
    assert.match(api.headers.get('content-type'), /json/);
  }
  assert.equal((await fetch(base + '/assets/missing.js')).status, 404);
  assert.equal((await fetch(base + '/products', { method: 'POST' })).status, 404);
  console.log('PASS assets, API isolation, missing assets, method handling and both layout resolvers');
} finally {
  if (server) { server.closeAllConnections(); server.close(); }
  await rm(temporary, { recursive: true, force: true });
}
