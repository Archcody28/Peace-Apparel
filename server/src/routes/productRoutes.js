import express from 'express';
import * as controller from '../controllers/productController.js';

const router = express.Router();

router.get('/', controller.getProducts);
router.post('/', controller.createProduct);
router.put('/', controller.updateProduct);
router.delete('/', controller.deleteProduct);

export default router;
