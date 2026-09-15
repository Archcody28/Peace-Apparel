import express from 'express'
import * as controller from '../controllers/uploadController.js'

const router = express.Router()

router.post('/', controller.uploadFile)

export default router
