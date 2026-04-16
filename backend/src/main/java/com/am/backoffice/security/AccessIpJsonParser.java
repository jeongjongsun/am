package com.am.backoffice.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;

/** {@code user_info.access_ip} JSON 배열 문자열을 파싱한다. */
public final class AccessIpJsonParser {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  private AccessIpJsonParser() {}

  public static List<String> parseRules(String accessIpJson) {
    if (accessIpJson == null || accessIpJson.isBlank()) {
      return List.of();
    }
    try {
      List<String> list = MAPPER.readValue(accessIpJson, new TypeReference<>() {});
      if (list == null) {
        return List.of();
      }
      return list.stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
    } catch (Exception e) {
      return List.of();
    }
  }
}
