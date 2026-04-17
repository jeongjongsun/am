package com.am.backoffice.mapper;

import com.am.backoffice.code.OmCodeEntity;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OmCodeMapper {

  /** {@code main_cd = 'CODE'} 인 그룹 정의 행을 정렬 순으로 조회한다. */
  List<OmCodeEntity> selectCodeGroups();

  /** 지정 그룹({@code main_cd})에 속한 코드값 행을 정렬 순으로 조회한다. */
  List<OmCodeEntity> selectItemsByMainCd(@Param("mainCd") String mainCd);

  /** 복합 PK로 단건을 조회한다. */
  OmCodeEntity selectByPk(@Param("mainCd") String mainCd, @Param("subCd") String subCd);

  /**
   * 공통코드 행을 삽입한다.
   *
   * @return 삽입된 행 수
   */
  int insert(
      @Param("mainCd") String mainCd,
      @Param("subCd") String subCd,
      @Param("codeNmJson") String codeNmJson,
      @Param("codeInfoJson") String codeInfoJson,
      @Param("actorUserId") String actorUserId);

  /**
   * 코드명·부가정보 JSON을 갱신한다. 물리 삭제는 하지 않는다.
   *
   * @return 갱신된 행 수
   */
  int updateCode(
      @Param("mainCd") String mainCd,
      @Param("subCd") String subCd,
      @Param("codeNmJson") String codeNmJson,
      @Param("codeInfoJson") String codeInfoJson,
      @Param("actorUserId") String actorUserId);

  /**
   * {@code code_info.disp_seq}만 갱신한다(순서 일괄 저장).
   *
   * @return 갱신된 행 수
   */
  int updateDispSeqOnly(
      @Param("mainCd") String mainCd,
      @Param("subCd") String subCd,
      @Param("dispSeq") int dispSeq,
      @Param("actorUserId") String actorUserId);
}
