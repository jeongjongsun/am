package com.am.backoffice.corporation;

/** {@code om_corporation_m} 갱신 전 조회용 (JSON 원문 보존·병합). */
public class OmCorporationExistingRow {

  private String corporationCd;
  private String corporationNm;
  private String corporationInfoRaw;
  private boolean active;

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

  public String getCorporationInfoRaw() {
    return corporationInfoRaw;
  }

  public void setCorporationInfoRaw(String corporationInfoRaw) {
    this.corporationInfoRaw = corporationInfoRaw;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }
}
