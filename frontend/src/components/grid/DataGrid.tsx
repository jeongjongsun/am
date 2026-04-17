import { Download } from 'react-feather';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { AllCommunityModule } from 'ag-grid-community';
import type {
  ColDef,
  GridReadyEvent,
  CellValueChangedEvent,
  GetRowIdParams,
  SelectionChangedEvent,
} from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import { useTranslation } from 'react-i18next';

import { exportToExcel } from '@/utils/exportExcel';
import { backofficeGridTheme } from './backofficeGridTheme';
import { AG_GRID_LOCALE_KO } from './agGridLocaleKo';
import './DataGrid.css';
import { useAgGridViewportHeight } from './useAgGridViewportHeight';

export interface DataGridRef {
  exportExcel: () => void;
  scrollToTop: () => void;
}

const modules = [AllCommunityModule];

export interface DataGridProps<TData = unknown> {
  columnDefs: ColDef<TData>[];
  rowData: TData[];
  pagination?: boolean;
  paginationPageSize?: number;
  paginationPageSizeSelector?: number[] | boolean;
  loading?: boolean;
  height?: 'auto' | number;
  bottomOffset?: number;
  exportFileName?: string;
  showExportButton?: boolean;
  defaultColDef?: ColDef<TData>;
  onCellValueChanged?: (event: CellValueChangedEvent<TData>) => void;
  onGridReady?: (event: GridReadyEvent<TData>) => void;
  getRowId?: (params: GetRowIdParams<TData>) => string;
  rowSelection?: 'single' | 'multiple';
  onSelectionChanged?: (event: SelectionChangedEvent<TData>) => void;
  toolbar?: React.ReactNode;
  toolbarSecondary?: React.ReactNode | ((exportButton: React.ReactNode) => React.ReactNode);
  footer?: React.ReactNode;
  enableCellSpan?: boolean;
  /** AG Grid context (예: 서버 페이징 행번호). */
  context?: unknown;
  /** 한 번 클릭으로 셀 편집 시작 (기본은 더블클릭). */
  singleClickEdit?: boolean;
  /** 포커스가 그리드 밖으로 나가면 편집 종료·값 반영. */
  stopEditingWhenCellsLoseFocus?: boolean;
}

