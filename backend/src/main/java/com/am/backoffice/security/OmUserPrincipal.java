package com.am.backoffice.security;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class OmUserPrincipal implements UserDetails {

  private final OmUserAuthRow row;
  private final List<GrantedAuthority> authorities;

  public OmUserPrincipal(OmUserAuthRow row) {
    this.row = row;
    this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + row.gradeCd()));
  }

  public String getUserId() {
    return row.userId();
  }

  public String getDisplayName() {
    return row.userNm();
  }

  public String getGradeCd() {
    return row.gradeCd();
  }

  public String getUserStatus() {
    return row.userStatus();
  }

  public int getPasswordFailCnt() {
    return row.passwordFailCnt();
  }

  public String getAccessIpLimit() {
    return row.accessIpLimit();
  }

  public String getAccessIpJson() {
    return row.accessIpJson();
  }

  public String getSecondAuthYn() {
    return row.secondAuthYn();
  }

  public String getEmailId() {
    return row.emailId();
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  @Override
  public String getPassword() {
    return row.passwordHash();
  }

  @Override
  public String getUsername() {
    return row.userId();
  }
}
