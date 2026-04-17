package com.am.backoffice.error;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.regex.Pattern;

/** 에러 로그 DB 저장 전 메시지·스택 길이 제한 및 단순 마스킹. */
public final class ErrorLogSanitizer {

  private static final int MAX_MESSAGE_LEN = 4000;
  private static final int MAX_STACK_LEN = 12000;
  private static final Pattern KEY_VALUE_SECRET =
      Pattern.compile(
          "(?i)(password|passwd|pwd|secret|token|authorization)\\s*[:=]\\s*[^\\s,&\"']+");

  private ErrorLogSanitizer() {}

  public static String truncateMessage(String message) {
    if (message == null) {
      return null;
    }
    String masked = KEY_VALUE_SECRET.matcher(message).replaceAll("$1=***");
    if (masked.length() <= MAX_MESSAGE_LEN) {
      return masked;
    }
    return masked.substring(0, MAX_MESSAGE_LEN) + "…(truncated)";
  }

  public static String stackTraceString(Throwable ex) {
    if (ex == null) {
      return null;
    }
    StringWriter sw = new StringWriter();
    ex.printStackTrace(new PrintWriter(sw));
    String s = sw.toString();
    s = KEY_VALUE_SECRET.matcher(s).replaceAll("$1=***");
    if (s.length() <= MAX_STACK_LEN) {
      return s;
    }
    return s.substring(0, MAX_STACK_LEN) + "\n…(truncated)";
  }

  public static String firstStackLine(String stackTrace) {
    if (stackTrace == null || stackTrace.isBlank()) {
      return "";
    }
    int nl = stackTrace.indexOf('\n');
    String first = nl > 0 ? stackTrace.substring(0, nl) : stackTrace;
    return first.length() > 500 ? first.substring(0, 500) : first;
  }
}
