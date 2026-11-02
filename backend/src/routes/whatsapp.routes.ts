import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { whatsappService } from '../services/whatsapp';
import { prisma } from '../config/database';

const router = Router();

router.post('/webhook', async (req, res) => {
  try {
    const { merchantId, messages } = req.body;
    if (!merchantId || !messages?.length) return sendSuccess(res, { processed: 0 }, 'No messages to process');

    let processed = 0;
    for (const msg of messages) {
      const { from, text } = msg;
      if (!from || !text) continue;

      let customer = await prisma.customer.findFirst({
        where: { merchantId, phone: from },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { merchantId, fullName: from, phone: from },
        });
      }

      let conversation = await prisma.conversation.findFirst({
        where: { merchantId, customerId: customer.id },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { merchantId, customerId: customer.id },
        });
      }

      await prisma.message.create({
        data: { conversationId: conversation.id, senderType: 'CUSTOMER', content: text, messageType: 'TEXT' },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessage: text, lastMessageAt: new Date(), unreadCount: { increment: 1 } },
      });

      processed++;
    }

    return sendSuccess(res, { processed }, `${processed} messages processed`);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to process webhook');
  }
});

router.use(authenticate);

router.get('/qr', async (req: AuthRequest, res) => {
  try {
    const qr = await whatsappService.getQR(req.user!.merchantId);
    return sendSuccess(res, { qr, status: whatsappService.getStatus(req.user!.merchantId) });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to get QR code');
  }
});

router.get('/status', (req: AuthRequest, res) => {
  try {
    const status = whatsappService.getStatus(req.user!.merchantId);
    return sendSuccess(res, { status });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to get status');
  }
});

router.post('/connect', async (req: AuthRequest, res) => {
  try {
    await whatsappService.connect(req.user!.merchantId);
    return sendSuccess(res, { status: 'connecting' }, 'Connecting WhatsApp...');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to connect');
  }
});

router.post('/disconnect', async (req: AuthRequest, res) => {
  try {
    await whatsappService.disconnect(req.user!.merchantId);
    return sendSuccess(res, { status: 'disconnected' }, 'WhatsApp disconnected');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to disconnect');
  }
});

router.post('/send', async (req: AuthRequest, res) => {
  try {
    const { jid, text } = req.body;
    if (!jid || !text) return sendError(res, 'jid and text are required', 422);

    await whatsappService.sendMessage(req.user!.merchantId, jid, text);
    return sendSuccess(res, null, 'Message sent');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to send message');
  }
});

export default router;
