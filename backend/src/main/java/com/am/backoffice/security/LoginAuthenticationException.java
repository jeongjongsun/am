package com.am.backoffice.security;

import org.springframework.security.core.AuthenticationException;

public class LoginAuthenticationException extends AuthenticationException {

  private final String code;
  private final int status;

  public LoginAuthenticationException(String code, String message, int status) {
    super(message);
    this.code = code;
    this.status = status;
  }

  public String getCode() {
    return code;
  }

  public int getStatus() {
    return status;
  }
}
