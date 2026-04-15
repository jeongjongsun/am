package com.am.backoffice.common.dto;

/**
 * API 공통 응답 래퍼 (docs/guide/03-부록-타입.md).
 *
 * @param <T> data 페이로드 타입
 */
public record ApiResponse<T>(boolean success, T data, String message, String code) {}
