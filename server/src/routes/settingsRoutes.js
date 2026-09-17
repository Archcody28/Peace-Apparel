import express from 'express'
import * as controller from '../controllers/settingsController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Store settings are configuration data managed exclusively by admins.
router.get('/', requireAdmin, controller.getSettings)
router.post('/', requireAdmin, controller.saveSettings)
router.put('/', requireAdmin, controller.saveSettings)

export default router
