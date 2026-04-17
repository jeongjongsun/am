package com.am.backoffice.error;

import java.time.OffsetDateTime;

/** {@code om_error_log_m} 전체 행 조회·적재용. */
public class OmErrorLogEntity {

  private Long id;
  private OffsetDateTime createdAt;
  private String exceptionClass;
  private String exceptionMessage;
  private String stackTrace;
  private String rootCauseClass;
  private String errCode;
  private Integer httpStatus;
  private String httpMethod;
  private String apiPath;
  private String requestId;
  private String actorUserId;
  private String clientPath;
  private String ipAddr;
  private String userAgent;
  private String appProfile;
  private String errorFingerprint;
  /** JSON 문자열 (조회 시 원문). */
  private String detailJson;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getExceptionClass() {
    return exceptionClass;
  }

  public void setExceptionClass(String exceptionClass) {
    this.exceptionClass = exceptionClass;
  }

  public String getExceptionMessage() {
    return exceptionMessage;
  }

  public void setExceptionMessage(String exceptionMessage) {
    this.exceptionMessage = exceptionMessage;
  }

  public String getStackTrace() {
    return stackTrace;
  }

  public void setStackTrace(String stackTrace) {
    this.stackTrace = stackTrace;
  }

  public String getRootCauseClass() {
    return rootCauseClass;
  }

  public void setRootCauseClass(String rootCauseClass) {
    this.rootCauseClass = rootCauseClass;
  }

  public String getErrCode() {
    return errCode;
  }

  public void setErrCode(String errCode) {
    this.errCode = errCode;
  }

  public Integer getHttpStatus() {
    return httpStatus;
  }

  public void setHttpStatus(Integer httpStatus) {
    this.httpStatus = httpStatus;
  }

  public String getHttpMethod() {
    return httpMethod;
  }

  public void setHttpMethod(String httpMethod) {
    this.httpMethod = httpMethod;
  }

  public String getApiPath() {
    return apiPath;
  }

  public void setApiPath(String apiPath) {
    this.apiPath = apiPath;
  }

  public String getRequestId() {
    return requestId;
  }

  public void setRequestId(String requestId) {
    this.requestId = requestId;
  }

  public String getActorUserId() {
    return actorUserId;
  }

  public void setActorUserId(String actorUserId) {
    this.actorUserId = actorUserId;
  }

  public String getClientPath() {
    return clientPath;
  }

  public void setClientPath(String clientPath) {
    this.clientPath = clientPath;
  }

  public String getIpAddr() {
    return ipAddr;
  }

  public void setIpAddr(String ipAddr) {
    this.ipAddr = ipAddr;
  }

  public String getUserAgent() {
    return userAgent;
  }

  public void setUserAgent(String userAgent) {
    this.userAgent = userAgent;
  }

  public String getAppProfile() {
    return appProfile;
  }

  public void setAppProfile(String appProfile) {
    this.appProfile = appProfile;
  }

  public String getErrorFingerprint() {
    return errorFingerprint;
  }

  public void setErrorFingerprint(String errorFingerprint) {
    this.errorFingerprint = errorFingerprint;
  }

  public String getDetailJson() {
    return detailJson;
  }

  public void setDetailJson(String detailJson) {
    this.detailJson = detailJson;
  }
}
