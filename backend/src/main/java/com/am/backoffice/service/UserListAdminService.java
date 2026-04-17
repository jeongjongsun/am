package com.am.backoffice.service;

import com.am.backoffice.api.v1.admin.dto.user.AdminUserListItemResponse;
import com.am.backoffice.common.dto.PagedData;
import com.am.backoffice.mapper.OmUserListMapper;
import com.am.backoffice.user.OmUserListRow;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserListAdminService {

  private static final List<String> SORT_COLUMNS = List.of("user_id", "user_nm", "created_at");

  private final OmUserListMapper omUserListMapper;

  public UserListAdminService(OmUserListMapper omUserListMapper) {
    this.omUserListMapper = omUserListMapper;
  }

  @Transactional(readOnly = true)
  public PagedData<AdminUserListItemResponse> listPaged(int page, int size, String sort) {
    int safeSize = Math.min(Math.max(size, 1), 5000);
    int safePage = Math.max(page, 0);
    String[] parts = sort == null ? new String[0] : sort.split(",");
    String prop =
        parts.length > 0 && parts[0] != null && !parts[0].isBlank()
            ? parts[0].trim().toLowerCase(Locale.ROOT)
            : "userid";
    String dir =
        parts.length > 1 && "DESC".equalsIgnoreCase(parts[1].trim()) ? "DESC" : "ASC";

    String sortColumn =
        switch (prop) {
          case "userid", "user_id" -> "user_id";
          case "usernm", "user_nm" -> "user_nm";
          case "createdat", "created_at" -> "created_at";
          default -> "user_id";
        };
    if (!SORT_COLUMNS.contains(sortColumn)) {
      sortColumn = "user_id";
    }

    long total = omUserListMapper.countNotDeleted();
    int offset = safePage * safeSize;
    List<OmUserListRow> rows =
        omUserListMapper.selectPage(offset, safeSize, sortColumn, dir);
    List<AdminUserListItemResponse> items = rows.stream().map(this::toResponse).toList();
    return PagedData.of(items, safePage, safeSize, total);
  }

  private AdminUserListItemResponse toResponse(OmUserListRow r) {
    return new AdminUserListItemResponse(
        r.getUserId(),
        r.getUserNm(),
        emptyToNull(r.getGradeCd()),
        emptyToNull(r.getUserStatus()),
        emptyToNull(r.getCorporationCd()),
        emptyToNull(r.getEmailId()),
        emptyToNull(r.getMobileNo()),
        emptyToNull(r.getLastLoginDtm()),
        emptyToNull(r.getAuthGroup()),
        emptyToNull(r.getSecondAuthYn()),
        r.getCreatedAt(),
        r.getUpdatedAt());
  }

  private static String emptyToNull(String s) {
    if (s == null || s.isBlank()) {
      return null;
    }
    return s;
  }
}
