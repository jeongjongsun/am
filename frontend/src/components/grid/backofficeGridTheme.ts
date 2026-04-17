import { colorSchemeLightCold, themeBalham } from 'ag-grid-community';

/**
 * 백오피스 그리드 공통 Theming API 테마 (DataGrid·공통코드 등 동일 적용).
 */
export const backofficeGridTheme = themeBalham.withPart(colorSchemeLightCold).withParams({
  columnBorder: { style: 'solid', width: 1, color: '#e2e8f0' },
});
