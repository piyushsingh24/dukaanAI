import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getCustomers(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';

    const where: any = { merchantId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return sendSuccess(res, {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch customers');
  }
}

export async function getCustomerById(req: AuthRequest, res: Response) {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
        payments: { orderBy: { paymentDate: 'desc' }, take: 10 },
      },
    });

    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    return sendSuccess(res, customer);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch customer');
  }
}

export async function createCustomer(req: AuthRequest, res: Response) {
  try {
    const data = { ...req.body, merchantId: req.user!.merchantId };
    const customer = await prisma.customer.create({ data });
    return sendSuccess(res, customer, 'Customer created', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create customer');
  }
}

export async function updateCustomer(req: AuthRequest, res: Response) {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!customer) return sendError(res, 'Customer not found', 404);

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return sendSuccess(res, updated, 'Customer updated');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update customer');
  }
}

export async function deleteCustomer(req: AuthRequest, res: Response) {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!customer) return sendError(res, 'Customer not found', 404);

    await prisma.customer.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Customer deleted');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete customer');
  }
}

export async function getCustomerOrders(req: AuthRequest, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.params.id, merchantId: req.user!.merchantId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, orders);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch customer orders');
  }
}

export async function getCustomerLedger(req: AuthRequest, res: Response) {
  try {
    const payments = await prisma.payment.findMany({
      where: { customerId: req.params.id, merchantId: req.user!.merchantId },
      orderBy: { paymentDate: 'desc' },
    });

    const orders = await prisma.order.findMany({
      where: { customerId: req.params.id, merchantId: req.user!.merchantId },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { payments, orders });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch customer ledger');
  }
}
