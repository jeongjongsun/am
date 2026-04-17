package com.am.backoffice.mapper;

import com.am.backoffice.user.OmUserListRow;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OmUserListMapper {

  long countNotDeleted();

  List<OmUserListRow> selectPage(
      @Param("offset") int offset,
      @Param("limit") int limit,
      @Param("sortColumn") String sortColumn,
      @Param("sortDirection") String sortDirection);
}
