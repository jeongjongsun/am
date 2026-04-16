package com.am.backoffice.api.v1.auth;

import com.am.backoffice.api.v1.auth.dto.AuthMeData;
import com.am.backoffice.api.v1.auth.dto.LoginRequest;
import com.am.backoffice.api.v1.auth.dto.SecondFactorVerifyRequest;
import com.am.backoffice.common.dto.ApiResponse;
import com.am.backoffice.mapper.OmUserAuthMapper;
import com.am.backoffice.security.AuthSessionPrincipal;
import com.am.backoffice.security.LoginAuthenticationException;
import com.am.backoffice.security.OmUserPrincipal;
import com.am.backoffice.security.SecondAuthChallengeService;
import com.am.backoffice.security.SecondAuthMailNotifier;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증·세션 연동 후 확장 (docs/guide/02-개발-표준.md — GET /api/v1/auth/me).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private static final SecurityContextLogoutHandler LOGOUT_HANDLER = new SecurityContextLogoutHandler();

  private final AuthenticationManager authenticationManager;
  private final SecurityContextRepository securityContextRepository;
  private final MessageSource messageSource;
  private final OmUserAuthMapper omUserAuthMapper;
  private final SecondAuthChallengeService secondAuthChallengeService;
  private final SecondAuthMailNotifier secondAuthMailNotifier;
  private final UserDetailsService userDetailsService;

  public AuthController(
      AuthenticationManager authenticationManager,
      SecurityContextRepository securityContextRepository,
      MessageSource messageSource,
      OmUserAuthMapper omUserAuthMapper,
      SecondAuthChallengeService secondAuthChallengeService,
      SecondAuthMailNotifier secondAuthMailNotifier,
      UserDetailsService userDetailsService) {
    this.authenticationManager = authenticationManager;
    this.securityContextRepository = securityContextRepository;
    this.messageSource = messageSource;
    this.omUserAuthMapper = omUserAuthMapper;
    this.secondAuthChallengeService = secondAuthChallengeService;
    this.secondAuthMailNotifier = secondAuthMailNotifier;
    this.userDetailsService = userDetailsService;
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<AuthMeData>> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpServletRequest,
      HttpServletResponse httpServletResponse) {
    try {
      Authentication authentication =
          authenticationManager.authenticate(
              UsernamePasswordAuthenticationToken.unauthenticated(
                  request.userId(), request.password()));

      OmUserPrincipal principal = (OmUserPrincipal) authentication.getPrincipal();

      if ("Y".equalsIgnoreCase(trimToEmpty(principal.getSecondAuthYn()))) {
        String email = trimToEmpty(principal.getEmailId());
        if (email.isEmpty()) {
          return ResponseEntity.ok(
              new ApiResponse<>(
                  false,
                  null,
                  message(
                      "auth.error.second_auth_email_missing",
                      "2차 인증이 활성화되어 있으나 이메일이 등록되어 있지 않습니다. 관리자에게 문의하세요."),
                  "ERR_SECOND_AUTH_EMAIL_MISSING"));
        }
        HttpSession session = httpServletRequest.getSession(true);
        String code = secondAuthChallengeService.begin(session, principal.getUserId());
        secondAuthMailNotifier.sendLoginCode(email, code);
        AuthMeData data =
            AuthMeData.secondFactorRequired(principal.getUserId(), principal.getDisplayName());
        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                data,
                message("auth.login.second_factor_sent", "이메일로 인증번호를 발송했습니다."),
                "SECOND_FACTOR_REQUIRED"));
      }

      establishSession(
          httpServletRequest, httpServletResponse, principal, request.userId());
      AuthMeData data =
          AuthMeData.signedIn(
              principal.getUserId(), principal.getDisplayName(), principal.getGradeCd());
      return ResponseEntity.ok(new ApiResponse<>(true, data, message("auth.login.success", "로그인 성공"), "SUCCESS"));
    } catch (LoginAuthenticationException e) {
      // SPA 콘솔에 4xx가 반복 노출되는 것을 피하기 위해 HTTP 200 + success=false 로 통일한다.
      return ResponseEntity.ok(new ApiResponse<>(false, null, e.getMessage(), e.getCode()));
    } catch (BadCredentialsException e) {
      return ResponseEntity.ok(
          new ApiResponse<>(
              false,
              null,
              message("auth.error.invalid_credentials", "사용자 정보가 일치하지 않습니다."),
              "ERR_INVALID_CREDENTIALS"));
    }
  }

  @PostMapping("/login/second-factor")
  public ResponseEntity<ApiResponse<AuthMeData>> verifySecondFactor(
      @Valid @RequestBody SecondFactorVerifyRequest request,
      HttpServletRequest httpServletRequest,
      HttpServletResponse httpServletResponse) {
    try {
      HttpSession session = httpServletRequest.getSession(false);
      secondAuthChallengeService.verifyOrThrow(session, request.userId(), request.code());
      secondAuthChallengeService.clear(session);

      OmUserPrincipal principal =
          (OmUserPrincipal) userDetailsService.loadUserByUsername(request.userId());
      establishSession(httpServletRequest, httpServletResponse, principal, request.userId());
      AuthMeData data =
          AuthMeData.signedIn(
              principal.getUserId(), principal.getDisplayName(), principal.getGradeCd());
      return ResponseEntity.ok(new ApiResponse<>(true, data, message("auth.login.success", "로그인 성공"), "SUCCESS"));
    } catch (BadCredentialsException e) {
      return ResponseEntity.ok(
          new ApiResponse<>(
              false,
              null,
              message(
                  "auth.error.second_factor_invalid",
                  "인증번호가 올바르지 않았거나 만료되었습니다."),
              "ERR_SECOND_FACTOR_INVALID"));
    }
  }

  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout(
      HttpServletRequest httpServletRequest,
      HttpServletResponse httpServletResponse,
      Authentication authentication) {
    HttpSession session = httpServletRequest.getSession(false);
    secondAuthChallengeService.clear(session);
    LOGOUT_HANDLER.logout(httpServletRequest, httpServletResponse, authentication);
    return ResponseEntity.ok(
        new ApiResponse<>(true, null, message("auth.logout.success", "로그아웃되었습니다."), "SUCCESS"));
  }

  @GetMapping("/me")
  public ResponseEntity<ApiResponse<AuthMeData>> me(Authentication authentication) {
    if (authentication == null
        || !authentication.isAuthenticated()
        || authentication instanceof AnonymousAuthenticationToken) {
      // 세션 없음은 비즈니스 실패로 본문으로만 구분 (HTTP 401 시 브라우저 콘솔에 경고가 반복됨).
      return ResponseEntity.ok(
          new ApiResponse<>(
              false, null, message("auth.error.unauthorized", "인증이 필요합니다."), "ERR_UNAUTHORIZED"));
    }

    Object principal = authentication.getPrincipal();
    if (principal instanceof AuthSessionPrincipal sessionPrincipal) {
      AuthMeData data =
          AuthMeData.signedIn(
              sessionPrincipal.userId(),
              sessionPrincipal.displayName(),
              sessionPrincipal.gradeCd());
      return ResponseEntity.ok(new ApiResponse<>(true, data, null, "SUCCESS"));
    }

    if (principal instanceof OmUserPrincipal omUserPrincipal) {
      AuthMeData data =
          AuthMeData.signedIn(
              omUserPrincipal.getUserId(),
              omUserPrincipal.getDisplayName(),
              omUserPrincipal.getGradeCd());
      return ResponseEntity.ok(new ApiResponse<>(true, data, null, "SUCCESS"));
    }

    String userId = authentication.getName();
    AuthMeData data = AuthMeData.signedIn(userId, userId, null);
    return ResponseEntity.ok(new ApiResponse<>(true, data, null, "SUCCESS"));
  }

  private void establishSession(
      HttpServletRequest request,
      HttpServletResponse response,
      OmUserPrincipal principal,
      String userIdForAudit) {
    AuthSessionPrincipal sessionPrincipal =
        new AuthSessionPrincipal(
            principal.getUserId(),
            principal.getDisplayName(),
            principal.getGradeCd(),
            principal.getUserStatus());

    Authentication sessionAuthentication =
        UsernamePasswordAuthenticationToken.authenticated(
            sessionPrincipal, null, principal.getAuthorities());

    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(sessionAuthentication);
    SecurityContextHolder.setContext(context);
    securityContextRepository.saveContext(context, request, response);
    omUserAuthMapper.updateLastLoginDtm(userIdForAudit);
  }

  private String message(String key, String defaultMessage) {
    String def = defaultMessage == null ? "" : defaultMessage;
    return messageSource.getMessage(key, null, def, LocaleContextHolder.getLocale());
  }

  private static String trimToEmpty(String s) {
    return s == null ? "" : s.trim();
  }
}
