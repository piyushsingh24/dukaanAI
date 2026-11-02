import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getRevenueAnalytics(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const orders = await prisma.order.findMany({
      where: { merchantId, status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthly: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((o) => {
      const key = o.createdAt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthly[key]) monthly[key] = { revenue: 0, orders: 0 };
      monthly[key].revenue += o.total;
      monthly[key].orders += 1;
    });

    return sendSuccess(
      res,
      Object.entries(monthly).map(([month, data]) => ({ month, ...data }))
    );
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch revenue analytics');
  }
}

export async function getOrderAnalytics(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const statusDist = await prisma.order.groupBy({
      by: ['status'],
      where: { merchantId },
      _count: true,
    });

    return sendSuccess(res, statusDist.map((s) => ({ status: s.status, count: s._count })));
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch order analytics');
  }
}

export async function getProductAnalytics(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const items = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { merchantId } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId).filter(Boolean) as string[] } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const result = items.map((i) => ({
      productId: i.productId,
      productName: productMap.get(i.productId!)?.productName || 'Unknown',
      sold: i._sum.quantity || 0,
      revenue: i._sum.totalPrice || 0,
    }));

    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch product analytics');
  }
}

export async function getCustomerAnalytics(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const [totalCustomers, activeCustomers, totalOrders] = await Promise.all([
      prisma.customer.count({ where: { merchantId } }),
      prisma.customer.count({
        where: { merchantId, lastOrderDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.order.count({ where: { merchantId } }),
    ]);

    return sendSuccess(res, { totalCustomers, activeCustomers, totalOrders });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch customer analytics');
  }
}

export async function getAIInsights(req: AuthRequest, res: Response) {
  try {
    const insights = await prisma.aIInsight.findMany({
      where: { merchantId: req.user!.merchantId },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
    return sendSuccess(res, insights);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch insights');
  }
}
