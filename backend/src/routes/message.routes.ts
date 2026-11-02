import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { sendMessage, getSuggestedReply, approveReply } from '../controllers/conversation.controller';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.post('/webhook', async (req, res) => {
  try {
    const { merchantId, conversationId, sender, content } = req.body;
    if (!merchantId || !conversationId || !sender || !content) {
      return sendError(res, 'merchantId, conversationId, sender, and content are required', 422);
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, merchantId },
    });
    if (!conversation) return sendError(res, 'Conversation not found', 404);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderType: sender === 'customer' ? 'CUSTOMER' : 'MERCHANT',
        content,
        messageType: 'TEXT',
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: content, lastMessageAt: new Date(), unreadCount: { increment: 1 } },
    });

    return sendSuccess(res, message, 'Message received', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to process message');
  }
});

router.use(authenticate);

router.post('/send', sendMessage);
router.get('/:id/reply', getSuggestedReply);
router.post('/:id/approve', approveReply);
router.post('/:id/regenerate', async (req, res) => {
  const reply = `Thank you for your message. We'll get back to you shortly.`;
  return res.json({ success: true, data: { reply } });
});

export default router;
