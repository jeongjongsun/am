package com.am.backoffice.user;

/** {@code om_user_m} 목록 조회용 (JSONB user_info 펼침). */
public class OmUserListRow {

  private String userId;
  private String userNm;
  private String gradeCd;
  private String userStatus;
  private String corporationCd;
  private String emailId;
  private String mobileNo;
  private String lastLoginDtm;
  private String authGroup;
  private String secondAuthYn;
  private java.time.OffsetDateTime createdAt;
  private java.time.OffsetDateTime updatedAt;

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getUserNm() {
    return userNm;
  }

  public void setUserNm(String userNm) {
    this.userNm = userNm;
  }

  public String getGradeCd() {
    return gradeCd;
  }

  public void setGradeCd(String gradeCd) {
    this.gradeCd = gradeCd;
  }

  public String getUserStatus() {
    return userStatus;
  }

  public void setUserStatus(String userStatus) {
    this.userStatus = userStatus;
  }

  public String getCorporationCd() {
    return corporationCd;
  }

  public void setCorporationCd(String corporationCd) {
    this.corporationCd = corporationCd;
  }

  public String getEmailId() {
    return emailId;
  }

  public void setEmailId(String emailId) {
    this.emailId = emailId;
  }

  public String getMobileNo() {
    return mobileNo;
  }

  public void setMobileNo(String mobileNo) {
    this.mobileNo = mobileNo;
  }

  public String getLastLoginDtm() {
    return lastLoginDtm;
  }

  public void setLastLoginDtm(String lastLoginDtm) {
    this.lastLoginDtm = lastLoginDtm;
  }

  public String getAuthGroup() {
    return authGroup;
  }

  public void setAuthGroup(String authGroup) {
    this.authGroup = authGroup;
  }

  public String getSecondAuthYn() {
    return secondAuthYn;
  }

  public void setSecondAuthYn(String secondAuthYn) {
    this.secondAuthYn = secondAuthYn;
  }

  public java.time.OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(java.time.OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public java.time.OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(java.time.OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
