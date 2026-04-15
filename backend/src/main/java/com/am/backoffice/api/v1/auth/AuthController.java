package com.am.backoffice.api.v1.auth;

import com.am.backoffice.api.v1.auth.dto.AuthMeData;
import com.am.backoffice.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증·세션 연동 후 확장 (docs/guide/02-개발-표준.md — GET /api/v1/auth/me).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  @GetMapping("/me")
  public ResponseEntity<ApiResponse<AuthMeData>> me(Authentication authentication) {
    if (authentication == null
        || !authentication.isAuthenticated()
        || authentication instanceof AnonymousAuthenticationToken) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(
              new ApiResponse<>(
                  false, null, "인증이 필요합니다.", "ERR_UNAUTHORIZED"));
    }

    String name = authentication.getName();
    AuthMeData data = new AuthMeData(name, name);

    return ResponseEntity.ok(new ApiResponse<>(true, data, null, "SUCCESS"));
  }
}
