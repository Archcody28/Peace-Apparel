import express from 'express'
import * as controller from '../controllers/uploadController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Uploading into the Supabase bucket is an administrative operation.
router.post('/', requireAdmin, controller.uploadFile)

export default router
