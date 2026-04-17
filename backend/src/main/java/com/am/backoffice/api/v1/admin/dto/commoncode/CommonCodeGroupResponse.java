package com.am.backoffice.api.v1.admin.dto.commoncode;

import java.util.Map;

/** {@code main_cd = 'CODE'} 인 그룹 메타 한 건을 API로 노출한다. */
public record CommonCodeGroupResponse(
    String groupId, Map<String, String> codeNm, String useYn, int dispSeq) {}
