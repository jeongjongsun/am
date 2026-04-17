package com.am.backoffice.api.v1.admin.dto.commoncode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/** 동일 {@code main_cd} 내에서 {@code disp_seq}를 일괄 재부여한다. */
public record CommonCodeOrderRequest(@NotEmpty List<@NotBlank String> orderedSubCds) {}
