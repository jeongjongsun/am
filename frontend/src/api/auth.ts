import type { ApiResponse } from '@/types/api';
import type { AuthMeData } from '@/types/auth';
import { axiosInstance } from './axios';

export interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * GET /api/v1/auth/me (docs/guide/02-개발-표준.md).
 * 401 은 세션 없음으로 처리하며, 전역 axios 401 리다이렉트와 충돌하지 않도록 validateStatus 로 수신한다.
 */
export async function fetchAuthMe(): Promise<ApiResponse<AuthMeData | null>> {
  const { data } = await axiosInstance.get<ApiResponse<AuthMeData | null>>('/api/v1/auth/me', {
    validateStatus: (status) => status === 200 || status === 401,
  });
  return data;
}

/** POST /api/v1/auth/login */
export async function login(request: LoginRequest): Promise<ApiResponse<AuthMeData | null>> {
  const { data } = await axiosInstance.post<ApiResponse<AuthMeData | null>>('/api/v1/auth/login', request, {
    validateStatus: (status) => status === 200 || status === 401 || status === 403,
  });
  return data;
}

export interface SecondFactorVerifyRequest {
  userId: string;
  code: string;
}

/** POST /api/v1/auth/login/second-factor (이메일 인증번호 확인). */
export async function verifySecondFactor(
  request: SecondFactorVerifyRequest,
): Promise<ApiResponse<AuthMeData | null>> {
  const { data } = await axiosInstance.post<ApiResponse<AuthMeData | null>>(
    '/api/v1/auth/login/second-factor',
    request,
    { validateStatus: (status) => status === 200 || status === 401 },
  );
  return data;
}

/** POST /api/v1/auth/logout — 세션 무효화 */
export async function logout(): Promise<ApiResponse<null>> {
  const { data } = await axiosInstance.post<ApiResponse<null>>('/api/v1/auth/logout', {}, {
    validateStatus: (status) => status === 200 || status === 401,
  });
  return data;
}
