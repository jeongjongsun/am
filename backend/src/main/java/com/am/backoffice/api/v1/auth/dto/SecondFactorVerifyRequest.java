package com.am.backoffice.api.v1.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** 2차 인증(이메일 코드) 확인 요청. */
public record SecondFactorVerifyRequest(
    @NotBlank String userId,
    @NotBlank @Pattern(regexp = "\\d{4,10}") String code) {}
