import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getDashboard,
  getDashboardCards,
  getActivity,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/', getDashboard);
router.get('/cards', getDashboardCards);
router.get('/activity', getActivity);

export default router;
