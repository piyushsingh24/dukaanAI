import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { getIO } from '../socket';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { merchantId: req.user!.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return sendSuccess(res, notifications);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch notifications');
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!notification) return sendError(res, 'Notification not found', 404);

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return sendSuccess(res, updated, 'Notification marked as read');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update notification');
  }
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!notification) return sendError(res, 'Notification not found', 404);

    await prisma.notification.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Notification deleted');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete notification');
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const count = await prisma.notification.count({
      where: { merchantId: req.user!.merchantId, isRead: false },
    });
    return sendSuccess(res, { unreadCount: count });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch unread count');
  }
}
