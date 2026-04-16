package com.am.backoffice.security;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/** 2차 인증 코드를 이메일로 발송한다. 메일 미설정 시 로그로 대체한다. */
@Component
public class SecondAuthMailNotifier {

  private static final Logger log = LoggerFactory.getLogger(SecondAuthMailNotifier.class);

  private final ObjectProvider<JavaMailSender> mailSender;
  private final MessageSource messageSource;

  public SecondAuthMailNotifier(
      ObjectProvider<JavaMailSender> mailSender, MessageSource messageSource) {
    this.mailSender = mailSender;
    this.messageSource = messageSource;
  }

  public void sendLoginCode(String toEmail, String code) {
    String subject =
        messageSource.getMessage(
            "auth.second_factor.mail_subject",
            null,
            "로그인 인증번호",
            LocaleContextHolder.getLocale());
    String body =
        messageSource.getMessage(
            "auth.second_factor.mail_body", new Object[] {code}, "인증번호: {0}", LocaleContextHolder.getLocale());

    JavaMailSender sender = mailSender.getIfAvailable();
    if (sender != null) {
      try {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper =
            new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body, false);
        sender.send(message);
        return;
      } catch (MessagingException e) {
        log.warn("second auth mail failed for {}: {}", toEmail, e.getMessage());
      }
    }
    log.info("second auth code for {} (mail disabled or failed): {}", toEmail, code);
  }
}
