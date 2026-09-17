import express from 'express'
import * as controller from '../controllers/ordersController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST stays public: guest checkout (WhatsApp/card) creates orders without an account.
router.post('/', controller.createOrder)
// Order visibility and management are admin-only.
router.get('/', requireAdmin, controller.getOrders)
router.put('/', requireAdmin, controller.updateOrder)
router.delete('/', requireAdmin, controller.deleteOrder)

export default router
