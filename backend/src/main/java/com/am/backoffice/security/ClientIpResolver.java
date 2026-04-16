package com.am.backoffice.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** 현재 요청의 클라이언트 IP를 추출하고 IPv4 문자열로 정규화한다. */
public final class ClientIpResolver {

  private static final Pattern IPV4 = Pattern.compile(
      "^(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)(\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)){3}$");

  private ClientIpResolver() {}

  public static Optional<String> currentClientIpv4() {
    RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
    if (!(attrs instanceof ServletRequestAttributes servletAttrs)) {
      return Optional.empty();
    }
    HttpServletRequest request = servletAttrs.getRequest();
    String xff = request.getHeader("X-Forwarded-For");
    String raw;
    if (xff != null && !xff.isBlank()) {
      raw = xff.split(",")[0].trim();
    } else {
      raw = request.getRemoteAddr();
    }
    return toIpv4(raw);
  }

  static Optional<String> toIpv4(String raw) {
    if (raw == null || raw.isBlank()) {
      return Optional.empty();
    }
    String s = raw.trim();
    if (s.startsWith("::ffff:") && s.contains(".")) {
      s = s.substring("::ffff:".length());
    }
    if (IPV4.matcher(s).matches()) {
      return Optional.of(s);
    }
    return Optional.empty();
  }
}
