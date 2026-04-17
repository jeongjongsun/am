package com.am.backoffice.api.v1.admin;

import com.am.backoffice.api.v1.admin.dto.errorlog.AdminErrorLogDetailResponse;
import com.am.backoffice.api.v1.admin.dto.errorlog.AdminErrorLogListItem;
import com.am.backoffice.common.dto.ApiResponse;
import com.am.backoffice.common.dto.PagedData;
import com.am.backoffice.error.OmErrorLogEntity;
import com.am.backoffice.error.OmErrorLogSummaryRow;
import com.am.backoffice.service.ErrorLogService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** {@code om_error_log_m} 조회 API. ADMIN 전용. */
@RestController
@RequestMapping("/api/v1/admin/error-logs")
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class AdminErrorLogController {

  private final ErrorLogService errorLogService;
  private final MessageSource messageSource;

  public AdminErrorLogController(ErrorLogService errorLogService, MessageSource messageSource) {
    this.errorLogService = errorLogService;
    this.messageSource = messageSource;
  }

  @GetMapping
  public ResponseEntity<ApiResponse<PagedData<AdminErrorLogListItem>>> list(
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
    PagedData<OmErrorLogSummaryRow> raw = errorLogService.listPaged(page, size);
    List<AdminErrorLogListItem> items = raw.items().stream().map(AdminErrorLogListItem::from).toList();
    PagedData<AdminErrorLogListItem> data = PagedData.of(items, raw.page(), raw.size(), raw.total());
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            data,
            message("admin.error_log.success.list_loaded", "에러 이력을 조회했습니다."),
            "SUCCESS"));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<AdminErrorLogDetailResponse>> detail(@PathVariable("id") long id) {
    Optional<OmErrorLogEntity> row = errorLogService.findById(id);
    if (row.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body(
              new ApiResponse<>(
                  false,
                  null,
                  message("admin.error_log.error.not_found", "해당 에러 이력을 찾을 수 없습니다."),
                  "ERR_NOT_FOUND"));
    }
    return ResponseEntity.ok(
        new ApiResponse<>(
            true,
            AdminErrorLogDetailResponse.from(row.get()),
            message("admin.error_log.success.detail_loaded", "에러 상세를 조회했습니다."),
            "SUCCESS"));
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
