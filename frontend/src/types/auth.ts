/** GET /api/v1/auth/me 및 로그인 응답 data (백엔드 AuthMeData 와 동일 필드명). */
export interface AuthMeData {
  userId: string;
  displayName: string;
  /** true이면 이메일 인증 단계가 남음 (세션은 아직 완전 로그인 전). */
  secondFactorRequired?: boolean;
  /** 세션 확정 후 등급 코드 (예: ADMIN). */
  gradeCd?: string | null;
}

/** 관리자 비밀번호 초기화 API 응답 data. */
export interface AdminPasswordResetData {
  userId: string;
  temporaryPassword: string;
}