function DataGridInner<TData = unknown>(
  {
    columnDefs,
    rowData,
    pagination = true,
    paginationPageSize = 100,
    paginationPageSizeSelector = [50, 100, 500, 1000, 5000],
    loading = false,
    height = 'auto',
    bottomOffset = 0,
    exportFileName,
    showExportButton = true,
    defaultColDef,
    onCellValueChanged,
    onGridReady,
    getRowId,
    rowSelection,
    onSelectionChanged,
    toolbar,
    toolbarSecondary,
    footer,
    enableCellSpan = false,
    context,
    singleClickEdit = false,
    stopEditingWhenCellsLoseFocus = true,
  }: DataGridProps<TData>,
  ref: React.Ref<DataGridRef>,
) {
  const { t, i18n } = useTranslation('common');
  const gridRef = useRef<AgGridReact<TData>>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const autoHeight = useAgGridViewportHeight(gridWrapperRef, bottomOffset);
  const resolvedHeight = height === 'auto' ? autoHeight : height;

  const handleExportExcel = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const columns = api.getAllDisplayedColumns();
    const headers = columns.map(
      (col) => api.getDisplayNameForColumn(col, null) ?? col.getColId(),
    );

    const rows: unknown[][] = [];
    api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) {
        const row = columns.map((col) =>
          api.getCellValue({ rowNode: node, colKey: col.getColId() }),
        );
        rows.push(row);
      }
    });

    exportToExcel(headers, rows, exportFileName ?? 'export');
  }, [exportFileName]);

  const handleScrollToTop = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const rowCount = api.getDisplayedRowCount();
    if (rowCount > 0) api.ensureIndexVisible(0, 'top');
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      exportExcel: handleExportExcel,
      scrollToTop: handleScrollToTop,
    }),
    [handleExportExcel, handleScrollToTop],
  );

  const mergedDefaultColDef = useMemo<ColDef<TData>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 80,
      ...defaultColDef,
    }),
    [defaultColDef],
  );

  const localeText = useMemo(
    () => (i18n.language === 'ko' ? AG_GRID_LOCALE_KO : undefined),
    [i18n.language],
  );

  const resolvedRowSelection = useMemo(() => {
    if (rowSelection === 'multiple') {
      return { mode: 'multiRow' as const, checkboxes: true, headerCheckbox: true };
    }
    if (rowSelection === 'single') {
      return { mode: 'singleRow' as const };
    }
    return undefined;
  }, [rowSelection]);

  const selectionColumnDef = useMemo(
    () => (rowSelection === 'multiple' ? { pinned: 'left' as const } : undefined),
    [rowSelection],
  );

  return (
    <div
      className="data-grid-wrapper"
      ref={gridWrapperRef}
      style={{
        height: resolvedHeight,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {(showExportButton || toolbar != null || toolbarSecondary != null) && (
        <div
          className={`data-grid-toolbar${toolbarSecondary != null ? ' data-grid-toolbar--rows' : ''}`}
        >
          {toolbarSecondary != null ? (
            <>
              {toolbar != null && <div className="data-grid-toolbar__primary">{toolbar}</div>}
              <div className="data-grid-toolbar__secondary">
                {typeof toolbarSecondary === 'function'
                  ? toolbarSecondary(
                      showExportButton ? (
                        <button
                          key="export"
                          type="button"
                          className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                          onClick={handleExportExcel}
                          title={t('grid.exportExcel')}
                        >
                          <Download size={16} className="me-1" aria-hidden />
                          {t('grid.exportExcel')}
                        </button>
                      ) : null,
                    )
                  : (
                    <>
                      {toolbarSecondary}
                      {showExportButton && (
                        <button
                          type="button"
                          className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                          onClick={handleExportExcel}
                          title={t('grid.exportExcel')}
                        >
                          <Download size={16} className="me-1" aria-hidden />
                          {t('grid.exportExcel')}
                        </button>
                      )}
                    </>
                  )}
              </div>
            </>
          ) : (
            <>
              {toolbar}
              {showExportButton && (
                <button
                  type="button"
                  className="btn btn-phoenix-secondary btn-sm btn-default-visible"
                  onClick={handleExportExcel}
                  title={t('grid.exportExcel')}
                >
                  <Download size={16} className="me-1" aria-hidden />
                  {t('grid.exportExcel')}
                </button>
              )}
            </>
          )}
        </div>
      )}
      <AgGridProvider modules={modules}>
        <div
          className={`data-grid-container${rowSelection === 'multiple' ? ' data-grid-container--has-selection-column' : ''}`}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="data-grid-body" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {loading && (
              <div className="data-grid-loading-overlay" aria-live="polite" aria-busy="true">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('grid.loading')}</span>
                </div>
                <span className="data-grid-loading-text">{t('grid.loading')}</span>
              </div>
            )}
            <AgGridReact<TData>
              key={i18n.language}
              ref={gridRef}
              theme={backofficeGridTheme}
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={mergedDefaultColDef}
              singleClickEdit={singleClickEdit}
              stopEditingWhenCellsLoseFocus={stopEditingWhenCellsLoseFocus}
              pagination={footer != null ? false : pagination}
              paginationPageSize={paginationPageSize}
              paginationPageSizeSelector={paginationPageSizeSelector}
              loading={loading}
              localeText={localeText}
              onCellValueChanged={onCellValueChanged}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              getRowId={getRowId}
              rowSelection={resolvedRowSelection}
              selectionColumnDef={selectionColumnDef}
              enableCellTextSelection
              ensureDomOrder
              enableCellSpan={enableCellSpan}
              context={context}
            />
          </div>
          {footer != null && <div className="data-grid-footer">{footer}</div>}
        </div>
      </AgGridProvider>
    </div>
  );
}

export const DataGrid = forwardRef(DataGridInner) as <TData = unknown>(
  props: DataGridProps<TData> & { ref?: React.Ref<DataGridRef> },
) => React.ReactElement;
