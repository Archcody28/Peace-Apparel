import express from 'express'
import * as controller from '../controllers/adminAuthController.js'

const router = express.Router()

router.post('/', controller.loginAdmin)
router.get('/', controller.verifyAdmin)

export default router
