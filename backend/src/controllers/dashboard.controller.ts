import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersToday, totalRevenue, pendingPayments, lowStockItems, recentActivity, aiSuggestions] =
      await Promise.all([
        prisma.order.count({ where: { merchantId, createdAt: { gte: today } } }),
        prisma.order.aggregate({
          where: { merchantId, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }),
        prisma.order.aggregate({
          where: { merchantId, paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
          _sum: { total: true },
        }),
        prisma.inventory.count({
          where: { product: { merchantId }, currentStock: { lte: prisma.inventory.fields.minimumStock } },
        }),
        prisma.auditLog.findMany({
          where: { merchantId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.aIInsight.findMany({
          where: { merchantId },
          orderBy: { generatedAt: 'desc' },
          take: 5,
        }),
      ]);

    const revenueTrend = await getRevenueTrend(merchantId);
    const orderStatusDistribution = await getOrderStatusDistribution(merchantId);

    return sendSuccess(res, {
      ordersToday,
      revenue: totalRevenue._sum.total || 0,
      pendingPayments: pendingPayments._sum.total || 0,
      lowStockItems,
      revenueTrend,
      orderStatusDistribution,
      recentActivity,
      aiSuggestions,
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch dashboard');
  }
}

export async function getDashboardCards(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersToday, revenue, customers, pendingAmount] = await Promise.all([
      prisma.order.count({ where: { merchantId, createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { merchantId, status: { not: 'CANCELLED' }, createdAt: { gte: today } },
        _sum: { total: true },
      }),
      prisma.customer.count({ where: { merchantId } }),
      prisma.order.aggregate({
        where: { merchantId, paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { total: true },
      }),
    ]);

    return sendSuccess(res, {
      ordersToday,
      revenue: revenue._sum.total || 0,
      totalCustomers: customers,
      pendingPayments: pendingAmount._sum.total || 0,
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch dashboard cards');
  }
}

export async function getActivity(req: AuthRequest, res: Response) {
  try {
    const activity = await prisma.auditLog.findMany({
      where: { merchantId: req.user!.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return sendSuccess(res, activity);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch activity');
  }
}

async function getRevenueTrend(merchantId: string) {
  const orders = await prisma.order.findMany({
    where: { merchantId, status: { not: 'CANCELLED' } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const days: Record<string, number> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { weekday: 'short' });
    days[key] = 0;
  }

  orders.forEach((o) => {
    const key = o.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
    if (key in days) days[key] += o.total;
  });

  return Object.entries(days).map(([date, amount]) => ({ date, amount }));
}

async function getOrderStatusDistribution(merchantId: string) {
  const orders = await prisma.order.groupBy({
    by: ['status'],
    where: { merchantId },
    _count: true,
  });
  return orders.map((o) => ({ status: o.status, count: o._count }));
}
