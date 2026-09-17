// Deterministic development proxy diagnostic (Phase 4 Step 2).
// Starts Express (PORT=3001) and Vite (5173) with isolated, placeholder-only
// environment; never uses real credentials or the live database.
// Usage: node scripts/dev-proxy-check.mjs
import { spawn, execSync } from 'node:child_process';
import net from 'node:net';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];
let shuttingDown = false;
const note = (line) => console.log(line);

async function probePort(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port }, () => { s.end(); resolve(true); });
    s.on('error', () => resolve(false));
    s.setTimeout(timeoutMs, () => { s.destroy(); resolve(false); });
  });
}

async function waitForPort(port, label, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const [v4, v6] = await Promise.all([probePort('127.0.0.1', port), probePort('::1', port)]);
    if (v4 || v6) return { v4, v6 };
    await wait(250);
  }
  throw new Error(`${label} did not open port ${port} within ${timeoutMs}ms`);
}

function killTree(pid) {
  try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' }); } catch { /* already gone */ }
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
  process.on(sig, () => { shuttingDown = true; for (const p of procs) killTree(p.pid); process.exit(1); });
}

try {
  const serverEnv = {
    ...process.env,
    PORT: '3001',
    NODE_ENV: 'development',
    // Placeholder-only credentials: server refuses to boot without them, but
    // these values never touch a real Supabase project.
    SUPABASE_URL: 'https://placeholder.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'placeholder-not-a-real-key',
    ADMIN_JWT_SECRET: 'placeholder-not-a-real-secret',
    // Isolate from inherited PORT/CORS surprises.
    CORS_ORIGIN: '',
  };

  note('[1] Starting Express via server entrypoint (PORT=3001)…');
  const server = spawn(process.execPath, ['server/dist/start.js'], {
    cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  procs.push(server);
  let serverLog = '';
  server.stdout.on('data', (c) => (serverLog += c));
  server.stderr.on('data', (c) => (serverLog += c));
  server.on('close', (code) => {
    // taskkill /F during cleanup surfaces as a non-zero close; only unexpected
    // early exits are noteworthy.
    if (!shuttingDown && code !== 0 && code !== null) note(`[express] exited ${code}: ${serverLog.slice(-400)}`);
  });

  await waitForPort(3001, 'Express');
  note('[1] Express listening on 3001.');

  note('[2] Starting Vite (explicit --port 5173 --strictPort)…');
  const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort'], {
    cwd: new URL('../client', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  procs.push(vite);
  let viteLog = '';
  vite.stdout.on('data', (c) => (viteLog += c));
  vite.stderr.on('data', (c) => (viteLog += c));
  vite.on('close', (code) => {
    if (!shuttingDown && code !== 0 && code !== null) note(`[vite] exited ${code}: ${viteLog.slice(-400)}`);
  });

  const viteBind = await waitForPort(5173, 'Vite');
  note(`[2] Vite listening on 5173 (IPv4 127.0.0.1: ${viteBind.v4}, IPv6 ::1: ${viteBind.v6}).`);

  note('[3] Probing…');
  const results = [];
  const probes = [
    ['http://127.0.0.1:3001/', 'express-direct-ipv4'],
    ['http://[::1]:3001/', 'express-direct-ipv6'],
    ['http://127.0.0.1:5173/', 'vite-spa-ipv4'],
    ['http://[::1]:5173/', 'vite-spa-ipv6'],
    ['http://127.0.0.1:5173/api/orders', 'vite-proxy-api-ipv4'],
    ['http://[::1]:5173/api/orders', 'vite-proxy-api-ipv6'],
    ['http://localhost:5173/api/orders', 'vite-proxy-api-localhost'],
  ];
  for (const [url, label] of probes) {
    try {
      const res = await fetch(url, { headers: { Accept: 'text/html, application/json' }, signal: AbortSignal.timeout(6000) });
      const body = await res.text();
      results.push({ label, url, ok: true, status: res.status, contentType: res.headers.get('content-type'), bodyStart: body.slice(0, 80).replace(/\s+/g, ' ') });
    } catch (e) {
      results.push({ label, url, ok: false, error: `${e.name}: ${e.message}${e.cause ? ` | cause: ${e.cause.code || e.cause.message}` : ''}` });
    }
  }
  for (const r of results) note(JSON.stringify(r));

  const direct = results.find((r) => r.label === 'express-direct-ipv4');
  const spa = results.find((r) => r.ok && r.label.startsWith('vite-spa'));
  const api =
    results.find((r) => r.ok && r.label === 'vite-proxy-api-localhost') ??
    results.find((r) => r.ok && r.label === 'vite-proxy-api-ipv6') ??
    results.find((r) => r.ok && r.label === 'vite-proxy-api-ipv4');
  const fromExpress = (r) => r?.ok && r.status === 401 && /json/.test(r.contentType || '');

  note('--- DIAGNOSIS ---');
  note(`Express direct 127.0.0.1: ${direct?.ok ? `HTTP ${direct.status} (${direct.contentType})` : `FAILED ${direct?.error}`}`);
  note(`Vite SPA first reachable: ${spa?.ok ? `HTTP ${spa.status} (${spa.contentType})` : `FAILED ${spa?.error}`}`);
  note(`Proxy /api/orders (${api?.label}): ${api?.ok ? `HTTP ${api.status} (${api.contentType}) body=${api.bodyStart}` : `FAILED ${api?.error}`}`);
  for (const r of results.filter((x) => x.label.includes('vite-spa') || x.label.includes('vite-proxy'))) {
    note(`  ${r.label.padEnd(26)} ${r.ok ? `HTTP ${r.status}` : `FAILED (${r.error})`}`);
  }
  if (fromExpress(api)) note('VERDICT: /api/orders traversed Vite -> Express (401 from auth middleware).');
  else note('VERDICT: proxy path not confirmed; see probe evidence above.');
  process.exitCode = fromExpress(api) && spa?.ok && direct?.ok ? 0 : 1;
} catch (e) {
  note(`FATAL: ${e.message}`);
  process.exitCode = 1;
} finally {
  shuttingDown = true;
  for (const p of procs) killTree(p.pid);
  await wait(500);
  note('[done] child processes terminated.');
}
