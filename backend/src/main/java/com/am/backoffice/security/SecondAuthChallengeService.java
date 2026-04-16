package com.am.backoffice.security;

import jakarta.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

/** 로그인 2차 인증(이메일 코드)을 HTTP 세션에 보관·검증한다. */
@Service
public class SecondAuthChallengeService {

  static final String ATTR_USER_ID = "AM_SECOND_AUTH_USER_ID";
  static final String ATTR_CODE = "AM_SECOND_AUTH_CODE";
  static final String ATTR_EXPIRES_AT_MS = "AM_SECOND_AUTH_EXPIRES_AT_MS";

  private final SecureRandom random = new SecureRandom();
  private final int codeLength;
  private final int ttlMinutes;

  public SecondAuthChallengeService(
      @Value("${am.auth.second-auth-code-length:6}") int codeLength,
      @Value("${am.auth.second-auth-ttl-minutes:10}") int ttlMinutes) {
    this.codeLength = Math.min(Math.max(codeLength, 4), 10);
    this.ttlMinutes = Math.max(ttlMinutes, 1);
  }

  public String begin(HttpSession session, String userId) {
    clear(session);
    String code = generateNumericCode();
    long expiresAt = System.currentTimeMillis() + ttlMinutes * 60_000L;
    session.setAttribute(ATTR_USER_ID, userId);
    session.setAttribute(ATTR_CODE, code);
    session.setAttribute(ATTR_EXPIRES_AT_MS, expiresAt);
    return code;
  }

  public void verifyOrThrow(HttpSession session, String userId, String submittedCode) {
    if (session == null) {
      throw new BadCredentialsException("second factor session missing");
    }
    Object uidObj = session.getAttribute(ATTR_USER_ID);
    if (!(uidObj instanceof String pendingUid) || !pendingUid.equals(userId)) {
      throw new BadCredentialsException("second factor user mismatch");
    }
    Object expObj = session.getAttribute(ATTR_EXPIRES_AT_MS);
    if (!(expObj instanceof Long expiresAt) || System.currentTimeMillis() > expiresAt) {
      throw new BadCredentialsException("second factor expired");
    }
    Object codeObj = session.getAttribute(ATTR_CODE);
    if (!(codeObj instanceof String expected)) {
      throw new BadCredentialsException("second factor code missing");
    }
    String input = submittedCode == null ? "" : submittedCode.trim();
    if (!constantTimeEquals(expected, input)) {
      throw new BadCredentialsException("second factor code mismatch");
    }
  }

  public void clear(HttpSession session) {
    if (session == null) {
      return;
    }
    session.removeAttribute(ATTR_USER_ID);
    session.removeAttribute(ATTR_CODE);
    session.removeAttribute(ATTR_EXPIRES_AT_MS);
  }

  private String generateNumericCode() {
    int bound = (int) Math.pow(10, codeLength);
    int floor = (int) Math.pow(10, codeLength - 1);
    int n = floor + random.nextInt(bound - floor);
    return String.valueOf(n);
  }

  private static boolean constantTimeEquals(String a, String b) {
    byte[] aa = a.getBytes(StandardCharsets.UTF_8);
    byte[] bb = b.getBytes(StandardCharsets.UTF_8);
    try {
      return MessageDigest.isEqual(aa, bb);
    } catch (IllegalArgumentException e) {
      return false;
    }
  }
}
