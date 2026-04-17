package com.am.backoffice.audit;

/** {@code om_log_m} 기록 시 HTTP 메타(필터·컨트롤러에서 수집). */
public record BusinessAuditParams(
    String requestId,
    String clientPath,
    String httpMethod,
    String apiPath,
    String ipAddr,
    String userAgent) {}
