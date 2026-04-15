import type { ApiResponse } from '@/types/api';
import { axiosInstance } from './axios';

/** GET /api/v1/auth/me (docs/guide/02-개발-표준.md) */
export async function fetchAuthMe(): Promise<ApiResponse<unknown>> {
  const { data } = await axiosInstance.get<ApiResponse<unknown>>('/api/v1/auth/me');
  return data;
}
