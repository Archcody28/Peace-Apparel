import express from 'express'
import * as controller from '../controllers/categoriesController.js'

const router = express.Router()

router.get('/', controller.getCategories)
router.post('/', controller.createCategory)
router.put('/', controller.updateCategory)
router.delete('/', controller.deleteCategory)

export default router
