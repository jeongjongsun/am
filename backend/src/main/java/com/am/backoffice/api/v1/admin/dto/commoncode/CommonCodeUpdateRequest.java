package com.am.backoffice.api.v1.admin.dto.commoncode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.Map;

/** 코드명·사용 여부·표시 순서 갱신 요청(물리 삭제 없음). */
public record CommonCodeUpdateRequest(
    @NotNull Map<String, String> codeNm,
    @NotBlank @Pattern(regexp = "[YN]") String useYn,
    @NotNull Integer dispSeq) {}
