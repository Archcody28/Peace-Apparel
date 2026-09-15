import express from 'express'
import * as controller from '../controllers/testimonialsController.js'

const router = express.Router()

router.get('/', controller.getTestimonials)
router.post('/', controller.createTestimonial)
router.put('/', controller.updateTestimonial)
router.delete('/', controller.deleteTestimonial)

export default router
