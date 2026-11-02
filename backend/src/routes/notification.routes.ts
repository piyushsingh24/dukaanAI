import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
  getUnreadCount,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
