package com.am.backoffice.api;

import com.am.backoffice.common.dto.ApiResponse;
import com.am.backoffice.service.ErrorLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Locale;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * API 공통 예외 응답 및 {@code om_error_log_m} 기록(5xx 등). docs/guide/02-개발-표준.md ERR_*.
 *
 * <p>검증·요청 형식 오류(4xx)는 DB에 남기지 않고, 처리되지 않은 예외는 기록한다.
 */
@RestControllerAdvice(basePackages = "com.am.backoffice.api")
public class GlobalApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalApiExceptionHandler.class);

  private final ErrorLogService errorLogService;
  private final MessageSource messageSource;

  public GlobalApiExceptionHandler(ErrorLogService errorLogService, MessageSource messageSource) {
    this.errorLogService = errorLogService;
    this.messageSource = messageSource;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
    String msg =
        ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : fe.getField())
            .orElseGet(() -> message("common.error.validation", "입력값을 확인해 주세요."));
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(new ApiResponse<>(false, null, msg, "ERR_VALIDATION"));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
    return ResponseEntity.badRequest()
        .body(
            new ApiResponse<>(
                false,
                null,
                message("common.error.bad_request", "요청 형식이 올바르지 않습니다."),
                "ERR_BAD_REQUEST"));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleUnhandled(
      Exception ex, HttpServletRequest request) {
    log.error("Unhandled exception path={} {}", request.getRequestURI(), ex.toString(), ex);
    errorLogService.recordServerError(ex, request, "ERR_INTERNAL");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            new ApiResponse<>(
                false,
                null,
                message("common.error.internal", "일시적인 오류가 발생했습니다. 관리자에게 문의하세요."),
                "ERR_INTERNAL"));
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
