#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const [,, email] = process.argv;
if (!email) {
  console.error('Usage: node scripts/generate-admin-token.js <email>');
  process.exit(1);
}

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};
    const out = {};
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (m) {
        let v = m[2] || '';
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        out[m[1]] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

const env = loadEnv();
const secret = process.env.ADMIN_JWT_SECRET || env.ADMIN_JWT_SECRET;
if (!secret) {
  console.error('ADMIN_JWT_SECRET not found in environment or .env');
  process.exit(1);
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
}

// Matches server/src/services/tokenService.js exactly:
// HS256, payload { userId, email, role, exp (seconds) }.
const noRole = process.argv.includes('--no-role'); // test token WITHOUT admin role
const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = base64url(JSON.stringify({
  userId: crypto.randomUUID(),
  email: String(email).trim().toLowerCase(),
  role: noRole ? undefined : 'admin',
  exp: Math.floor(Date.now() / 1000) + 86400000,
}));
const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
const token = `${header}.${payload}.${signature}`;

console.log('Generated admin token (paste into browser localStorage key `pa_admin_token`):\n');
console.log(token);
console.log('\nThen refresh the app and go to /admin');
