package com.am.backoffice.mapper;

import com.am.backoffice.security.OmUserAuthRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OmUserAuthMapper {

  /** 사용자 아이디 기준으로 로그인 검증용 정보를 조회한다. (조건: is_deleted = false) */
  OmUserAuthRow findByUserId(@Param("userId") String userId);

  /**
   * 비밀번호 실패 횟수(password_fail_cnt)를 1 증가하고, 증가 후 횟수를 반환한다.
   *
   * <p>증가 후 값이 {@code maxPasswordFailCount} 이상이면 {@code user_status}를 {@code LOCKED}로 갱신한다.
   */
  int increasePasswordFailCount(
      @Param("userId") String userId, @Param("maxPasswordFailCount") int maxPasswordFailCount);

  /** 로그인 성공 시 최종 로그인 일시(last_login_dtm)를 현재 시각으로 갱신한다. */
  int updateLastLoginDtm(@Param("userId") String userId);

  /**
   * 관리자 비밀번호 초기화: 비밀번호 bcrypt 갱신, 실패 횟수 0, LOCKED 이면 ACTIVE.
   *
   * @return 갱신된 행 수(0이면 대상 없음)
   */
  int adminResetPassword(
      @Param("userId") String userId,
      @Param("passwordHash") String passwordHash,
      @Param("updatedBy") String updatedBy);
}
