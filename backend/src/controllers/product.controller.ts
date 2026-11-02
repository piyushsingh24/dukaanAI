import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getProductById(req: AuthRequest, res: Response) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
      include: { category: true, inventory: true },
    });
    if (!product) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, product);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch product');
  }
}

export async function updateProductFull(req: AuthRequest, res: Response) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!product) return sendError(res, 'Product not found', 404);

    const updated = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    return sendSuccess(res, updated, 'Product updated');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update product');
  }
}
