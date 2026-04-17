package com.am.backoffice.mapper;

import com.am.backoffice.error.OmErrorLogEntity;
import com.am.backoffice.error.OmErrorLogSummaryRow;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OmErrorLogMapper {

  int insert(OmErrorLogEntity row);

  long countAll();

  List<OmErrorLogSummaryRow> selectPage(@Param("offset") int offset, @Param("size") int size);

  OmErrorLogEntity selectById(@Param("id") long id);
}
