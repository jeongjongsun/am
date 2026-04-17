package com.am.backoffice.api.v1.admin.dto.user;

import java.time.OffsetDateTime;

/** 사용자 정보 그리드 한 행. */
public record AdminUserListItemResponse(
    String userId,
    String userNm,
    String gradeCd,
    String userStatus,
    String corporationCd,
    String emailId,
    String mobileNo,
    String lastLoginDtm,
    String authGroup,
    String secondAuthYn,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {}
