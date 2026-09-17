import express from 'express'
import * as controller from '../controllers/testimonialsController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET stays public: testimonials are storefront content.
router.get('/', controller.getTestimonials)
router.post('/', requireAdmin, controller.createTestimonial)
router.put('/', requireAdmin, controller.updateTestimonial)
router.delete('/', requireAdmin, controller.deleteTestimonial)

export default router
