import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getInventory,
  updateStock,
  getLowStock,
  getRestockRecommendations,
} from '../controllers/inventory.controller';

const router = Router();

router.use(authenticate);

router.get('/', getInventory);
router.patch('/:id', updateStock);
router.get('/low-stock', getLowStock);
router.get('/recommendations', getRestockRecommendations);

export default router;
