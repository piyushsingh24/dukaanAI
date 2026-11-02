import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/inventory.controller';
import { getProductById, updateProductFull } from '../controllers/product.controller';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProductFull);
router.delete('/:id', deleteProduct);

export default router;
