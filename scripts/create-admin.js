#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const [,, email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password>');
  process.exit(1);
}

const url = process.env.SUPABASE_SERVICE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  // attempt to load .env from project root
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
        if (m) {
          const k = m[1];
          let v = m[2] || '';
          if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

const finalUrl = process.env.SUPABASE_SERVICE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || url;
const finalKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || key;

if (!finalUrl || !finalKey) {
  console.error('Missing Supabase URL or service role key in environment (.env).');
  process.exit(1);
}

const supabase = createClient(finalUrl, finalKey);

async function run() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (error) {
      console.error('Supabase error:', error.message || error);
      process.exit(1);
    }
    console.log('Admin created:', data.user.id, data.user.email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message || err);
    process.exit(1);
  }
}

run();
