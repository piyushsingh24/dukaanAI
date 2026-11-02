import api from './api';
import { ApiResponse, Merchant } from '@/types';

export async function login(email: string, password: string) {
  const { data } = await api.post<ApiResponse<{ token: string; merchant: Merchant }>>('/auth/login', { email, password });
  return data.data!;
}

export async function register(merchantData: Partial<Merchant> & { email: string; password: string; fullName: string }) {
  const { data } = await api.post<ApiResponse<{ token: string; merchant: Merchant }>>('/auth/register', merchantData);
  return data.data!;
}

export async function getProfile() {
  const { data } = await api.get<ApiResponse<Merchant>>('/auth/profile');
  return data.data!;
}
