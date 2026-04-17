package com.am.backoffice.api.v1.admin.dto.corporation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 화주(법인) 그리드 저장용 본문. {@code corporation_cd}는 경로 변수로 전달. */
public record AdminCorporationUpdateRequest(
    @NotBlank @Size(max = 200) String corporationNm,
    @Size(max = 40) String businessNo,
    @Size(max = 100) String ceoNm,
    @Size(max = 500) String address,
    @Size(max = 40) String telNo,
    @Size(max = 40) String faxNo,
    @Size(max = 200) String email,
    @Size(max = 500) String homepageUrl,
    @Size(max = 4000) String remark,
    @NotNull Boolean active) {}
