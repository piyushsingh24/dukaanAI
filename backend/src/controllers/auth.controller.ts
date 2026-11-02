import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';
import { validate } from '../middlewares/validate';

const registerSchema = z.object({
  fullName: z.string().min(2),
  businessName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: AuthRequest, res: Response) {
  try {
    const { fullName, businessName, email, phone, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'Email already registered', 409);
    }

    const passwordHash = await hashPassword(password);

    const merchant = await prisma.merchant.create({
      data: { businessName, ownerName: fullName, phone, email },
    });

    const user = await prisma.user.create({
      data: { fullName, email, passwordHash, merchantId: merchant.id, role: 'MERCHANT' },
    });

    const token = signToken({ userId: user.id, merchantId: merchant.id, role: user.role });

    return sendSuccess(res, { token, merchant: { id: merchant.id, businessName: merchant.businessName, ownerName: merchant.ownerName, phone: merchant.phone, email: merchant.email } }, 'Registration successful', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 'Validation error', 422, err.errors.map((e: any) => e.message));
    }
    return sendError(res, err.message || 'Registration failed');
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { merchant: true },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = signToken({ userId: user.id, merchantId: user.merchantId!, role: user.role });

    return sendSuccess(res, {
      token,
      merchant: {
        id: user.merchant!.id,
        businessName: user.merchant!.businessName,
        ownerName: user.merchant!.ownerName,
        phone: user.merchant!.phone,
        email: user.merchant!.email,
        address: user.merchant!.address,
        city: user.merchant!.city,
        logo: user.merchant!.logo,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 'Validation error', 422, err.errors.map((e: any) => e.message));
    }
    return sendError(res, err.message || 'Login failed');
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user!.merchantId },
    });

    if (!merchant) {
      return sendError(res, 'Merchant not found', 404);
    }

    return sendSuccess(res, merchant);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch profile');
  }
}

export async function logout(_req: AuthRequest, res: Response) {
  return sendSuccess(res, null, 'Logged out successfully');
}

export async function refreshToken(req: AuthRequest, res: Response) {
  try {
    const newToken = signToken({
      userId: req.user!.userId,
      merchantId: req.user!.merchantId,
      role: req.user!.role,
    });
    return sendSuccess(res, { token: newToken });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to refresh token');
  }
}
