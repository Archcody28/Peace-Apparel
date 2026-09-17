import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Independent of cwd: works with root npm start, server scripts and Docker.
// Host-provided environment takes precedence over server/.env.
config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`Missing required server environment variables: ${missing.join(', ')}. Configure server/.env or the host environment.`);
}
