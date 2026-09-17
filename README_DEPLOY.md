# Deployment status — Phase 3 blocked

## Verified repository state

Canonical frontend: client/ (Vite/React). Canonical backend: server/ (Express).
Legacy api/ was already deleted in the working tree at resumption. vercel.json
has a catch-all SPA rewrite and headers, not a legacy API rewrite.
.vercel/project.json links a project, but does not establish active domains,
deployment settings or an Express origin. Dockerfile describes a combined
image; CI builds but does not deploy. Actual production hosting is UNVERIFIED.

Intended: Browser -> client -> Express authorization -> controllers -> Supabase.
Removing source locally does not disable old Vercel deployment URLs or aliases.

## Deployment-owner action required

Identify the active frontend domain/project, root/build settings and canonical
Express host/origin. Retire or protect all legacy deployments and update aliases.
Verify deployed routing before declaring the bypass removed. No deployment or
domain changes were performed here; no upstream URL was invented.

Current Vercel catch-all sends same-origin /api requests to index.html; it does
not proxy to Express. For frontend-only hosting, set VITE_API_URL to the verified
HTTPS Express origin at build time (no trailing slash or /api suffix), and set
CORS_ORIGIN on Express. Empty VITE_API_URL is not valid for that topology.

## Local development

```sh
npm install
npm --prefix client ci
npm --prefix server ci
npm run dev
```

Copy client/.env.example and server/.env.example to their corresponding .env
files. Empty client VITE_API_URL uses Vite :5173 /api proxy -> Express :3001.
Server requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ADMIN_JWT_SECRET.
VITE_* variables are public build inputs, never server secrets.
ADMIN_REGISTRATION_SECRET gates provisioning; PAYSTACK_SECRET_KEY is server-only.
VITE_PAYSTACK_PUBLIC_KEY is public. Existing no-secret payment demo behavior must
not be treated as verified production payment processing.

Development proxy notes (measured on this machine, Windows/Node 22):

- Express listens on all loopback interfaces: 127.0.0.1:3001 and [::1]:3001 both
  answer. Vite 7 bound to IPv6 ::1:5173 only here; 127.0.0.1:5173 refused
  connections while [::1]:5173 and localhost:5173 worked. Browsers resolve
  localhost to both families, so the app is unaffected. When scripting HTTP
  checks against Vite, use the localhost hostname or [::1], not 127.0.0.1.
- The Vite proxy target localhost:3001 is correct and verified: with placeholder
  credentials, GET http://localhost:5173/api/orders returned Express's
  401 {"error":"Authentication required"} JSON through the proxy.
- node scripts/dev-proxy-check.mjs reproduces this end-to-end with isolated
  placeholder-only environment; it never touches real credentials or the
  database, terminates both children on success, failure and Ctrl+C, and exits 0
  only when the proxy response provably comes from Express auth middleware.


## Supported production serving — deployment remains unverified

Use Node 22 LTS, at least 22.12.0 (Vite requires ^20.19.0 or >=22.12.0;
the installed server Supabase SDK requires >=22). Docker and CI use Node 22.

npm run build produces client/dist and server/dist. npm start loads server/.env
independent of the working directory; host environment takes precedence.
Express resolves paths relative to its module: server/public/index.html wins
when present (Docker layout), otherwise client/dist is used. Remove stale
server/public build artifacts deliberately if switching back to repository builds.
API routers run first; unknown /api paths return JSON 404, never index.html.
HTML GET/HEAD deep links, including /products/:id and /admin, receive index.html.
Missing asset files remain 404. /product/:id is not a React route; use /products/:id.

Docker copies the built SPA to /workspace/server/public. .dockerignore excludes
real env files, node_modules and existing dist outputs. The image uses a non-root
runtime user and installs runtime dependencies without dev dependencies. The
file:.. package links retain their parent layout. Docker execution is unavailable
here; this configuration is statically reviewed, not image-build certified.

```sh
npm run build
npm start
docker build -t peace-apparel:latest .
docker run --env-file server/.env -p 3001:3001 peace-apparel:latest
```

Docker defaults to same-origin API requests. Public VITE_* build args may be
provided for Paystack/Supabase sessions or separate-origin API hosting; never
pass service-role or JWT secrets as build args. Container runtime env cannot
change the already-built Vite bundle. Set NODE_ENV=production on Node hosts.

## Environment inventory

| Variable | Used by | Boundary | Required / purpose |
| --- | --- | --- | --- |
| VITE_API_URL | apiFetch, pages, checkout, newsletter | Client build | Empty for dev proxy/same-origin; required Express origin for split hosting |
| VITE_SUPABASE_URL | browser Supabase client / AuthContext | Client build | With anon key for real session subscriptions; not required to compile/load UI |
| VITE_SUPABASE_ANON_KEY | browser Supabase client / AuthContext | Client build, public | Pair with URL; never replace with service-role key |
| VITE_PAYSTACK_PUBLIC_KEY | Paystack components | Client build, public | Required for real inline payments; missing enables existing demo UI |
| SUPABASE_URL | server SDK, create-admin | Server/scripts | Required at boot; project endpoint |
| SUPABASE_SERVICE_ROLE_KEY | server SDK, create-admin | Server/scripts, secret | Required at boot; privileged database/storage/auth access |
| ADMIN_JWT_SECRET | token service, token generation | Server/scripts, secret | Required at boot; independent admin signing secret |
| ADMIN_REGISTRATION_SECRET | registration controller | Server, secret | Optional; missing disables HTTP provisioning (503) |
| PAYSTACK_SECRET_KEY | payment verification controller | Server, secret | Required for real payments; missing permits existing demo behavior |
| CORS_ORIGIN | Express middleware | Server | Exact comma-separated frontend origins for split hosting; localhost also currently allowed |
| PORT | server entrypoints | Server | Optional, default 3001; dev proxy is fixed to 3001 |
| NODE_ENV | dev entrypoint, Express, Docker | Server/tooling | Set production on production host; do not use production for npm run dev |
| BASE_URL | security-check.mjs | Test only | Running isolated test server origin; local runner supplies it |

Legacy aliases SUPABASE_SERVICE_URL, NEXT_PUBLIC_SUPABASE_URL and VITE_SUPABASE_URL
are still read by create-admin as URL fallbacks; SUPABASE_SERVICE_KEY is a
server-only legacy key alias. Prefer SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.
The Vite compatibility configuration also exposes NEXT_PUBLIC_* values; never
put secrets under that prefix either. No additional aliases are required for
normal client/server startup. The root .env.example is documentation; runtime
server loading targets server/.env, while bootstrap scripts can read root .env.
Only environment variable names, never values, are included in startup errors.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
node scripts/serving-check.mjs
node scripts/security-check-local.mjs
```

The local runner runs the unchanged security-check.mjs suite against an isolated
Express instance and loopback failing upstream. It overrides inherited DB keys
and generates throwaway secrets. This verifies route authorization, not live
commerce/persistence. There are 60 assertions, not the previously reported 61.
Never point the suite's write requests at production. The bare security-check.mjs
requires an already running test server, BASE_URL and matching test secrets.

See supabase/README.md for database access and schema blockers.

