import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  getCustomerLedger,
} from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.get('/:id/orders', getCustomerOrders);
router.get('/:id/ledger', getCustomerLedger);

export default router;
