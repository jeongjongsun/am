import type { ApiResponse } from '@/types/api';
import type { AdminPasswordResetData } from '@/types/auth';
import { axiosInstance } from './axios';

/** POST /api/v1/admin/users/{userId}/password-reset (등급 ADMIN 세션만). */
export async function adminResetUserPassword(
  userId: string,
): Promise<ApiResponse<AdminPasswordResetData | null>> {
  const encoded = encodeURIComponent(userId);
  const { data } = await axiosInstance.post<ApiResponse<AdminPasswordResetData | null>>(
    `/api/v1/admin/users/${encoded}/password-reset`,
    {},
    { validateStatus: (status) => status === 200 || status === 403 || status === 404 },
  );
  return data;
}
