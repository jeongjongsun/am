package com.am.backoffice.api.v1.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "userId는 필수입니다.") String userId,
    @NotBlank(message = "password는 필수입니다.") String password) {}
