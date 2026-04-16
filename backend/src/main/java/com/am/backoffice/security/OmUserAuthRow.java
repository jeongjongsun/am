package com.am.backoffice.security;

/** om_user_m 로그인 검증용 조회 결과. */
public record OmUserAuthRow(
    String userId,
    String userNm,
    String passwordHash,
    String gradeCd,
    String userStatus,
    int passwordFailCnt,
    String accessIpLimit,
    String accessIpJson,
    String secondAuthYn,
    String emailId) {}
