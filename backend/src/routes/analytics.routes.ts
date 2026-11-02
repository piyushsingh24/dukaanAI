import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getRevenueAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getAIInsights,
} from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/revenue', getRevenueAnalytics);
router.get('/orders', getOrderAnalytics);
router.get('/products', getProductAnalytics);
router.get('/customers', getCustomerAnalytics);
router.get('/insights', getAIInsights);

export default router;
