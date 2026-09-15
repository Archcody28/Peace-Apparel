import express from 'express'
import * as controller from '../controllers/ordersController.js'

const router = express.Router()

router.get('/', controller.getOrders)
router.post('/', controller.createOrder)
router.put('/', controller.updateOrder)
router.delete('/', controller.deleteOrder)

export default router
