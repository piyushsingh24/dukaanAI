import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  merchantId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  params: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
