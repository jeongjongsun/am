/** PATCH /api/v1/admin/corporations/{corporationCd} 본문. */
export interface AdminCorporationUpdateRequest {
  corporationNm: string;
  businessNo: string | null;
  ceoNm: string | null;
  address: string | null;
  telNo: string | null;
  faxNo: string | null;
  email: string | null;
  homepageUrl: string | null;
  remark: string | null;
  active: boolean;
}

/** GET /api/v1/admin/corporations 한 행 (om_corporation_m + corporation_info). */
export interface AdminCorporationListItem {
  corporationCd: string;
  corporationNm: string;
  businessNo: string | null;
  ceoNm: string | null;
  address: string | null;
  telNo: string | null;
  faxNo: string | null;
  email: string | null;
  homepageUrl: string | null;
  remark: string | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}
