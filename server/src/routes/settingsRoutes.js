import express from 'express'
import * as controller from '../controllers/settingsController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public storefront read: whitelisted store-identity fields only, no auth.
// Must be registered before the admin-only '/' route to avoid shadowing.
router.get('/public', controller.getPublicSettings)

// Store settings are configuration data managed exclusively by admins.
router.get('/', requireAdmin, controller.getSettings)
router.post('/', requireAdmin, controller.saveSettings)
router.put('/', requireAdmin, controller.saveSettings)

export default router
