package com.am.backoffice.api.v1.admin.dto.corporation;

import java.time.OffsetDateTime;

/** 화주(법인) 목록 그리드 한 행. */
public record AdminCorporationListItemResponse(
    String corporationCd,
    String corporationNm,
    String businessNo,
    String ceoNm,
    String address,
    String telNo,
    String faxNo,
    String email,
    String homepageUrl,
    String remark,
    boolean active,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String createdBy,
    String updatedBy) {}
