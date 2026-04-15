package com.am.backoffice.api.v1.auth.dto;

/** GET /api/v1/auth/me 성공 시 data 예시 (추후 사용자·권한 모델에 맞게 확장). */
public record AuthMeData(String userId, String displayName) {}
