import type { ApiResponse } from '@/types/api';
import { axiosInstance } from './axios';

const BASE = '/api/v1/admin/common-codes';

export type CommonCodeGroupDto = {
  groupId: string;
  codeNm: Record<string, string>;
  useYn: string;
  dispSeq: number;
};

export type CommonCodeItemDto = {
  subCd: string;
  codeNm: Record<string, string>;
  useYn: string;
  dispSeq: number;
  updatedAt: string | null;
};

export type CommonCodeGroupCreateBody = {
  groupId: string;
  codeNm: Record<string, string>;
  useYn: string;
  dispSeq?: number | null;
};

export type CommonCodeItemCreateBody = {
  subCd: string;
  codeNm: Record<string, string>;
  useYn: string;
  dispSeq?: number | null;
};

export type CommonCodeUpdateBody = {
  codeNm: Record<string, string>;
  useYn: string;
  dispSeq: number;
};

export async function fetchCommonCodeGroups(): Promise<ApiResponse<CommonCodeGroupDto[] | null>> {
  const { data } = await axiosInstance.get<ApiResponse<CommonCodeGroupDto[] | null>>(`${BASE}/groups`, {
    validateStatus: (s) => s === 200 || s === 403,
  });
  return data;
}

export async function fetchCommonCodeItems(
  mainCd: string,
): Promise<ApiResponse<CommonCodeItemDto[] | null>> {
  const enc = encodeURIComponent(mainCd);
  const { data } = await axiosInstance.get<ApiResponse<CommonCodeItemDto[] | null>>(
    `${BASE}/${enc}/items`,
    { validateStatus: (s) => s === 200 || s === 403 },
  );
  return data;
}

export async function createCommonCodeGroup(
  body: CommonCodeGroupCreateBody,
): Promise<ApiResponse<null>> {
  const { data } = await axiosInstance.post<ApiResponse<null>>(`${BASE}/groups`, body, {
    validateStatus: (s) => s === 200 || s === 403,
  });
  return data;
}

export async function createCommonCodeItem(
  mainCd: string,
  body: CommonCodeItemCreateBody,
): Promise<ApiResponse<null>> {
  const enc = encodeURIComponent(mainCd);
  const { data } = await axiosInstance.post<ApiResponse<null>>(`${BASE}/${enc}/items`, body, {
    validateStatus: (s) => s === 200 || s === 403,
  });
  return data;
}

export async function updateCommonCodeRow(
  mainCd: string,
  subCd: string,
  body: CommonCodeUpdateBody,
): Promise<ApiResponse<null>> {
  const m = encodeURIComponent(mainCd);
  const s = encodeURIComponent(subCd);
  const { data } = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${m}/${s}`, body, {
    validateStatus: (s) => s === 200 || s === 403,
  });
  return data;
}

export async function saveCommonCodeDisplayOrder(
  mainCd: string,
  orderedSubCds: string[],
): Promise<ApiResponse<null>> {
  const enc = encodeURIComponent(mainCd);
  const { data } = await axiosInstance.put<ApiResponse<null>>(
    `${BASE}/${enc}/display-order`,
    { orderedSubCds },
    { validateStatus: (s) => s === 200 || s === 403 },
  );
  return data;
}
