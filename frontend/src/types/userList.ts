/** GET /api/v1/admin/users 목록 원소 */
export type AdminUserListItem = {
  userId: string;
  userNm: string;
  gradeCd: string | null;
  userStatus: string | null;
  corporationCd: string | null;
  emailId: string | null;
  mobileNo: string | null;
  lastLoginDtm: string | null;
  authGroup: string | null;
  secondAuthYn: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
