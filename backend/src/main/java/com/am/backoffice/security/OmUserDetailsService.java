package com.am.backoffice.security;

import com.am.backoffice.mapper.OmUserAuthMapper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class OmUserDetailsService implements UserDetailsService {

  private final OmUserAuthMapper omUserAuthMapper;

  public OmUserDetailsService(OmUserAuthMapper omUserAuthMapper) {
    this.omUserAuthMapper = omUserAuthMapper;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    OmUserAuthRow row = omUserAuthMapper.findByUserId(username);
    if (row == null) {
      throw new UsernameNotFoundException("존재하지 않는 사용자입니다.");
    }
    return new OmUserPrincipal(row);
  }
}
