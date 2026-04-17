package com.am.backoffice.service;

import com.am.backoffice.api.v1.admin.dto.corporation.AdminCorporationListItemResponse;
import com.am.backoffice.api.v1.admin.dto.corporation.AdminCorporationUpdateRequest;
import com.am.backoffice.audit.BusinessAuditParams;
import com.am.backoffice.common.dto.PagedData;
import com.am.backoffice.corporation.OmCorporationExistingRow;
import com.am.backoffice.corporation.OmCorporationListRow;
import com.am.backoffice.mapper.OmCorporationListMapper;
import com.am.backoffice.mapper.OmLogMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CorporationListAdminService {

  private static final List<String> SORT_COLUMNS =
      List.of("corporation_cd", "corporation_nm", "created_at");

  private static final String MENU_CD_BASIC_SHIPPER_CORP = "BASIC_SHIPPER_CORP";
  private static final String ACTION_CORPORATION_UPDATE = "CORPORATION_UPDATE";

  private final OmCorporationListMapper omCorporationListMapper;
  private final OmLogMapper omLogMapper;
  private final ObjectMapper objectMapper;

  public CorporationListAdminService(
      OmCorporationListMapper omCorporationListMapper,
      OmLogMapper omLogMapper,
      ObjectMapper objectMapper) {
    this.omCorporationListMapper = omCorporationListMapper;
    this.omLogMapper = omLogMapper;
    this.objectMapper = objectMapper;
  }

  @Transactional(readOnly = true)
  public PagedData<AdminCorporationListItemResponse> listPaged(int page, int size, String sort) {
    int safeSize = Math.min(Math.max(size, 1), 5000);
    int safePage = Math.max(page, 0);
    String[] parts = sort == null ? new String[0] : sort.split(",");
    String prop =
        parts.length > 0 && parts[0] != null && !parts[0].isBlank()
            ? parts[0].trim().toLowerCase(Locale.ROOT)
            : "corporationcd";
    String dir =
        parts.length > 1 && "DESC".equalsIgnoreCase(parts[1].trim()) ? "DESC" : "ASC";

    String sortColumn =
        switch (prop) {
          case "corporationcd", "corporation_cd" -> "corporation_cd";
          case "corporationnm", "corporation_nm" -> "corporation_nm";
          case "createdat", "created_at" -> "created_at";
          default -> "corporation_cd";
        };
    if (!SORT_COLUMNS.contains(sortColumn)) {
      sortColumn = "corporation_cd";
    }

    long total = omCorporationListMapper.countAll();
    int offset = safePage * safeSize;
    List<OmCorporationListRow> rows =
        omCorporationListMapper.selectPage(offset, safeSize, sortColumn, dir);
    List<AdminCorporationListItemResponse> items = rows.stream().map(this::toResponse).toList();
    return PagedData.of(items, safePage, safeSize, total);
  }

  /**
   * 법인(화주) 행을 갱신한다. 성공 시 {@code om_log_m}에 감사 로그를 남긴다.
   *
   * @return 갱신 후 목록과 동일 스키마의 한 행, 없으면 empty
   */
  @Transactional
  public Optional<AdminCorporationListItemResponse> updateCorporation(
      String corporationCd,
      AdminCorporationUpdateRequest request,
      String actorUserId,
      BusinessAuditParams audit) {
    OmCorporationExistingRow existing = omCorporationListMapper.selectExistingForUpdate(corporationCd);
    if (existing == null) {
      return Optional.empty();
    }
    ObjectNode info;
    try {
      String raw = existing.getCorporationInfoRaw();
      if (raw == null || raw.isBlank()) {
        info = objectMapper.createObjectNode();
      } else {
        var node = objectMapper.readTree(raw);
        info = node instanceof ObjectNode o ? o : objectMapper.createObjectNode();
      }
    } catch (JsonProcessingException e) {
      info = objectMapper.createObjectNode();
    }

    putInfoText(info, "business_no", normBlankToEmpty(request.businessNo()));
    putInfoText(info, "ceo_nm", normBlankToEmpty(request.ceoNm()));
    putInfoText(info, "address", normBlankToEmpty(request.address()));
    putInfoText(info, "tel_no", normBlankToEmpty(request.telNo()));
    putInfoText(info, "fax_no", normBlankToEmpty(request.faxNo()));
    putInfoText(info, "email", normBlankToEmpty(request.email()));
    putInfoText(info, "homepage_url", normBlankToEmpty(request.homepageUrl()));
    putInfoText(info, "remark", normBlankToEmpty(request.remark()));

    String infoJson;
    try {
      infoJson = objectMapper.writeValueAsString(info);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("corporation_info JSON 직렬화 실패", e);
    }

    String nm = request.corporationNm().trim();
    int updated =
        omCorporationListMapper.updateCorporation(
            corporationCd, nm, infoJson, request.active(), actorUserId);
    if (updated != 1) {
      return Optional.empty();
    }

    Map<String, String> detail = new LinkedHashMap<>();
    detail.put("corporation_cd", corporationCd);
    String detailJson;
    try {
      detailJson = objectMapper.writeValueAsString(detail);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("audit detail JSON 직렬화 실패", e);
    }

    omLogMapper.insertBusinessAudit(
        actorUserId,
        MENU_CD_BASIC_SHIPPER_CORP,
        ACTION_CORPORATION_UPDATE,
        "admin.corporations.audit.updated",
        "CORPORATION",
        corporationCd,
        detailJson,
        truncate(audit.requestId(), 64),
        truncate(audit.clientPath(), 512),
        truncate(audit.httpMethod(), 16),
        truncate(audit.apiPath(), 512),
        truncate(audit.ipAddr(), 45),
        truncate(audit.userAgent(), 512));

    OmCorporationListRow row = omCorporationListMapper.selectOneByCd(corporationCd);
    if (row == null) {
      return Optional.empty();
    }
    return Optional.of(toResponse(row));
  }

  private static void putInfoText(ObjectNode root, String key, String value) {
    root.put(key, value == null ? "" : value);
  }

  private static String normBlankToEmpty(String s) {
    if (s == null) {
      return "";
    }
    return s.trim();
  }

  private static String truncate(String s, int max) {
    if (s == null) {
      return null;
    }
    return s.length() <= max ? s : s.substring(0, max);
  }

  private AdminCorporationListItemResponse toResponse(OmCorporationListRow r) {
    return new AdminCorporationListItemResponse(
        r.getCorporationCd(),
        r.getCorporationNm(),
        emptyToNull(r.getBusinessNo()),
        emptyToNull(r.getCeoNm()),
        emptyToNull(r.getAddress()),
        emptyToNull(r.getTelNo()),
        emptyToNull(r.getFaxNo()),
        emptyToNull(r.getEmail()),
        emptyToNull(r.getHomepageUrl()),
        emptyToNull(r.getRemark()),
        r.isActive(),
        r.getCreatedAt(),
        r.getUpdatedAt(),
        emptyToNull(r.getCreatedBy()),
        emptyToNull(r.getUpdatedBy()));
  }

  private static String emptyToNull(String s) {
    if (s == null || s.isBlank()) {
      return null;
    }
    return s;
  }
}
