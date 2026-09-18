import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import serveFrontend from './serveFrontend.js';
import rateLimit from 'express-rate-limit';
import productRoutes from './routes/productRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import subscriberRoutes from './routes/subscriberRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import homepageFeatureRoutes from './routes/homepageFeatureRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import registerAdminRoutes from './routes/registerAdminRoutes.js';
import verifyPaymentRoutes from './routes/verifyPaymentRoutes.js';
import categoriesRoutes from './routes/categoriesRoutes.js';
import diagnosticsRoutes from './routes/diagnosticsRoutes.js';

const app = express();
app.disable('x-powered-by');

// Basic security headers. CSP is relaxed for the served SPA (inline Vite bundle).
app.use(
  helmet({
    contentSecurityPolicy: false, // the static SPA bundle uses inline scripts/assets
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // client may be served from another origin in dev
  })
);

// CORS allowlist. Comma-separated origins via CORS_ORIGIN; local dev origins are
// always allowed so development never breaks. Requests without an Origin header
// (same-origin, curl-to-served-app) are always allowed.
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
];
const allowedOrigins = new Set([...configuredOrigins, ...devOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false); // not an error: simply omit CORS headers
    },
  })
);

app.use(express.json({ limit: '10mb' }));

// Lightweight brute-force protection on the sensitive auth endpoints only.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});
app.use('/api/admin-auth', authLimiter);
app.use('/api/register-admin', authLimiter);

app.use('/api/products', productRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/homepage-features', homepageFeatureRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/register-admin', registerAdminRoutes);
app.use('/api/verify-payment', verifyPaymentRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

serveFrontend(app);

// Malformed JSON body handler (must come after routes to keep behavior stable,
// but before the generic handler). Safe error output only — no internals leaked.
// The 4-argument signature is required by Express to identify error middleware.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const e = err as { type?: string; status?: number; statusCode?: number; message?: string };
  if (e?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed request body' });
  }
  if (e?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  console.error('Unhandled error:', err);
  const status = e?.status || e?.statusCode || 500;
  return res.status(status).json({ error: status === 500 ? 'Internal server error' : e?.message });
});

export default app;
