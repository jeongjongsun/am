package com.am.backoffice.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** MyBatis 연결 확인용. 실제 도메인 매퍼 추가 후 제거해도 된다. */
@Mapper
public interface BootstrapMapper {

  @Select("SELECT 1")
  int selectOne();
}
