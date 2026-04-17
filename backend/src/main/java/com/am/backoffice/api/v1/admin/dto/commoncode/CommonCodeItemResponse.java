package com.am.backoffice.api.v1.admin.dto.commoncode;

import java.time.OffsetDateTime;
import java.util.Map;

/** 특정 {@code main_cd} 아래 코드값 한 건을 API로 노출한다. */
public record CommonCodeItemResponse(
    String subCd,
    Map<String, String> codeNm,
    String useYn,
    int dispSeq,
    OffsetDateTime updatedAt) {}
