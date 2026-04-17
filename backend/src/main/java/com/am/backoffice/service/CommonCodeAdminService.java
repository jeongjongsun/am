package com.am.backoffice.service;

import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeGroupCreateRequest;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeGroupResponse;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeItemCreateRequest;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeItemResponse;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeOrderRequest;
import com.am.backoffice.api.v1.admin.dto.commoncode.CommonCodeUpdateRequest;
import com.am.backoffice.code.OmCodeEntity;
import com.am.backoffice.mapper.OmCodeMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공통코드({@code om_code_m}) 관리. 물리 삭제는 제공하지 않으며 {@code use_yn}으로 비활성화한다.
 */
@Service
public class CommonCodeAdminService {

  private static final String MAIN_CODE_GROUPS = "CODE";
  private static final Pattern CODE_ID = Pattern.compile("^[A-Z0-9_]{1,50}$");

  private final OmCodeMapper omCodeMapper;
  private final ObjectMapper objectMapper;

  public CommonCodeAdminService(OmCodeMapper omCodeMapper, ObjectMapper objectMapper) {
    this.omCodeMapper = omCodeMapper;
    this.objectMapper = objectMapper;
  }

  @Transactional(readOnly = true)
  public List<CommonCodeGroupResponse> listGroups() {
    List<CommonCodeGroupResponse> out = new ArrayList<>();
    for (OmCodeEntity row : omCodeMapper.selectCodeGroups()) {
      out.add(
          new CommonCodeGroupResponse(
              row.subCd(),
              readCodeNm(row.codeNm()),
              readUseYn(row.codeInfo()),
              readDispSeq(row.codeInfo())));
    }
    return out;
  }

  @Transactional(readOnly = true)
  public List<CommonCodeItemResponse> listItems(String mainCd) {
    String normalized = normalizeMainCd(mainCd);
    if (MAIN_CODE_GROUPS.equals(normalized)) {
      return List.of();
    }
    List<CommonCodeItemResponse> out = new ArrayList<>();
    for (OmCodeEntity row : omCodeMapper.selectItemsByMainCd(normalized)) {
      out.add(
          new CommonCodeItemResponse(
              row.subCd(),
              readCodeNm(row.codeNm()),
              readUseYn(row.codeInfo()),
              readDispSeq(row.codeInfo()),
              row.updatedAt()));
    }
    return out;
  }

  /**
   * 그룹 정의({@code CODE}, {@code sub_cd = groupId}) 행을 추가한다.
   *
   * @return 오류 코드 또는 {@code null}(성공)
   */
  @Transactional
  public String createGroup(CommonCodeGroupCreateRequest request, String actorUserId) {
    String groupId = normalizeCodeId(request.groupId());
    if (!CODE_ID.matcher(groupId).matches()) {
      return "ERR_COMMON_CODE_INVALID_ID";
    }
    if (MAIN_CODE_GROUPS.equals(groupId)) {
      return "ERR_COMMON_CODE_RESERVED_ID";
    }
    if (omCodeMapper.selectByPk(MAIN_CODE_GROUPS, groupId) != null) {
      return "ERR_COMMON_CODE_DUPLICATE";
    }
    int dispSeq = request.dispSeq() != null ? request.dispSeq() : nextGroupDispSeq();
    String codeNmJson = writeJson(request.codeNm());
    String codeInfoJson = buildCodeInfoJson(request.useYn(), dispSeq);
    omCodeMapper.insert(MAIN_CODE_GROUPS, groupId, codeNmJson, codeInfoJson, actorUserId);
    return null;
  }

  /**
   * 지정 {@code main_cd} 아래 코드값 행을 추가한다.
   *
   * @return 오류 코드 또는 {@code null}(성공)
   */
  @Transactional
  public String createItem(String mainCd, CommonCodeItemCreateRequest request, String actorUserId) {
    String m = normalizeMainCd(mainCd);
    if (MAIN_CODE_GROUPS.equals(m)) {
      return "ERR_COMMON_CODE_INVALID_MAIN_CD";
    }
    if (omCodeMapper.selectByPk(MAIN_CODE_GROUPS, m) == null) {
      return "ERR_COMMON_CODE_GROUP_UNKNOWN";
    }
    String subCd = normalizeCodeId(request.subCd());
    if (!CODE_ID.matcher(subCd).matches()) {
      return "ERR_COMMON_CODE_INVALID_ID";
    }
    if (omCodeMapper.selectByPk(m, subCd) != null) {
      return "ERR_COMMON_CODE_DUPLICATE";
    }
    int dispSeq = request.dispSeq() != null ? request.dispSeq() : nextItemDispSeq(m);
    String codeNmJson = writeJson(request.codeNm());
    String codeInfoJson = buildCodeInfoJson(request.useYn(), dispSeq);
    omCodeMapper.insert(m, subCd, codeNmJson, codeInfoJson, actorUserId);
    return null;
  }

