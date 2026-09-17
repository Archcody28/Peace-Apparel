# Peace Apparel — Luxury African Fashion Ecommerce

A premium full-stack ecommerce website and admin dashboard for Peace Apparel, a luxury Afro fashion brand.

## Architecture (Phase 1 — client/server monorepo)

```
peace-apparel/
├── client/          # Vite + React 19 + Tailwind v4 frontend (canonical)
├── server/          # Express + Supabase API (canonical)
├── supabase/        # Database verification notes; real baseline still BLOCKED
├── scripts/         # Admin bootstrap (create-admin, generate-admin-token, security-check)
└── package.json     # Orchestrator scripts (dev, build, lint, typecheck)
```

- **Canonical frontend:** `client/` — single source of truth for the UI.
- **Canonical backend:** `server/` (Express). The client talks to the Express API
  (dev: Vite proxy `/api` → `http://localhost:3001`).
- **Legacy `api/` is absent from the current working tree.** This does not prove
  old Vercel deployments are disabled. Production hosting and the Express origin
  remain unverified; see [deployment blockers](README_DEPLOY.md).
- `vercel.json` has a SPA catch-all, not an Express proxy. Same-origin `/api`
  requests on frontend-only hosting will not reach Express without configuration.
- **No verified database baseline exists.** The speculative SQL was quarantined
  outside migrations. See [database status](supabase/README.md).
- **Server-side auth boundary:** administrative endpoints require a verified
  admin JWT (`server/src/middleware/authMiddleware.js`). Client-side guards are
  UX only and are not a security boundary.

## Getting Started

```bash
npm install            # root tooling (concurrently, eslint)
npm --prefix client ci # frontend dependencies
npm --prefix server ci # backend dependencies
npm run dev            # client (Vite :5173) + server (Express :3001) together
npm run lint           # eslint across client/ + server/
npm run typecheck      # tsc for client + server
npm run build          # build client (dist) + server (dist)
```

Environment setup: see `.env.example` (reference), `client/.env.example`, and
`server/.env.example`. Copy them to `client/.env` / `server/.env` and fill values.

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4
- **Animations:** Framer Motion
- **Backend:** Express (Node.js ESM) — see `server/`
- **Database & Storage:** Supabase (Postgres + Storage)
- **Charts:** hand-rolled SVG (`SimpleLineChart`, `SimpleDoughnutChart`)
- **Icons:** Lucide React

## Admin Access

- **URL:** `/login`, then `/admin`.
- Credentials must belong to a provisioned Supabase administrator. No default
  account is shipped; real login remains unverified pending project access.

## Features

These are implemented UI areas, not a claim of live end-to-end verification.
Newsletter discount messaging and purchase notifications do not establish coupon
redemption or real purchase activity; schema/auth/payment verification is pending.

### Public Website
- Luxury homepage with fullscreen hero, scroll animations, and parallax
- Product collection with category filters, search, quick view, and lazy images
- Product details with image gallery/zoom, sizes, colors, quantity selector
- Advanced cart with sliding drawer, localStorage persistence, and checkout modal
- Checkout with pickup, doorstep delivery (+₦3,000 in Aba), and waybill options
- WhatsApp order integration with formatted summary and order ID
- Email subscriber popup with 10% discount offer
- Live purchase notification toasts
- Testimonial wall with animated columns and flip cards
- Fashion gallery masonry layout and Instagram-style lookbook
- About, Contact, FAQ, and 404 pages
- SEO meta tags, sitemap, robots.txt, and web manifest

### Admin Dashboard
- JWT-protected login
- Dashboard overview with animated counters and hand-rolled SVG analytics (`SimpleLineChart`, `SimpleDoughnutChart`)
- Products management (create, edit, delete, filter, search, image upload)
- Orders management (view details, update status, delete)
- Testimonials management
- Homepage features management
- Subscribers list with mailto links
- Store settings
- Dark mode and command palette (Ctrl+K)
- Responsive mobile sidebar

## API Routes

- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/orders`
- `GET/POST/DELETE /api/subscribers`
- `GET/POST/PUT/DELETE /api/testimonials`
- `GET/POST/PUT/DELETE /api/homepage-features`
- `GET/POST/PUT /api/settings`
- `GET /api/analytics`
- `POST /api/upload`
- `POST/GET /api/admin-auth`

## Database status — not a verified schema

Code references products, orders, order_payments, subscribers, testimonials,
homepage_features, categories and settings. Their live columns, constraints,
RLS and storage policies are unverified. No verified migration exists; do not
apply the quarantined draft SQL. See [database notes](supabase/README.md).

## Environment Variables

See [the environment inventory](README_DEPLOY.md#environment-inventory),
client/.env.example and server/.env.example. Only browser-safe VITE_* values
belong in the client. Server startup requires SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY and ADMIN_JWT_SECRET. Missing values fail explicitly;
there is no offline database fallback. Never commit real credentials.

## Local Development

Use Node 22 LTS (>=22.12.0). Install root, client and server dependencies using
the Getting Started commands above. Supply real server configuration through
server/.env or process environment, then run npm run dev. Leave VITE_API_URL
empty for Vite :5173 -> /api proxy -> Express :3001. PORT must match the proxy;
leave NODE_ENV unset for development. No real .env files are generated for you.

## Deployment

The canonical production API is the **Express server** in `server/`. The supported
combined path serves client/dist locally, or server/public in Docker, independent
of cwd. API routers precede static files and SPA deep-link fallback. Actual
production domains, Express hosting and old deployment retirement remain
unverified; see [deployment guidance](README_DEPLOY.md).

```bash
npm run build          # builds client/dist and server/dist
node server/dist/start.js   # production entrypoint (listens on $PORT, default 3001)
```

### Docker

The repository `Dockerfile` builds the client, builds the server, and runs
`server/dist/start.js`:

```bash
docker build -t peace-apparel:latest .
docker run -p 3001:3001 --env-file server/.env peace-apparel:latest
```

### Vercel

`vercel.json` contains **only** SPA rewrites and security headers. It does **not**
route `/api/*` to any serverless handler — API traffic must reach the Express
server (deploy `server/` to a Node host and point `VITE_API_URL` at it).

- **Set environment variables:** add the server keys to the Express host and the
  `VITE_*` keys to the frontend build environment. Do NOT commit secrets.
- **CI:** `.github/workflows/ci.yml` runs install, lint, typecheck, and build on
  push and PRs to `main`.

### Local production check

```bash
npm ci
npm --prefix client ci
npm --prefix server ci
npm run build
npm start
```

## Security

- **Server-side authentication middleware:** `server/src/middleware/authMiddleware.js`
  (`requireAuth`, `requireAdmin`) verifies `Authorization: Bearer <token>` at the
  route boundary. Invalid/malformed/expired tokens → `401`; authenticated but
  insufficient role → `403`.
- **Canonical JWT implementation:** `server/src/services/tokenService.js` — HS256
  with algorithm pinning, timing-safe signature comparison, explicit expiry, and a
  minimal payload (`userId`, `email`, `role`). `ADMIN_JWT_SECRET` is required with
  **no fallback**; the server fails to boot if it is missing.
- **Public vs admin:** catalog/content reads, newsletter signup, order creation,
  payment verification and login are public. Administrative writes, analytics,
  settings, subscriber reads, order reads/updates/deletes and uploads require
  an admin JWT. Registration uses its separate provisioning secret.
- **Rate limiting:** sensitive auth endpoints (`/api/admin-auth`,
  `/api/register-admin`) are rate-limited.
- **Security headers:** Helmet.
- **CORS:** explicit origin allowlist via `CORS_ORIGIN`, plus localhost origins
  currently allowed in all environments — not `*`.
- **Admin registration:** refuses to run (`503`) when `ADMIN_REGISTRATION_SECRET`
  is unset; role is assigned server-side and never taken from the request body.
- **Known limitation:** the admin JWT is stored in `localStorage` on the client.

After building, run `node scripts/serving-check.mjs` for built SPA routing without
Supabase, and `node scripts/security-check-local.mjs` for isolated authorization
regression (60 unchanged assertions plus two existing mocked controller checks).
The bare security-check.mjs requires an already-running test server; it does NOT
start one. Never point its write requests at production. Local results do not
verify live login, schema, RLS, storage, payments or deployment.


## License

Private — Peace Apparel.
