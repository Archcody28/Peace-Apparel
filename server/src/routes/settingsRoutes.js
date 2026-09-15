import express from 'express'
import * as controller from '../controllers/settingsController.js'

const router = express.Router()

router.get('/', controller.getSettings)
router.post('/', controller.saveSettings)
router.put('/', controller.saveSettings)

export default router
