import type { ApiResponse, PagedResponse } from '@/types/api';
import type { AdminPasswordResetData } from '@/types/auth';
import type { AdminUserListItem } from '@/types/userList';
import { axiosInstance } from './axios';

/** GET /api/v1/admin/users (등급 ADMIN 세션만, 서버 페이징). */
export async function fetchAdminUserList(params: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PagedResponse<AdminUserListItem>> {
  const { data } = await axiosInstance.get<PagedResponse<AdminUserListItem>>('/api/v1/admin/users', {
    params,
  });
  return data;
}

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
