import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { getIO } from '../socket';

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: any = { merchantId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return sendSuccess(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch orders');
  }
}

export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) return sendError(res, 'Order not found', 404);
    return sendSuccess(res, order);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch order');
  }
}

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const { customerId, items, ...orderData } = req.body;
    const merchantId = req.user!.merchantId;

    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
    const total = subtotal + (orderData.tax || 0) - (orderData.discount || 0);

    const order = await prisma.order.create({
      data: {
        ...orderData,
        merchantId,
        customerId,
        subtotal,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { customer: true, items: { include: { product: true } } },
    });

    try {
      getIO().to(`merchant:${merchantId}`).emit('order:created', { orderId: order.id, customerName: order.customer?.fullName, total: order.total });
    } catch {}
    return sendSuccess(res, order, 'Order created', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create order');
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const { status } = req.body;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!order) return sendError(res, 'Order not found', 404);

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    return sendSuccess(res, updated, 'Order status updated');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update order status');
  }
}

export async function approveOrder(req: AuthRequest, res: Response) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
      include: { items: true },
    });
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.status !== 'DRAFT') return sendError(res, 'Only draft orders can be approved', 422);

    // Deduct inventory for each item
    for (const item of order.items) {
      if (item.productId) {
        const inventory = await prisma.inventory.findUnique({ where: { productId: item.productId } });
        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { currentStock: { decrement: item.quantity } },
          });
        }
      }
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
      include: { customer: true, items: { include: { product: true } } },
    });

    // Update customer totalOrders + lastOrderDate
    await prisma.customer.update({
      where: { id: order.customerId },
      data: { totalOrders: { increment: 1 }, lastOrderDate: new Date(), outstandingAmount: { increment: updated.total } },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        merchantId: req.user!.merchantId,
        type: 'ORDER',
        title: 'Order Confirmed',
        message: `Order #${updated.id.slice(0, 8)} confirmed — ₹${updated.total}`,
      },
    });

    getIO().to(`merchant:${req.user!.merchantId}`).emit('order:created', {
      orderId: updated.id,
      customerName: updated.customer?.fullName,
      total: updated.total,
      status: 'CONFIRMED',
    });

    return sendSuccess(res, updated, 'Order approved');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to approve order');
  }
}

export async function cancelOrder(req: AuthRequest, res: Response) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!order) return sendError(res, 'Order not found', 404);

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    return sendSuccess(res, updated, 'Order cancelled');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to cancel order');
  }
}

export async function deleteOrder(req: AuthRequest, res: Response) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!order) return sendError(res, 'Order not found', 404);

    await prisma.orderItem.deleteMany({ where: { orderId: req.params.id } });
    await prisma.payment.deleteMany({ where: { orderId: req.params.id } });
    await prisma.order.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Order deleted');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete order');
  }
}
