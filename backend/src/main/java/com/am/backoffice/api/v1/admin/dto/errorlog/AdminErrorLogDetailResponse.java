package com.am.backoffice.api.v1.admin.dto.errorlog;

import com.am.backoffice.error.OmErrorLogEntity;
import java.time.OffsetDateTime;

/** 에러 이력 상세 (스택·detail 포함). */
public record AdminErrorLogDetailResponse(
    long id,
    OffsetDateTime createdAt,
    String exceptionClass,
    String exceptionMessage,
    String stackTrace,
    String rootCauseClass,
    String errCode,
    Integer httpStatus,
    String httpMethod,
    String apiPath,
    String requestId,
    String actorUserId,
    String clientPath,
    String ipAddr,
    String userAgent,
    String appProfile,
    String errorFingerprint,
    String detail) {

  public static AdminErrorLogDetailResponse from(OmErrorLogEntity e) {
    return new AdminErrorLogDetailResponse(
        e.getId(),
        e.getCreatedAt(),
        e.getExceptionClass(),
        e.getExceptionMessage(),
        e.getStackTrace(),
        e.getRootCauseClass(),
        e.getErrCode(),
        e.getHttpStatus(),
        e.getHttpMethod(),
        e.getApiPath(),
        e.getRequestId(),
        e.getActorUserId(),
        e.getClientPath(),
        e.getIpAddr(),
        e.getUserAgent(),
        e.getAppProfile(),
        e.getErrorFingerprint(),
        e.getDetailJson());
  }
}
