import express from 'express';
import * as controller from '../controllers/productController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', controller.getProducts);            // public: storefront catalog
router.post('/', requireAdmin, controller.createProduct);
router.put('/', requireAdmin, controller.updateProduct);
router.delete('/', requireAdmin, controller.deleteProduct);

export default router;
