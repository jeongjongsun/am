package com.am.backoffice.security;

import java.util.List;
import java.util.regex.Pattern;

/** IPv4 단일 주소 또는 CIDR 규칙 목록에 클라이언트 IPv4가 포함되는지 판별한다. */
public final class Ipv4AccessMatcher {

  private static final Pattern IPV4 = Pattern.compile(
      "^(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)(\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)){3}$");

  private Ipv4AccessMatcher() {}

  public static boolean isAllowed(String clientIpv4, List<String> rules) {
    if (rules == null || rules.isEmpty()) {
      return false;
    }
    for (String rule : rules) {
      if (rule == null || rule.isBlank()) {
        continue;
      }
      String r = rule.trim();
      if (r.contains("/")) {
        if (inCidr(clientIpv4, r)) {
          return true;
        }
      } else if (IPV4.matcher(r).matches() && r.equals(clientIpv4)) {
        return true;
      }
    }
    return false;
  }

  private static boolean inCidr(String clientIpv4, String cidr) {
    String[] parts = cidr.split("/");
    if (parts.length != 2) {
      return false;
    }
    if (!IPV4.matcher(parts[0].trim()).matches() || !IPV4.matcher(clientIpv4).matches()) {
      return false;
    }
    int prefix;
    try {
      prefix = Integer.parseInt(parts[1].trim());
    } catch (NumberFormatException e) {
      return false;
    }
    if (prefix < 0 || prefix > 32) {
      return false;
    }
    int network = ipv4ToInt(parts[0].trim());
    int host = ipv4ToInt(clientIpv4);
    long mask = prefix == 0 ? 0L : (0xffffffffL << (32 - prefix)) & 0xffffffffL;
    return (network & mask) == (host & mask);
  }

  private static int ipv4ToInt(String ipv4) {
    String[] oct = ipv4.split("\\.");
    if (oct.length != 4) {
      throw new IllegalArgumentException(ipv4);
    }
    int a = Integer.parseInt(oct[0]);
    int b = Integer.parseInt(oct[1]);
    int c = Integer.parseInt(oct[2]);
    int d = Integer.parseInt(oct[3]);
    return (a << 24) | (b << 16) | (c << 8) | d;
  }
}
