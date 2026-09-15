import express from 'express';
import cors from 'cors';
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

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

export default app;
