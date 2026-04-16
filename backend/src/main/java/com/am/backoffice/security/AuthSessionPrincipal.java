package com.am.backoffice.security;

/** 세션 저장용 인증 사용자 정보 (비밀번호 미포함). */
public record AuthSessionPrincipal(String userId, String displayName, String gradeCd, String userStatus) {}
