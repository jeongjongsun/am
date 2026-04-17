package com.am.backoffice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청 단위 상관 ID를 부여하고 MDC·request attribute에 둔다. 에러 로그·운영 로그 연계용.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestIdFilter extends OncePerRequestFilter {

  public static final String REQUEST_ID_ATTRIBUTE = "com.am.backoffice.requestId";
  public static final String MDC_REQUEST_ID = "requestId";

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String incoming = request.getHeader("X-Request-Id");
    String requestId =
        incoming == null || incoming.isBlank() ? UUID.randomUUID().toString() : incoming.trim();
    if (requestId.length() > 64) {
      requestId = requestId.substring(0, 64);
    }
    request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
    MDC.put(MDC_REQUEST_ID, requestId);
    try {
      filterChain.doFilter(request, response);
    } finally {
      MDC.remove(MDC_REQUEST_ID);
    }
  }
}
