import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import conversationRoutes from './conversation.routes';
import orderRoutes from './order.routes';
import productRoutes from './product.routes';
import inventoryRoutes from './inventory.routes';
import paymentRoutes from './payment.routes';
import dashboardRoutes from './dashboard.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notification.routes';
import aiRoutes from './ai.routes';
import whatsappRoutes from './whatsapp.routes';
import merchantRoutes from './merchant.routes';
import messageRoutes from './message.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'DukaanAI API is running', data: { version: '1.0.0' } });
});

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/conversations', conversationRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/merchant', merchantRoutes);
router.use('/messages', messageRoutes);
router.use('/ai', aiRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router;
