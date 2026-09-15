# Peace Apparel — Luxury African Fashion Ecommerce

A premium full-stack ecommerce website and admin dashboard for Peace Apparel, a luxury Afro fashion brand.

## Live Demo

Deployed on Vercel. The production URL is available in the Design Arena preview panel.

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4
- **Animations:** Framer Motion
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database & Storage:** Supabase (Postgres + Storage)
- **Charts:** Chart.js + react-chartjs-2
- **Icons:** Lucide React

## Admin Access

- **URL:** `/####`
- **Email:** ``
- **Password:** ``

## Features

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
- Dashboard overview with animated counters and Chart.js analytics
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

## Database Schema

- `products` — name, price, stock, categories, sizes, colors, images, featured
- `orders` — customer details, delivery method, items, totals, status
- `subscribers` — email capture
- `testimonials` — customer reviews
- `homepage_features` — homepage content sections
- `categories` — product categories
- `settings` — store configuration

## Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_JWT_SECRET=
```

## Local Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run build
# Deploy via Design Arena deploy_to_vercel tool
```

## Production Deployment

- **Set environment variables:** add the keys from `.env.example` to your hosting platform (Vercel, Docker, or other). Do NOT commit secrets to the repository.
- **Vercel:** configure the environment variables in the Vercel dashboard; this repo includes `vercel.json` for rewrites/headers but `env` values have been emptied — set them in the dashboard.
- **Docker:** build and run the provided `Dockerfile`:

```bash
docker build -t peace-apparel:latest .
docker run -p 80:80 peace-apparel:latest
```

- **CI:** a GitHub Actions workflow at `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm run build` on push and PRs to `main`.

- **Local production preview:**

```bash
npm ci
npm run build
npm run preview
```

## Security

- CORS enabled on all API routes
- JWT authentication for admin routes
- Security headers via Vercel config (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- React's built-in XSS protection

## License

Private — Peace Apparel.
