package com.am.backoffice.api.v1.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * GET /api/v1/auth/me 및 로그인 응답 data.
 *
 * <p>{@code secondFactorRequired} 가 true이면 이메일 인증 단계가 남은 상태이다. {@code gradeCd}는 세션
 * 확정 후에만 채워진다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthMeData(
    String userId, String displayName, Boolean secondFactorRequired, String gradeCd) {

  public static AuthMeData signedIn(String userId, String displayName, String gradeCd) {
    return new AuthMeData(userId, displayName, null, gradeCd);
  }

  public static AuthMeData secondFactorRequired(String userId, String displayName) {
    return new AuthMeData(userId, displayName, true, null);
  }
}
