import express from 'express'
import * as controller from '../controllers/subscribersController.js'

const router = express.Router()

router.get('/', controller.getSubscribers)
router.post('/', controller.createSubscriber)
router.delete('/', controller.deleteSubscriber)

export default router
