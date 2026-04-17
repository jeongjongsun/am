package com.am.backoffice.api.v1.admin;

import com.am.backoffice.api.v1.admin.dto.corporation.AdminCorporationListItemResponse;
import com.am.backoffice.api.v1.admin.dto.corporation.AdminCorporationUpdateRequest;
import com.am.backoffice.audit.BusinessAuditParams;
import com.am.backoffice.common.dto.ApiResponse;
import com.am.backoffice.common.dto.PagedData;
import com.am.backoffice.config.RequestIdFilter;
import com.am.backoffice.security.AuthSessionPrincipal;
import com.am.backoffice.service.CorporationListAdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 등급 ADMIN: 화주(법인) 목록 조회. */
@RestController
@RequestMapping("/api/v1/admin/corporations")
@Validated
public class AdminCorporationController {

  private final CorporationListAdminService corporationListAdminService;
  private final MessageSource messageSource;

  public AdminCorporationController(
      CorporationListAdminService corporationListAdminService, MessageSource messageSource) {
    this.corporationListAdminService = corporationListAdminService;
    this.messageSource = messageSource;
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<PagedData<AdminCorporationListItemResponse>>> list(
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "100") @Min(1) @Max(5000) int size,
      @RequestParam(defaultValue = "corporationCd,ASC") String sort) {
    PagedData<AdminCorporationListItemResponse> data =
        corporationListAdminService.listPaged(page, size, sort);
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            data,
            message("admin.corporations.success.list_loaded", "법인 목록을 조회했습니다."),
            "SUCCESS"));
  }

  @PatchMapping("/{corporationCd}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<AdminCorporationListItemResponse>> patch(
      @PathVariable("corporationCd") String corporationCd,
      @Valid @RequestBody AdminCorporationUpdateRequest body,
      Authentication authentication,
      HttpServletRequest request) {
    String actorUserId = resolveActorUserId(authentication);
    Optional<AdminCorporationListItemResponse> updated =
        corporationListAdminService.updateCorporation(
            corporationCd.trim(), body, actorUserId, auditParams(request));
    if (updated.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(
              new ApiResponse<>(
                  false,
                  null,
                  message("admin.corporations.error.not_found", "해당 법인을 찾을 수 없습니다."),
                  "ERR_CORPORATION_NOT_FOUND"));
    }
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            updated.get(),
            message("admin.corporations.success.updated", "저장되었습니다."),
            "SUCCESS"));
  }

  private static BusinessAuditParams auditParams(HttpServletRequest request) {
    Object rid = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
    return new BusinessAuditParams(
        rid instanceof String s ? s : null,
        truncateHeader(request.getHeader("X-Client-Path"), 512),
        request.getMethod(),
        request.getRequestURI(),
        request.getRemoteAddr(),
        truncateHeader(request.getHeader("User-Agent"), 512));
  }

  private static String truncateHeader(String value, int max) {
    if (value == null) {
      return null;
    }
    String t = value.trim();
    return t.length() <= max ? t : t.substring(0, max);
  }

  private static String resolveActorUserId(Authentication authentication) {
    if (authentication != null && authentication.getPrincipal() instanceof AuthSessionPrincipal p) {
      return p.userId();
    }
    return "SYSTEM";
  }

  private String message(String key, String defaultMessage) {
    String def = defaultMessage == null ? "" : defaultMessage;
    Locale locale =
        LocaleContextHolder.getLocale() != null
            ? LocaleContextHolder.getLocale()
            : Locale.getDefault();
    return messageSource.getMessage(Objects.requireNonNull(key), null, def, locale);
  }
}
