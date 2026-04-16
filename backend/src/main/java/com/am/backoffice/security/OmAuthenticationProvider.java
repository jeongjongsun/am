package com.am.backoffice.security;

import com.am.backoffice.mapper.OmUserAuthMapper;
import java.util.Set;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class OmAuthenticationProvider implements AuthenticationProvider {

  private static final Set<String> ALLOWED_GRADES = Set.of("ADMIN", "MANAGER");

  private final UserDetailsService userDetailsService;
  private final OmUserAuthMapper omUserAuthMapper;
  private final PasswordEncoder passwordEncoder;
  private final MessageSource messageSource;
  private final int maxPasswordFailCount;

  public OmAuthenticationProvider(
      UserDetailsService userDetailsService,
      OmUserAuthMapper omUserAuthMapper,
      PasswordEncoder passwordEncoder,
      MessageSource messageSource,
      @Value("${am.auth.max-password-fail-count:5}") int maxPasswordFailCount) {
    this.userDetailsService = userDetailsService;
    this.omUserAuthMapper = omUserAuthMapper;
    this.passwordEncoder = passwordEncoder;
    this.messageSource = messageSource;
    this.maxPasswordFailCount = Math.max(maxPasswordFailCount, 1);
  }

  /**
   * 로그인 인증을 수행한다.
   *
   * <p>검증 순서:
   *
   * <ol>
   *   <li>사용자 조회
   *   <li>{@code access_ip_limit=Y} 이면 IPv4·허용 목록 검사
   *   <li>실패 횟수 상한 검사
   *   <li>비밀번호 검사(실패 시 실패 횟수 증가, 상한 시 {@code user_status=LOCKED})
   *   <li>등급/상태 정책 검사
   * </ol>
   */
  @Override
  public Authentication authenticate(Authentication authentication) throws AuthenticationException {
    String userId = authentication.getName();
    String rawPassword = String.valueOf(authentication.getCredentials());

    // 1) 사용자 조회: 존재하지 않거나 삭제 사용자는 동일 메시지로 응답한다.
    OmUserPrincipal principal;
    try {
      principal = (OmUserPrincipal) userDetailsService.loadUserByUsername(userId);
    } catch (UsernameNotFoundException e) {
      throw new BadCredentialsException(message("auth.error.invalid_credentials", "사용자 정보가 일치하지 않습니다."));
    }

    if ("Y".equalsIgnoreCase(trimToEmpty(principal.getAccessIpLimit()))) {
      var clientIp = ClientIpResolver.currentClientIpv4();
      var rules = AccessIpJsonParser.parseRules(principal.getAccessIpJson());
      if (clientIp.isEmpty() || !Ipv4AccessMatcher.isAllowed(clientIp.get(), rules)) {
        throw new LoginAuthenticationException(
            "ERR_ACCESS_IP_NOT_ALLOWED",
            message("auth.error.access_ip_not_allowed", "접속 가능한 IP가 아닙니다."),
            403);
      }
    }

    if (principal.getPasswordFailCnt() >= maxPasswordFailCount) {
      throw new LoginAuthenticationException(
          "ERR_PASSWORD_FAIL_EXCEEDED",
          message("auth.error.password_fail_exceeded", "비밀번호 실패 횟수가 초과되었습니다.\n관리자에게 문의하세요."),
          403);
    }

    // 3) 비밀번호 불일치 시 실패 횟수를 증가시키고, 상한 도달 여부를 즉시 판단한다.
    if (!passwordEncoder.matches(rawPassword, principal.getPassword())) {
      int increasedCount = omUserAuthMapper.increasePasswordFailCount(userId, maxPasswordFailCount);
      if (increasedCount >= maxPasswordFailCount) {
        throw new LoginAuthenticationException(
            "ERR_PASSWORD_FAIL_EXCEEDED",
            message("auth.error.password_fail_exceeded", "비밀번호 실패 횟수가 초과되었습니다.\n관리자에게 문의하세요."),
            403);
      }
      throw new BadCredentialsException(message("auth.error.invalid_credentials", "사용자 정보가 일치하지 않습니다."));
    }

    // 4) 허용 등급 정책(ADMIN, MANAGER) 적용
    if (!ALLOWED_GRADES.contains(principal.getGradeCd())) {
      throw new LoginAuthenticationException(
          "ERR_AUTH_GRADE_NOT_ALLOWED",
          message("auth.error.grade_not_allowed", "로그인이 가능한 등급이 아닙니다."),
          403);
    }

    // 5) 활성 상태(ACTIVE)만 로그인 허용
    if (!"ACTIVE".equals(principal.getUserStatus())) {
      throw new LoginAuthenticationException(
          "ERR_USER_STATUS_NOT_ALLOWED",
          message("auth.error.status_not_allowed", "로그인이 불가능한 상태입니다.\n관리자에게 문의하세요"),
          403);
    }

    return UsernamePasswordAuthenticationToken.authenticated(
        principal, null, principal.getAuthorities());
  }

  @Override
  public boolean supports(Class<?> authentication) {
    return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
  }

  /** 현재 요청 Locale 기준으로 다국어 메시지를 조회한다. */
  private String message(String key, String defaultMessage) {
    return messageSource.getMessage(key, null, defaultMessage, LocaleContextHolder.getLocale());
  }

  private static String trimToEmpty(String s) {
    return s == null ? "" : s.trim();
  }
}
