import express from 'express'
import * as controller from '../controllers/verifyPaymentController.js'

const router = express.Router()

router.post('/', controller.verifyPayment)

export default router
