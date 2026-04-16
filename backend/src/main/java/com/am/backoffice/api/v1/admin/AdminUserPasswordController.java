package com.am.backoffice.api.v1.admin;

import com.am.backoffice.api.v1.admin.dto.AdminPasswordResetData;
import com.am.backoffice.common.dto.ApiResponse;
import com.am.backoffice.mapper.OmUserAuthMapper;
import com.am.backoffice.security.AuthSessionPrincipal;
import com.am.backoffice.security.OmUserAuthRow;
import java.security.SecureRandom;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 등급 ADMIN 만: 다른 사용자 비밀번호 초기화(임시 비밀번호 발급). */
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserPasswordController {

  private static final String TEMP_PASSWORD_ALPHABET =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  private final OmUserAuthMapper omUserAuthMapper;
  private final PasswordEncoder passwordEncoder;
  private final MessageSource messageSource;
  private final SecureRandom random = new SecureRandom();

  public AdminUserPasswordController(
      OmUserAuthMapper omUserAuthMapper,
      PasswordEncoder passwordEncoder,
      MessageSource messageSource) {
    this.omUserAuthMapper = omUserAuthMapper;
    this.passwordEncoder = passwordEncoder;
    this.messageSource = messageSource;
  }

  @PostMapping("/{userId}/password-reset")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<AdminPasswordResetData>> resetPassword(
      @PathVariable("userId") String userId, Authentication authentication) {
    OmUserAuthRow row = omUserAuthMapper.findByUserId(userId);
    if (row == null) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(
              new ApiResponse<>(
                  false,
                  null,
                  message("admin.error.user_not_found", "해당 사용자를 찾을 수 없습니다."),
                  "ERR_USER_NOT_FOUND"));
    }

    String actorUserId = resolveActorUserId(authentication);
    String plain = randomTempPassword(14);
    String hash = passwordEncoder.encode(plain);
    int updated = omUserAuthMapper.adminResetPassword(userId, hash, actorUserId);
    if (updated == 0) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(
              new ApiResponse<>(
                  false,
                  null,
                  message("admin.error.user_not_found", "해당 사용자를 찾을 수 없습니다."),
                  "ERR_USER_NOT_FOUND"));
    }

    AdminPasswordResetData data = new AdminPasswordResetData(userId, plain);
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            data,
            message("admin.password_reset.success", "임시 비밀번호가 발급되었습니다. 사용자에게 안전한 경로로 전달하세요."),
            "SUCCESS"));
  }

  private String resolveActorUserId(Authentication authentication) {
    if (authentication != null && authentication.getPrincipal() instanceof AuthSessionPrincipal p) {
      return p.userId();
    }
    return "SYSTEM";
  }

  private String randomTempPassword(int length) {
    StringBuilder sb = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      sb.append(TEMP_PASSWORD_ALPHABET.charAt(random.nextInt(TEMP_PASSWORD_ALPHABET.length())));
    }
    return sb.toString();
  }

  private String message(String key, String defaultMessage) {
    String def = defaultMessage == null ? "" : defaultMessage;
    return messageSource.getMessage(key, null, def, LocaleContextHolder.getLocale());
  }
}
