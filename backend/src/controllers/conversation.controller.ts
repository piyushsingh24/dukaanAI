import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const conversations = await prisma.conversation.findMany({
      where: { merchantId },
      include: { customer: true, messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { lastMessageAt: 'desc' },
    });

    return sendSuccess(res, conversations);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch conversations');
  }
}

export async function getConversationById(req: AuthRequest, res: Response) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return sendError(res, 'Conversation not found', 404);
    }

    return sendSuccess(res, conversation);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch conversation');
  }
}

export async function archiveConversation(req: AuthRequest, res: Response) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!conversation) return sendError(res, 'Conversation not found', 404);

    const updated = await prisma.conversation.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });
    return sendSuccess(res, updated, 'Conversation archived');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to archive conversation');
  }
}

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const { conversationId, content } = req.body;
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, merchantId: req.user!.merchantId },
    });
    if (!conversation) return sendError(res, 'Conversation not found', 404);

    const message = await prisma.message.create({
      data: { conversationId, senderType: 'MERCHANT', content, messageType: 'TEXT' },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: content, lastMessageAt: new Date() },
    });

    return sendSuccess(res, message, 'Message sent', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to send message');
  }
}

export async function getSuggestedReply(req: AuthRequest, res: Response) {
  try {
    const message = await prisma.message.findFirst({
      where: { id: req.params.id },
      include: { conversation: { include: { customer: true } } },
    });
    if (!message) return sendError(res, 'Message not found', 404);

    const suggested = `Thank you for your message. We have received your request and will process it shortly.`;
    return sendSuccess(res, { suggested, originalMessage: message.content });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to generate reply');
  }
}

export async function approveReply(req: AuthRequest, res: Response) {
  try {
    const { reply } = req.body;
    const message = await prisma.message.findFirst({
      where: { id: req.params.id },
      include: { conversation: true },
    });
    if (!message) return sendError(res, 'Message not found', 404);

    const sentMessage = await prisma.message.create({
      data: {
        conversationId: message.conversationId,
        senderType: 'MERCHANT',
        messageType: 'TEXT',
        content: reply,
      },
    });

    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: { lastMessage: reply, lastMessageAt: new Date() },
    });

    return sendSuccess(res, sentMessage, 'Reply sent');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to send reply');
  }
}

export async function deleteConversation(req: AuthRequest, res: Response) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!conversation) return sendError(res, 'Conversation not found', 404);

    await prisma.message.deleteMany({ where: { conversationId: req.params.id } });
    await prisma.conversation.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Conversation deleted');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete conversation');
  }
}
