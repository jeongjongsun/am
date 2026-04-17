import type { CellValueChangedEvent, ColDef, ICellRendererParams } from 'ag-grid-community';
import { isAxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { patchAdminCorporation, fetchAdminCorporationList } from '@/api/adminCorporations';
import { DataGrid, DataGridPaginationFooter } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuthMe } from '@/hooks/useAuthMe';
import type { ApiErrorResponse } from '@/types/api';
import type { AdminCorporationListItem, AdminCorporationUpdateRequest } from '@/types/corporationList';
import { showError } from '@/utils/swal';

type CorpGridContext = {
  page: number;
  pageSize: number;
};

const centerHeaderAndCell = { headerClass: 'text-center', cellClass: 'text-center' } as const;

const EDITABLE_FIELDS = new Set([
  'corporationNm',
  'businessNo',
  'ceoNm',
  'address',
  'telNo',
  'faxNo',
  'email',
  'homepageUrl',
  'remark',
  'active',
]);

function formatDt(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function RowNumCell(
  props: ICellRendererParams<AdminCorporationListItem, unknown, CorpGridContext>,
) {
  const ctx = props.context;
  const idx = props.node?.rowIndex;
  if (ctx == null || idx == null) return null;
  return <span>{ctx.page * ctx.pageSize + idx + 1}</span>;
}

function rowToUpdateBody(row: AdminCorporationListItem): AdminCorporationUpdateRequest {
  const opt = (s: string | null | undefined) => {
    if (s == null) return null;
    const t = s.trim();
    return t === '' ? null : t;
  };
  return {
    corporationNm: (row.corporationNm ?? '').trim(),
    businessNo: opt(row.businessNo),
    ceoNm: opt(row.ceoNm),
    address: opt(row.address),
    telNo: opt(row.telNo),
    faxNo: opt(row.faxNo),
    email: opt(row.email),
    homepageUrl: opt(row.homepageUrl),
    remark: opt(row.remark),
    active: row.active === true,
  };
}

function shallowCopyRows(items: AdminCorporationListItem[]): AdminCorporationListItem[] {
  return items.map((r) => ({ ...r }));
}

export function CorporationListPage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { data: meRes } = useAuthMe();
  const isAdmin = meRes?.success === true && meRes.data?.gradeCd === 'ADMIN';

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);
  const [sort] = useState('corporationCd,ASC');
  const [isSaving, setIsSaving] = useState(false);

  const listQuery = useQuery({
    queryKey: ['admin', 'corporations', 'list', page, pageSize, sort],
    queryFn: () => fetchAdminCorporationList({ page, size: pageSize, sort }),
    enabled: isAdmin,
  });

  const paged = listQuery.data?.success ? listQuery.data.data : null;
  const rowData = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const first = paged?.first ?? true;
  const last = paged?.last ?? true;

  const gridRowData = useMemo(() => shallowCopyRows(rowData), [rowData]);

  const gridContext = useMemo<CorpGridContext>(() => ({ page, pageSize }), [page, pageSize]);

  const onCellValueChanged = useCallback(
    async (e: CellValueChangedEvent<AdminCorporationListItem>) => {
      const field = e.colDef.field;
      if (!field || !EDITABLE_FIELDS.has(field) || e.data == null) return;
      if (Object.is(e.newValue, e.oldValue)) return;

      setIsSaving(true);
      try {
        const res = await patchAdminCorporation(e.data.corporationCd, rowToUpdateBody(e.data));
        if (!res.success) {
          await showError(
            t('corporations_page.save_error_title'),
            res.message ?? t('corporations_page.save_error_default'),
          );
          await queryClient.invalidateQueries({ queryKey: ['admin', 'corporations', 'list'] });
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ['admin', 'corporations', 'list'] });
      } catch (err) {
        let msg = t('corporations_page.save_error_default');
        if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
          const body = err.response.data as ApiErrorResponse;
          if (body.message) msg = body.message;
        }
        await showError(t('corporations_page.save_error_title'), msg);
        await queryClient.invalidateQueries({ queryKey: ['admin', 'corporations', 'list'] });
      } finally {
        setIsSaving(false);
      }
    },
    [queryClient, t],
  );

  const columnDefs = useMemo<ColDef<AdminCorporationListItem>[]>(
    () => [
      {
        colId: 'rowNum',
        headerName: t('corporations_page.col_row_num'),
        width: 72,
        maxWidth: 88,
        sortable: false,
        filter: false,
        editable: false,
        ...centerHeaderAndCell,
        cellRenderer: RowNumCell,
      },
      {
        field: 'corporationCd',
        headerName: t('corporations_page.col_corporation_cd'),
        width: 120,
        minWidth: 100,
        editable: false,
        ...centerHeaderAndCell,
      },
      {
        field: 'corporationNm',
        headerName: t('corporations_page.col_corporation_nm'),
        minWidth: 160,
        flex: 1.2,
        editable: true,
      },
      {
        field: 'businessNo',
        headerName: t('corporations_page.col_business_no'),
        width: 130,
        editable: true,
        ...centerHeaderAndCell,
      },
      {
        field: 'ceoNm',
        headerName: t('corporations_page.col_ceo_nm'),
        width: 100,
        editable: true,
        ...centerHeaderAndCell,
      },
      {
        field: 'address',
        headerName: t('corporations_page.col_address'),
        minWidth: 200,
        flex: 1.5,
        editable: true,
      },
      {
        field: 'telNo',
        headerName: t('corporations_page.col_tel_no'),
        width: 120,
        editable: true,
        ...centerHeaderAndCell,
      },
      {
        field: 'faxNo',
        headerName: t('corporations_page.col_fax_no'),
        width: 120,
        editable: true,
        ...centerHeaderAndCell,
      },
      {
        field: 'email',
        headerName: t('corporations_page.col_email'),
        minWidth: 160,
        flex: 1,
        editable: true,
      },
      {
        field: 'homepageUrl',
        headerName: t('corporations_page.col_homepage_url'),
        minWidth: 160,
        flex: 1,
        editable: true,
      },
      {
        field: 'remark',
        headerName: t('corporations_page.col_remark'),
        minWidth: 120,
        flex: 1,
        editable: true,
      },
      {
        field: 'active',
        headerName: t('corporations_page.col_active'),
        width: 100,
        editable: true,
        ...centerHeaderAndCell,
        cellDataType: 'boolean',
        cellEditor: 'agCheckboxCellEditor',
        valueFormatter: (p) =>
          p.value === true ? t('corporations_page.active_yes') : t('corporations_page.active_no'),
      },
      {
        field: 'createdAt',
        headerName: t('corporations_page.col_created'),
        minWidth: 150,
        flex: 1,
        editable: false,
        valueFormatter: (p) => formatDt(p.value as string | undefined),
      },
      {
        field: 'updatedAt',
        headerName: t('corporations_page.col_updated'),
        minWidth: 150,
        flex: 1,
        editable: false,
        valueFormatter: (p) => formatDt(p.value as string | undefined),
      },
      {
        field: 'createdBy',
        headerName: t('corporations_page.col_created_by'),
        width: 120,
        editable: false,
        ...centerHeaderAndCell,
      },
      {
        field: 'updatedBy',
        headerName: t('corporations_page.col_updated_by'),
        width: 120,
        editable: false,
        ...centerHeaderAndCell,
      },
    ],
    [t],
  );

  const onPageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const footer = useMemo(
    () => (
      <DataGridPaginationFooter
        total={total}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={[100, 1000, 5000, 10000]}
        loading={listQuery.isFetching}
        onPageSizeChange={onPageSizeChange}
        onFirst={() => setPage(0)}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => (last ? p : p + 1))}
        onLast={() => {
          const tp = pageSize > 0 ? Math.max(0, Math.ceil(total / pageSize) - 1) : 0;
          setPage(tp);
        }}
        first={first}
        last={last}
      />
    ),
    [total, page, pageSize, listQuery.isFetching, onPageSizeChange, first, last],
  );

  if (!isAdmin) {
    return (
      <div className="py-4">
        <h1 className="h4 mb-2">{t('corporations_page.title')}</h1>
        <p className="text-body-secondary mb-4">{t('corporations_page.forbidden')}</p>
        <Link to="/home" className="btn btn-sm btn-default-visible">
          {t('nav_home')}
        </Link>
      </div>
    );
  }

  return (
    <PageLayout title={t('corporations_page.title')}>
      <div className="corporation-list-content">
        <DataGrid<AdminCorporationListItem>
          columnDefs={columnDefs}
          rowData={gridRowData}
          loading={listQuery.isPending || listQuery.isFetching || isSaving}
          pagination={false}
          exportFileName="corporations"
          getRowId={(p) => p.data.corporationCd}
          defaultColDef={{
            sortable: false,
            editable: false,
            filter: true,
          }}
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          onCellValueChanged={onCellValueChanged}
          context={gridContext}
          footer={footer}
        />
      </div>
    </PageLayout>
  );
}
