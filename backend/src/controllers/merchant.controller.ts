import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export async function getMerchant(req: AuthRequest, res: Response) {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user!.merchantId },
    });
    if (!merchant) return sendError(res, 'Merchant not found', 404);
    return sendSuccess(res, merchant);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch merchant');
  }
}

export async function updateMerchant(req: AuthRequest, res: Response) {
  try {
    const merchant = await prisma.merchant.update({
      where: { id: req.user!.merchantId },
      data: req.body,
    });
    return sendSuccess(res, merchant, 'Merchant updated');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update merchant');
  }
}

export async function uploadLogo(req: AuthRequest, res: Response) {
  try {
    const { logo } = req.body;
    if (!logo) return sendError(res, 'Logo data is required', 422);

    const merchant = await prisma.merchant.update({
      where: { id: req.user!.merchantId },
      data: { logo },
    });
    return sendSuccess(res, { logo: merchant.logo }, 'Logo uploaded');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to upload logo');
  }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const merchant = await prisma.merchant.update({
      where: { id: req.user!.merchantId },
      data: req.body,
    });
    return sendSuccess(res, merchant, 'Settings updated');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update settings');
  }
}

export async function getAutoReply(req: AuthRequest, res: Response) {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user!.merchantId },
      select: { autoReply: true },
    });
    const defaultConfig = {
      enabled: false,
      confidenceThreshold: 0.85,
      welcomeMessage: 'Namaste! 🏪 Welcome to {businessName}\n\n{productCatalog}\n\nReply with product name and quantity to place an order!',
      autoReplyIntents: ['GREETING', 'DELIVERY_STATUS', 'PAYMENT_INQUIRY', 'PRODUCT_INQUIRY'],
      includeCatalogInWelcome: true,
    };
    return sendSuccess(res, { ...defaultConfig, ...(merchant?.autoReply as object || {}) });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch auto-reply settings');
  }
}

export async function updateAutoReply(req: AuthRequest, res: Response) {
  try {
    const merchant = await prisma.merchant.update({
      where: { id: req.user!.merchantId },
      data: { autoReply: req.body },
    });
    return sendSuccess(res, merchant.autoReply, 'Auto-reply settings updated');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update auto-reply settings');
  }
}
