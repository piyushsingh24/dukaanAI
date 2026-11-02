import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { getIO } from '../socket';

export async function getProducts(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const products = await prisma.product.findMany({
      where: { merchantId },
      include: { category: true, inventory: true },
      orderBy: { productName: 'asc' },
    });
    return sendSuccess(res, products);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch products');
  }
}

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const data = { ...req.body, merchantId: req.user!.merchantId };
    const product = await prisma.product.create({ data });

    await prisma.inventory.create({
      data: { productId: product.id, currentStock: 0, minimumStock: 0, reorderLevel: 0 },
    });

    return sendSuccess(res, product, 'Product created', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create product');
  }
}

export async function updateProduct(req: AuthRequest, res: Response) {
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

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, merchantId: req.user!.merchantId },
    });
    if (!product) return sendError(res, 'Product not found', 404);

    await prisma.inventory.deleteMany({ where: { productId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Product deleted');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete product');
  }
}

export async function getInventory(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const inventory = await prisma.inventory.findMany({
      where: { product: { merchantId } },
      include: { product: true },
      orderBy: { product: { productName: 'asc' } },
    });
    return sendSuccess(res, inventory);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch inventory');
  }
}

export async function updateStock(req: AuthRequest, res: Response) {
  try {
    const { currentStock, minimumStock, reorderLevel } = req.body;
    const inventory = await prisma.inventory.findFirst({
      where: { id: req.params.id, product: { merchantId: req.user!.merchantId } },
    });
    if (!inventory) return sendError(res, 'Inventory not found', 404);

    const updated = await prisma.inventory.update({
      where: { id: req.params.id },
      data: { currentStock, minimumStock, reorderLevel },
    });
    try {
      getIO().to(`merchant:${req.user!.merchantId}`).emit('inventory:changed', { inventoryId: inventory.id, productId: inventory.productId, currentStock });
    } catch {}
    return sendSuccess(res, updated, 'Stock updated');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update stock');
  }
}

export async function getLowStock(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const items = await prisma.inventory.findMany({
      where: {
        product: { merchantId },
        currentStock: { lte: prisma.inventory.fields.minimumStock },
      },
      include: { product: true },
    });
    return sendSuccess(res, items);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch low stock items');
  }
}

export async function getRestockRecommendations(req: AuthRequest, res: Response) {
  try {
    const merchantId = req.user!.merchantId;
    const items = await prisma.inventory.findMany({
      where: { product: { merchantId }, currentStock: { lte: prisma.inventory.fields.reorderLevel } },
      include: { product: true },
    });

    const recommendations = items.map((item) => ({
      productId: item.productId,
      productName: item.product.productName,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      recommendedQuantity: Math.max(item.reorderLevel * 2 - item.currentStock, 0),
    }));

    return sendSuccess(res, recommendations);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch recommendations');
  }
}
