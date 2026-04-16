import type { ApiResponse } from '@/types/api';
import type { AuthMeData } from '@/types/auth';
import { axiosInstance } from './axios';

export interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * GET /api/v1/auth/me (docs/guide/02-개발-표준.md).
 * 미인증 시에도 HTTP 200 + success=false 로 응답해 브라우저 콘솔 401 노이즈를 피한다.
 */
export async function fetchAuthMe(): Promise<ApiResponse<AuthMeData | null>> {
  const { data } = await axiosInstance.get<ApiResponse<AuthMeData | null>>('/api/v1/auth/me');
  return data;
}

/** POST /api/v1/auth/login (실패 시에도 HTTP 200 + success=false·code 로 구분). */
export async function login(request: LoginRequest): Promise<ApiResponse<AuthMeData | null>> {
  const { data } = await axiosInstance.post<ApiResponse<AuthMeData | null>>(
    '/api/v1/auth/login',
    request,
  );
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
