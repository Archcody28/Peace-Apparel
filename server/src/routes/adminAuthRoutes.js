import express from 'express'
import * as controller from '../controllers/adminAuthController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST stays public: an unauthenticated admin needs a token (rate-limited in app.ts).
router.post('/', controller.loginAdmin)
// Token verification requires a valid token.
router.get('/', requireAuth, controller.verifyAdmin)

export default router
