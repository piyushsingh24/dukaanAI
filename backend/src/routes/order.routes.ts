import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  approveOrder,
  cancelOrder,
  deleteOrder,
} from '../controllers/order.controller';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/approve', approveOrder);
router.patch('/:id/cancel', cancelOrder);
router.delete('/:id', deleteOrder);

export default router;
