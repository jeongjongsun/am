import * as XLSX from 'xlsx';

/** AG Grid 등에서 추출한 헤더·행을 .xlsx 로보냄 (OM exportExcel 과 동일 역할). */
export function exportToExcel(
  headers: string[],
  rows: unknown[][],
  fileName: string,
  sheetName = 'Sheet1',
): void {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = headers.map((header, colIdx) => {
    let maxLen = header.length;
    for (const row of rows) {
      const cellLen = String(row[colIdx] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(maxLen + 2, 50) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
