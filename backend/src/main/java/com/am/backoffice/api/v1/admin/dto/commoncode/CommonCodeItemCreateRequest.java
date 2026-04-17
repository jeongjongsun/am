package com.am.backoffice.api.v1.admin.dto.commoncode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

/** 특정 그룹({@code main_cd}) 아래 코드값 행 생성 요청. */
public record CommonCodeItemCreateRequest(
    @NotBlank @Size(max = 50) String subCd,
    @NotNull Map<String, String> codeNm,
    @NotBlank @Pattern(regexp = "[YN]") String useYn,
    Integer dispSeq) {}
