import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getPayments,
  createPayment,
  getCustomerPayments,
  getPendingPayments,
  sendReminder,
} from '../controllers/payment.controller';

const router = Router();

router.use(authenticate);

router.get('/', getPayments);
router.post('/', createPayment);
router.get('/customer/:id', getCustomerPayments);
router.get('/pending', getPendingPayments);
router.post('/reminder', sendReminder);

export default router;
