package com.am.backoffice.service;

import com.am.backoffice.common.dto.PagedData;
import com.am.backoffice.config.RequestIdFilter;
import com.am.backoffice.error.ErrorLogSanitizer;
import com.am.backoffice.error.OmErrorLogEntity;
import com.am.backoffice.error.OmErrorLogSummaryRow;
import com.am.backoffice.mapper.OmErrorLogMapper;
import com.am.backoffice.security.AuthSessionPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ErrorLogService {

  private static final Logger log = LoggerFactory.getLogger(ErrorLogService.class);

  private final OmErrorLogMapper omErrorLogMapper;
  private final Environment environment;
  private final ObjectMapper objectMapper;

  public ErrorLogService(
      OmErrorLogMapper omErrorLogMapper, Environment environment, ObjectMapper objectMapper) {
    this.omErrorLogMapper = omErrorLogMapper;
    this.environment = environment;
    this.objectMapper = objectMapper;
  }

  /**
   * 시스템 예외를 {@code om_error_log_m}에 남긴다. 저장 실패 시 원 요청 처리에는 영향을 주지 않는다.
   */
  public void recordServerError(Throwable ex, HttpServletRequest request, String errCode) {
    try {
      OmErrorLogEntity row = buildRow(ex, request, 500, errCode);
      omErrorLogMapper.insert(row);
    } catch (Exception e) {
      log.warn("om_error_log_m insert failed: {}", e.toString());
    }
  }

  @Transactional(readOnly = true)
  public PagedData<OmErrorLogSummaryRow> listPaged(int page, int size) {
    int safeSize = Math.min(Math.max(size, 1), 100);
    int safePage = Math.max(page, 0);
    long total = omErrorLogMapper.countAll();
    int offset = safePage * safeSize;
    List<OmErrorLogSummaryRow> items = omErrorLogMapper.selectPage(offset, safeSize);
    return PagedData.of(items, safePage, safeSize, total);
  }

  @Transactional(readOnly = true)
  public Optional<OmErrorLogEntity> findById(long id) {
    OmErrorLogEntity row = omErrorLogMapper.selectById(id);
    return Optional.ofNullable(row);
  }

  private OmErrorLogEntity buildRow(
      Throwable ex, HttpServletRequest request, int httpStatus, String errCode) {
    Throwable root = rootCause(ex);
    String stack = ErrorLogSanitizer.stackTraceString(ex);
    String fp = fingerprint(ex.getClass().getName(), ex.getMessage(), stack);

    OmErrorLogEntity row = new OmErrorLogEntity();
    row.setExceptionClass(ex.getClass().getName());
    row.setExceptionMessage(ErrorLogSanitizer.truncateMessage(ex.getMessage()));
    row.setStackTrace(stack);
    row.setRootCauseClass(root != ex ? root.getClass().getName() : null);
    row.setErrCode(errCode);
    row.setHttpStatus(httpStatus);
    row.setHttpMethod(request.getMethod());
    row.setApiPath(trimToNull(request.getRequestURI(), 512));
    row.setRequestId(trimToNull(requestId(request), 64));
    row.setActorUserId(resolveActorUserId());
    row.setClientPath(trimToNull(request.getHeader("X-Client-Path"), 512));
    row.setIpAddr(trimToNull(resolveClientIp(request), 45));
    row.setUserAgent(trimToNull(request.getHeader("User-Agent"), 512));
    row.setAppProfile(String.join(",", environment.getActiveProfiles()));
    row.setErrorFingerprint(fp);
    row.setDetailJson(buildDetailJson(ex));
    return row;
  }

  private String buildDetailJson(Throwable ex) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("handler", "GlobalApiExceptionHandler");
    Throwable t = ex;
    while (t != null) {
      if (t instanceof java.sql.SQLException sqlEx && sqlEx.getSQLState() != null) {
        m.put("sql_state", sqlEx.getSQLState());
        break;
      }
      t = t.getCause();
    }
    try {
      return objectMapper.writeValueAsString(m);
    } catch (JsonProcessingException e) {
      return "{}";
    }
  }

  private static Throwable rootCause(Throwable ex) {
    Throwable t = ex;
    while (t.getCause() != null && t.getCause() != t) {
      t = t.getCause();
    }
    return t;
  }

  private static String fingerprint(String exceptionClass, String message, String stack) {
    String line1 = ErrorLogSanitizer.firstStackLine(stack);
    String payload =
        exceptionClass
            + "|"
            + (message == null ? "" : message.substring(0, Math.min(200, message.length())))
            + "|"
            + line1;
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] hash = md.digest(payload.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash).substring(0, 32);
    } catch (NoSuchAlgorithmException e) {
      return null;
    }
  }

  private static String requestId(HttpServletRequest request) {
    Object v = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
    return v != null ? v.toString() : null;
  }

  private static String resolveClientIp(HttpServletRequest request) {
    String xff = request.getHeader("X-Forwarded-For");
    if (xff != null && !xff.isBlank()) {
      String first = xff.split(",")[0].trim();
      return trimToNull(first, 45);
    }
    return trimToNull(request.getRemoteAddr(), 45);
  }

  private static String resolveActorUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null
        || !auth.isAuthenticated()
        || auth instanceof AnonymousAuthenticationToken) {
      return null;
    }
    if (auth.getPrincipal() instanceof AuthSessionPrincipal p) {
      return p.userId();
    }
    return null;
  }

  private static String trimToNull(String s, int maxLen) {
    if (s == null) {
      return null;
    }
    String t = s.trim();
    if (t.isEmpty()) {
      return null;
    }
    return t.length() > maxLen ? t.substring(0, maxLen) : t;
  }
}
