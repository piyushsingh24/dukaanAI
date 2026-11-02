import { groqChat, groqChatText } from '../ai/groq';
import { INSIGHT_PROMPT, REPLY_PROMPT } from '../ai/config';
import { prisma } from '../config/database';

export async function generateReply(
  customerMessage: string,
  context?: {
    intent?: string;
    products?: string;
    customerName?: string;
  }
): Promise<string> {
  let contextStr = '';
  if (context) {
    contextStr = Object.entries(context)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }

  const messages = [
    { role: 'system' as const, content: REPLY_PROMPT },
    ...(contextStr ? [{ role: 'user' as const, content: contextStr }] : []),
    { role: 'user' as const, content: `Customer said: "${customerMessage}"\nGenerate a reply:` },
  ];

  try {
    return await groqChatText(messages);
  } catch {
    return 'Thank you for your message. We will get back to you shortly.';
  }
}

export async function generateDailySummary(merchantId: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, revenue, pending, lowStock] = await Promise.all([
    prisma.order.count({ where: { merchantId, createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { merchantId, createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { merchantId, paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
      _sum: { total: true },
    }),
    prisma.inventory.count({
      where: { product: { merchantId }, currentStock: { lte: prisma.inventory.fields.minimumStock } },
    }),
  ]);

  const data = {
    ordersToday: orders,
    revenue: revenue._sum.total || 0,
    pendingPayments: pending._sum.total || 0,
    lowStockItems: lowStock,
  };

  const messages = [
    { role: 'system' as const, content: INSIGHT_PROMPT },
    { role: 'user' as const, content: JSON.stringify(data) },
  ];

  try {
    return await groqChatText(messages);
  } catch {
    return `Today's Summary: ${orders} orders, Revenue: ₹${revenue._sum.total || 0}, Pending: ₹${pending._sum.total || 0}`;
  }
}

export async function generateInsights(merchantId: string) {
  const [recentOrders, lowStock, topCustomers] = await Promise.all([
    prisma.order.findMany({
      where: { merchantId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: { customer: true, items: { include: { product: true } } },
      take: 20,
    }),
    prisma.inventory.findMany({
      where: { product: { merchantId }, currentStock: { lte: prisma.inventory.fields.minimumStock } },
      include: { product: true },
    }),
    prisma.customer.findMany({
      where: { merchantId },
      orderBy: { totalOrders: 'desc' },
      take: 5,
    }),
  ]);

  const insights: { title: string; description: string; type: string }[] = [];

  if (lowStock.length > 0) {
    insights.push({
      type: 'INVENTORY_ALERT',
      title: 'Low Stock Alert',
      description: `${lowStock.length} products need restocking: ${lowStock.map((i) => i.product.productName).join(', ')}`,
    });
  }

  if (topCustomers.length > 0) {
    insights.push({
      type: 'CUSTOMER_INSIGHT',
      title: 'Top Customer',
      description: `${topCustomers[0].fullName} has placed ${topCustomers[0].totalOrders} orders`,
    });
  }

  const pendingAmount = recentOrders
    .filter((o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'OVERDUE')
    .reduce((sum, o) => sum + o.total, 0);

  if (pendingAmount > 0) {
    insights.push({
      type: 'RECOMMENDATION',
      title: 'Payment Follow-up',
      description: `${pendingAmount > 1000 ? 'Urgent: ' : ''}₹${pendingAmount} in pending payments needs attention`,
    });
  }

  return insights;
}
