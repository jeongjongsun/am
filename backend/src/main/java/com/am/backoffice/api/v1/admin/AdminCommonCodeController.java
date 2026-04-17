package com.am.backoffice.api.v1.admin;

import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeGroupCreateRequest;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeGroupResponse;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeItemCreateRequest;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeItemResponse;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeOrderRequest;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeUpdateRequest;
import com.am.backoffice.common.dto.ApiResponse;
import com.am.backoffice.security.AuthSessionPrincipal;
import com.am.backoffice.service.CommonCodeAdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 공통코드({@code om_code_m}) 관리 API. 등급 {@code ADMIN} 세션만 허용한다.
 *
 * <p>물리 삭제는 제공하지 않으며, 비활성은 {@code use_yn = N}으로 처리한다.
 */
@RestController
@RequestMapping("/api/v1/admin/common-codes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommonCodeController {

  private final CommonCodeAdminService commonCodeAdminService;
  private final MessageSource messageSource;

  public AdminCommonCodeController(
      CommonCodeAdminService commonCodeAdminService, MessageSource messageSource) {
    this.commonCodeAdminService = commonCodeAdminService;
    this.messageSource = messageSource;
  }

  @GetMapping("/groups")
  public ResponseEntity<ApiResponse<List<CommonCodeGroupResponse>>> listGroups() {
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            commonCodeAdminService.listGroups(),
            message("admin.common_code.success.groups_loaded", "조회되었습니다."),
            "SUCCESS"));
  }

  @GetMapping("/{mainCd}/items")
  public ResponseEntity<ApiResponse<List<CommonCodeItemResponse>>> listItems(
      @PathVariable("mainCd") String mainCd) {
    if (mainCd == null || "CODE".equalsIgnoreCase(mainCd.trim())) {
      return ResponseEntity.ok(
          new ApiResponse<>(
              false,
              null,
              message("admin.common_code.error.invalid_main_cd", "잘못된 코드 그룹입니다."),
              "ERR_COMMON_CODE_INVALID_MAIN_CD"));
    }
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            commonCodeAdminService.listItems(mainCd),
            message("admin.common_code.success.items_loaded", "조회되었습니다."),
            "SUCCESS"));
  }

  @PostMapping("/groups")
  public ResponseEntity<ApiResponse<Void>> createGroup(
      @Valid @RequestBody CommonCodeGroupCreateRequest request, Authentication authentication) {
    String err = commonCodeAdminService.createGroup(request, resolveActorUserId(authentication));
    if (err != null) {
      return ResponseEntity.ok(
          new ApiResponse<>(false, null, messageForError(err), err));
    }
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            null,
            message("admin.common_code.success.group_created", "그룹이 등록되었습니다."),
            "SUCCESS"));
  }

  @PostMapping("/{mainCd}/items")
  public ResponseEntity<ApiResponse<Void>> createItem(
      @PathVariable("mainCd") String mainCd,
      @Valid @RequestBody CommonCodeItemCreateRequest request,
      Authentication authentication) {
    String err = commonCodeAdminService.createItem(mainCd, request, resolveActorUserId(authentication));
    if (err != null) {
      return ResponseEntity.ok(new ApiResponse<>(false, null, messageForError(err), err));
    }
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            null,
            message("admin.common_code.success.item_created", "코드가 등록되었습니다."),
            "SUCCESS"));
  }

  /**
   * 표시 순서 저장은 {@code /{mainCd}/{subCd}} 갱신과 경로가 겹치지 않도록 {@code .../items/order} 로 둔다.
   */
  @PutMapping("/{mainCd}/items/order")
  public ResponseEntity<ApiResponse<Void>> reorder(
      @PathVariable("mainCd") String mainCd,
      @Valid @RequestBody CommonCodeOrderRequest request,
      Authentication authentication) {
    String err = commonCodeAdminService.reorder(mainCd, request, resolveActorUserId(authentication));
    if (err != null) {
      return ResponseEntity.ok(new ApiResponse<>(false, null, messageForError(err), err));
    }
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            null,
            message("admin.common_code.success.order_saved", "표시 순서가 저장되었습니다."),
            "SUCCESS"));
  }

  @PutMapping("/{mainCd}/{subCd}")
  public ResponseEntity<ApiResponse<Void>> update(
      @PathVariable("mainCd") String mainCd,
      @PathVariable("subCd") String subCd,
      @Valid @RequestBody CommonCodeUpdateRequest request,
      Authentication authentication) {
    String err =
        commonCodeAdminService.updateRow(mainCd, subCd, request, resolveActorUserId(authentication));
    if (err != null) {
      return ResponseEntity.ok(new ApiResponse<>(false, null, messageForError(err), err));
    }
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            null,
            message("admin.common_code.success.updated", "저장되었습니다."),
            "SUCCESS"));
  }

  private String messageForError(String errCode) {
    String key =
        switch (errCode) {
          case "ERR_COMMON_CODE_DUPLICATE" -> "admin.common_code.error.duplicate";
          case "ERR_COMMON_CODE_INVALID_ID" -> "admin.common_code.error.invalid_id";
          case "ERR_COMMON_CODE_RESERVED_ID" -> "admin.common_code.error.reserved_id";
          case "ERR_COMMON_CODE_INVALID_MAIN_CD" -> "admin.common_code.error.invalid_main_cd";
          case "ERR_COMMON_CODE_GROUP_UNKNOWN" -> "admin.common_code.error.group_unknown";
          case "ERR_COMMON_CODE_NOT_FOUND" -> "admin.common_code.error.not_found";
          case "ERR_COMMON_CODE_ORDER_MISMATCH" -> "admin.common_code.error.order_mismatch";
          default -> "admin.common_code.error.generic";
        };
    return message(key, "요청을 처리할 수 없습니다.");
  }

  private String resolveActorUserId(Authentication authentication) {
    if (authentication != null && authentication.getPrincipal() instanceof AuthSessionPrincipal p) {
      return p.userId();
    }
    return "SYSTEM";
  }

  private String message(String key, String defaultMessage) {
    String def = defaultMessage == null ? "" : defaultMessage;
    return messageSource.getMessage(key, null, def, LocaleContextHolder.getLocale());
  }
}
