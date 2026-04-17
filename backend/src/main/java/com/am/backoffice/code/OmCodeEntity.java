package com.am.backoffice.code;

import java.time.OffsetDateTime;

/**
 * {@code om_code_m} 한 행을 MyBatis 조회 결과로 매핑한다.
 *
 * <p>{@code code_nm}, {@code code_info}는 JSON 문자열로 받아 서비스 계층에서 파싱한다.
 */
public record OmCodeEntity(
    String mainCd,
    String subCd,
    String codeNm,
    String codeInfo,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String createdBy,
    String updatedBy) {}
