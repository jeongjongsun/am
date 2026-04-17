package com.am.backoffice.api.v1.admin.dto.commoncode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

/** 그룹 정의 행({@code main_cd = CODE}) 생성 요청. */
public record CommonCodeGroupCreateRequest(
    @NotBlank @Size(max = 50) String groupId,
    @NotNull Map<String, String> codeNm,
    @NotBlank @Pattern(regexp = "[YN]") String useYn,
    Integer dispSeq) {}