  /**
   * 코드명·부가정보를 갱신한다.
   *
   * @return 오류 코드 또는 {@code null}(성공)
   */
  @Transactional
  public String updateRow(String mainCd, String subCd, CommonCodeUpdateRequest request, String actorUserId) {
    String m = normalizeMainCd(mainCd);
    String s = normalizeCodeId(subCd);
    OmCodeEntity existing = omCodeMapper.selectByPk(m, s);
    if (existing == null) {
      return "ERR_COMMON_CODE_NOT_FOUND";
    }
    String codeNmJson = writeJson(request.codeNm());
    String codeInfoJson = buildCodeInfoJson(request.useYn(), request.dispSeq());
    omCodeMapper.updateCode(m, s, codeNmJson, codeInfoJson, actorUserId);
    return null;
  }

  /**
   * 동일 그룹 내 표시 순서를 {@code orderedSubCds} 순으로 재설정한다.
   *
   * @return 오류 코드 또는 {@code null}(성공)
   */
  @Transactional
  public String reorder(String mainCd, CommonCodeOrderRequest request, String actorUserId) {
    String m = normalizeMainCd(mainCd);
    if (MAIN_CODE_GROUPS.equals(m)) {
      return "ERR_COMMON_CODE_INVALID_MAIN_CD";
    }
    List<OmCodeEntity> rows = omCodeMapper.selectItemsByMainCd(m);
    Set<String> expected = new HashSet<>();
    for (OmCodeEntity row : rows) {
      expected.add(row.subCd());
    }
    LinkedHashSet<String> ordered = new LinkedHashSet<>();
    for (String id : request.orderedSubCds()) {
      ordered.add(normalizeCodeId(id));
    }
    if (!expected.equals(ordered) || ordered.size() != request.orderedSubCds().size()) {
      return "ERR_COMMON_CODE_ORDER_MISMATCH";
    }
    int seq = 1;
    for (String subCd : ordered) {
      omCodeMapper.updateDispSeqOnly(m, subCd, seq++, actorUserId);
    }
    return null;
  }

  private int nextGroupDispSeq() {
    int max = 0;
    for (OmCodeEntity row : omCodeMapper.selectCodeGroups()) {
      max = Math.max(max, readDispSeq(row.codeInfo()));
    }
    return max + 1;
  }

  private int nextItemDispSeq(String mainCd) {
    int max = 0;
    for (OmCodeEntity row : omCodeMapper.selectItemsByMainCd(mainCd)) {
      max = Math.max(max, readDispSeq(row.codeInfo()));
    }
    return max + 1;
  }

  private static String normalizeMainCd(String mainCd) {
    return mainCd == null ? "" : mainCd.trim().toUpperCase(Locale.ROOT);
  }

  private static String normalizeCodeId(String raw) {
    return raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
  }

  private Map<String, String> readCodeNm(String json) {
    if (json == null || json.isBlank()) {
      return Map.of();
    }
    try {
      return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (JsonProcessingException e) {
      return Map.of();
    }
  }

  private int readDispSeq(String codeInfoJson) {
    try {
      if (codeInfoJson == null || codeInfoJson.isBlank()) {
        return 0;
      }
      JsonNode n = objectMapper.readTree(codeInfoJson).path("disp_seq");
      return n.isNumber() ? n.asInt() : 0;
    } catch (JsonProcessingException e) {
      return 0;
    }
  }

  private String readUseYn(String codeInfoJson) {
    try {
      if (codeInfoJson == null || codeInfoJson.isBlank()) {
        return "Y";
      }
      String v = objectMapper.readTree(codeInfoJson).path("use_yn").asText("Y");
      return "N".equals(v) ? "N" : "Y";
    } catch (JsonProcessingException e) {
      return "Y";
    }
  }

  private String writeJson(Map<String, String> map) {
    try {
      ObjectNode node = objectMapper.createObjectNode();
      for (Map.Entry<String, String> e : map.entrySet()) {
        if (e.getKey() == null || e.getValue() == null) {
          continue;
        }
        String k = e.getKey().trim();
        if (k.isEmpty()) {
          continue;
        }
        node.put(k, e.getValue());
      }
      return objectMapper.writeValueAsString(node);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("code_nm json", e);
    }
  }

  private String buildCodeInfoJson(String useYn, int dispSeq) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("use_yn", "N".equals(useYn) ? "N" : "Y");
    node.put("disp_seq", dispSeq);
    return node.toString();
  }
}
