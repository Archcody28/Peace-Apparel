import express from 'express'
import * as controller from '../controllers/subscribersController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST stays public: newsletter signup.
router.post('/', controller.createSubscriber)
// Subscriber data is admin-only (PII).
router.get('/', requireAdmin, controller.getSubscribers)
router.delete('/', requireAdmin, controller.deleteSubscriber)

export default router
