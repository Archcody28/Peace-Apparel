import express from 'express'
import cors from 'cors'
import productRoutes from './src/routes/productRoutes.js'
import ordersRoutes from './src/routes/ordersRoutes.js'
import subscriberRoutes from './src/routes/subscriberRoutes.js'
import testimonialRoutes from './src/routes/testimonialRoutes.js'
import homepageFeatureRoutes from './src/routes/homepageFeatureRoutes.js'
import settingsRoutes from './src/routes/settingsRoutes.js'
import analyticsRoutes from './src/routes/analyticsRoutes.js'
import uploadRoutes from './src/routes/uploadRoutes.js'
import adminAuthRoutes from './src/routes/adminAuthRoutes.js'
import registerAdminRoutes from './src/routes/registerAdminRoutes.js'
import verifyPaymentRoutes from './src/routes/verifyPaymentRoutes.js'
import categoriesRoutes from './src/routes/categoriesRoutes.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/products', productRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/subscribers', subscriberRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/homepage-features', homepageFeatureRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/admin-auth', adminAuthRoutes)
app.use('/api/register-admin', registerAdminRoutes)
app.use('/api/verify-payment', verifyPaymentRoutes)
app.use('/api/categories', categoriesRoutes)

const port = process.env.PORT ? Number(process.env.PORT) : 3001
app.listen(port, () => console.log(`Dev server listening on http://localhost:${port}`))

export default app
