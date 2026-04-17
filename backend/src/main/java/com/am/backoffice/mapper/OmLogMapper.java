package com.am.backoffice.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OmLogMapper {

  void insertBusinessAudit(
      @Param("actorUserId") String actorUserId,
      @Param("menuCd") String menuCd,
      @Param("actionCd") String actionCd,
      @Param("messageKey") String messageKey,
      @Param("resourceType") String resourceType,
      @Param("resourceId") String resourceId,
      @Param("detailJson") String detailJson,
      @Param("requestId") String requestId,
      @Param("clientPath") String clientPath,
      @Param("httpMethod") String httpMethod,
      @Param("apiPath") String apiPath,
      @Param("ipAddr") String ipAddr,
      @Param("userAgent") String userAgent);
}
