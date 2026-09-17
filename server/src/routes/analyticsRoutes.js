import express from 'express'
import * as controller from '../controllers/analyticsController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Sales analytics are internal business data.
router.get('/', requireAdmin, controller.getAnalytics)

export default router
