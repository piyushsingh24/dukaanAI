import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { getIO } from '../socket';

export async function getPayments(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where: { merchantId },
        include: { customer: true, order: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.count({ where: { merchantId } }),
    ]);

    return sendSuccess(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch payments');
  }
}

export async function createPayment(req: AuthRequest, res: Response) {
  try {
    const data = { ...req.body, merchantId: req.user!.merchantId };
    const payment = await prisma.payment.create({ data });

    if (data.orderId && data.paymentStatus === 'PAID') {
      const orderPayments = await prisma.payment.aggregate({
        where: { orderId: data.orderId },
        _sum: { amount: true },
      });
      const order = await prisma.order.findUnique({ where: { id: data.orderId } });

      if (order && orderPayments._sum.amount! >= order.total) {
        await prisma.order.update({ where: { id: data.orderId }, data: { paymentStatus: 'PAID' } });
      }
    }

    try {
      getIO().to(`merchant:${data.merchantId}`).emit('payment:updated', { paymentId: payment.id, amount: payment.amount, customerId: data.customerId });
    } catch {}
    return sendSuccess(res, payment, 'Payment recorded', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create payment');
  }
}

export async function getCustomerPayments(req: AuthRequest, res: Response) {
  try {
    const payments = await prisma.payment.findMany({
      where: { customerId: req.params.id, merchantId: req.user!.merchantId },
      include: { order: true },
      orderBy: { paymentDate: 'desc' },
    });
    return sendSuccess(res, payments);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch customer payments');
  }
}

export async function getPendingPayments(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const orders = await prisma.order.findMany({
      where: { merchantId, paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, orders);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch pending payments');
  }
}

export async function sendReminder(req: AuthRequest, res: Response) {
  try {
    const { customerId, orderId, amount } = req.body;
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, merchantId: req.user!.merchantId },
    });
    if (!customer) return sendError(res, 'Customer not found', 404);

    await prisma.notification.create({
      data: {
        merchantId: req.user!.merchantId,
        title: 'Payment Reminder Sent',
        message: `Reminder sent to ${customer.fullName} for ₹${amount}`,
        type: 'PAYMENT',
      },
    });

    return sendSuccess(res, { customerId, amount }, 'Reminder sent');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to send reminder');
  }
}
