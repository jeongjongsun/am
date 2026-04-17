package com.am.backoffice.mapper;

import com.am.backoffice.corporation.OmCorporationExistingRow;
import com.am.backoffice.corporation.OmCorporationListRow;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OmCorporationListMapper {

  long countAll();

  List<OmCorporationListRow> selectPage(
      @Param("offset") int offset,
      @Param("limit") int limit,
      @Param("sortColumn") String sortColumn,
      @Param("sortDirection") String sortDirection);

  OmCorporationListRow selectOneByCd(@Param("corporationCd") String corporationCd);

  OmCorporationExistingRow selectExistingForUpdate(@Param("corporationCd") String corporationCd);

  int updateCorporation(
      @Param("corporationCd") String corporationCd,
      @Param("corporationNm") String corporationNm,
      @Param("corporationInfoJson") String corporationInfoJson,
      @Param("active") boolean active,
      @Param("updatedBy") String updatedBy);
}
