package com.am.backoffice.corporation;

import java.time.OffsetDateTime;

/** {@code om_corporation_m} 목록 조회용 ({@code corporation_info} JSONB 펼침). */
public class OmCorporationListRow {

  private String corporationCd;
  private String corporationNm;
  private String businessNo;
  private String ceoNm;
  private String address;
  private String telNo;
  private String faxNo;
  private String email;
  private String homepageUrl;
  private String remark;
  private boolean active;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;
  private String createdBy;
  private String updatedBy;

  public String getCorporationCd() {
    return corporationCd;
  }

  public void setCorporationCd(String corporationCd) {
    this.corporationCd = corporationCd;
  }

  public String getCorporationNm() {
    return corporationNm;
  }

  public void setCorporationNm(String corporationNm) {
    this.corporationNm = corporationNm;
  }

  public String getBusinessNo() {
    return businessNo;
  }

  public void setBusinessNo(String businessNo) {
    this.businessNo = businessNo;
  }

  public String getCeoNm() {
    return ceoNm;
  }

  public void setCeoNm(String ceoNm) {
    this.ceoNm = ceoNm;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getTelNo() {
    return telNo;
  }

  public void setTelNo(String telNo) {
    this.telNo = telNo;
  }

  public String getFaxNo() {
    return faxNo;
  }

  public void setFaxNo(String faxNo) {
    this.faxNo = faxNo;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getHomepageUrl() {
    return homepageUrl;
  }

  public void setHomepageUrl(String homepageUrl) {
    this.homepageUrl = homepageUrl;
  }

  public String getRemark() {
    return remark;
  }

  public void setRemark(String remark) {
    this.remark = remark;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
  }

  public String getUpdatedBy() {
    return updatedBy;
  }

  public void setUpdatedBy(String updatedBy) {
    this.updatedBy = updatedBy;
  }
}
