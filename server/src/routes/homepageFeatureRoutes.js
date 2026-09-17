import express from 'express'
import * as controller from '../controllers/homepageFeaturesController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET stays public: homepage content.
router.get('/', controller.getHomepageFeatures)
router.post('/', requireAdmin, controller.createHomepageFeature)
router.put('/', requireAdmin, controller.updateHomepageFeature)
router.delete('/', requireAdmin, controller.deleteHomepageFeature)

export default router
