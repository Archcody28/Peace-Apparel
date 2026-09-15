import express from 'express'
import * as controller from '../controllers/homepageFeaturesController.js'

const router = express.Router()

router.get('/', controller.getHomepageFeatures)
router.post('/', controller.createHomepageFeature)
router.put('/', controller.updateHomepageFeature)
router.delete('/', controller.deleteHomepageFeature)

export default router
