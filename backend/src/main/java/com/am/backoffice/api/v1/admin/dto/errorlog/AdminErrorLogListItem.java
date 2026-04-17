package com.am.backoffice.api.v1.admin.dto.errorlog;

import com.am.backoffice.error.OmErrorLogSummaryRow;
import java.time.OffsetDateTime;

/** 에러 이력 목록 한 행 (API 응답용). */
public record AdminErrorLogListItem(
    long id,
    OffsetDateTime createdAt,
    String exceptionClass,
    String exceptionMessage,
    String errCode,
    Integer httpStatus,
    String requestId,
    String actorUserId,
    String apiPath) {

  public static AdminErrorLogListItem from(OmErrorLogSummaryRow r) {
    return new AdminErrorLogListItem(
        r.getId(),
        r.getCreatedAt(),
        r.getExceptionClass(),
        r.getExceptionMessage(),
        r.getErrCode(),
        r.getHttpStatus(),
        r.getRequestId(),
        r.getActorUserId(),
        r.getApiPath());
  }
}
