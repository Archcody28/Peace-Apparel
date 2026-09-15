import express from 'express'
import * as controller from '../controllers/registerAdminController.js'

const router = express.Router()

router.post('/', controller.registerAdmin)

export default router
