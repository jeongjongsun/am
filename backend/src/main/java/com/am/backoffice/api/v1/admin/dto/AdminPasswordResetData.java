package com.am.backoffice.api.v1.admin.dto;

/** 관리자가 사용자 비밀번호를 초기화한 뒤, 1회만 전달하는 임시 비밀번호. */
public record AdminPasswordResetData(String userId, String temporaryPassword) {}
