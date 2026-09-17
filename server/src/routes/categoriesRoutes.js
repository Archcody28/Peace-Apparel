import express from 'express'
import * as controller from '../controllers/categoriesController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET stays public: category data is catalog metadata.
router.get('/', controller.getCategories)
router.post('/', requireAdmin, controller.createCategory)
router.put('/', requireAdmin, controller.updateCategory)
router.delete('/', requireAdmin, controller.deleteCategory)

export default router
