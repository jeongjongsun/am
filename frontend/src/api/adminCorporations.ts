import type { ApiResponse, PagedResponse } from '@/types/api';
import type { AdminCorporationListItem, AdminCorporationUpdateRequest } from '@/types/corporationList';
import { axiosInstance } from './axios';

/** GET /api/v1/admin/corporations (등급 ADMIN 세션만, 서버 페이징). */
export async function fetchAdminCorporationList(params: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<PagedResponse<AdminCorporationListItem>> {
  const { data } = await axiosInstance.get<PagedResponse<AdminCorporationListItem>>(
    '/api/v1/admin/corporations',
    { params },
  );
  return data;
}

/** PATCH /api/v1/admin/corporations/{corporationCd} (등급 ADMIN 세션만). */
export async function patchAdminCorporation(
  corporationCd: string,
  body: AdminCorporationUpdateRequest,
): Promise<ApiResponse<AdminCorporationListItem>> {
  const encoded = encodeURIComponent(corporationCd);
  const { data } = await axiosInstance.patch<ApiResponse<AdminCorporationListItem>>(
    `/api/v1/admin/corporations/${encoded}`,
    body,
  );
  return data;
}
