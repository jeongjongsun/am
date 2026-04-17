package com.am.backoffice.common.dto;

import java.util.List;

/**
 * 목록 API 페이징 본문 (docs/guide/02-개발-표준.md — data.items, page, size, total, totalPages,
 * first, last).
 *
 * @param <T> 목록 원소 타입
 */
public record PagedData<T>(
    List<T> items,
    int page,
    int size,
    long total,
    int totalPages,
    boolean first,
    boolean last) {

  public static <T> PagedData<T> of(List<T> items, int page, int size, long total) {
    int safeSize = size <= 0 ? 20 : size;
    int totalPages =
        total == 0 ? 0 : (int) Math.ceil((double) total / (double) safeSize);
    int safePage = Math.max(0, page);
    boolean firstPage = safePage <= 0;
    boolean lastPage = totalPages == 0 || safePage >= totalPages - 1;
    return new PagedData<>(
        items, safePage, safeSize, total, totalPages, firstPage, lastPage);
  }
}
