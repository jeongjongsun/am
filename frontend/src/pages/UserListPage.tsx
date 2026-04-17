import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { fetchAdminUserList } from '@/api/adminUsers';
import { DataGrid, DataGridPaginationFooter } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuthMe } from '@/hooks/useAuthMe';
import type { AdminUserListItem } from '@/types/userList';

type UsersGridContext = {
  page: number;
  pageSize: number;
};

function formatDt(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function RowNumCell(props: ICellRendererParams<AdminUserListItem, unknown, UsersGridContext>) {
  const ctx = props.context;
  const idx = props.node?.rowIndex;
  if (ctx == null || idx == null) return null;
  return <span>{ctx.page * ctx.pageSize + idx + 1}</span>;
}

function UserIdCell(props: ICellRendererParams<AdminUserListItem>) {
  const id = props.data?.userId;
  if (!id) return null;
  const q = encodeURIComponent(id);
  return (
    <Link to={`/home/admin/password-reset?userId=${q}`} className="text-primary">
      {id}
    </Link>
  );
}

export function UserListPage() {
  const { t } = useTranslation('common');
  const { data: meRes } = useAuthMe();
  const isAdmin = meRes?.success === true && meRes.data?.gradeCd === 'ADMIN';

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);
  const [sort] = useState('userId,ASC');

  const listQuery = useQuery({
    queryKey: ['admin', 'users', 'list', page, pageSize, sort],
    queryFn: () => fetchAdminUserList({ page, size: pageSize, sort }),
    enabled: isAdmin,
  });

  const paged = listQuery.data?.success ? listQuery.data.data : null;
  const rowData = paged?.items ?? [];
  const total = paged?.total ?? 0;
  const first = paged?.first ?? true;
  const last = paged?.last ?? true;

  const gridContext = useMemo<UsersGridContext>(
    () => ({ page, pageSize }),
    [page, pageSize],
  );

  const columnDefs = useMemo<ColDef<AdminUserListItem>[]>(
    () => [
      {
        colId: 'rowNum',
        headerName: t('users_page.col_row_num'),
        width: 72,
        maxWidth: 88,
        sortable: false,
        filter: false,
        cellClass: 'text-end',
        cellRenderer: RowNumCell,
      },
      {
        field: 'userId',
        headerName: t('users_page.col_user_id'),
        minWidth: 120,
        flex: 1,
        cellRenderer: UserIdCell,
      },
      {
        field: 'userNm',
        headerName: t('users_page.col_user_nm'),
        minWidth: 120,
        flex: 1,
      },
      {
        field: 'gradeCd',
        headerName: t('users_page.col_grade'),
        width: 100,
      },
      {
        field: 'userStatus',
        headerName: t('users_page.col_status'),
        width: 100,
      },
      {
        field: 'corporationCd',
        headerName: t('users_page.col_corp'),
        width: 110,
      },
      {
        field: 'emailId',
        headerName: t('users_page.col_email'),
        minWidth: 160,
        flex: 1.2,
      },
      {
        field: 'mobileNo',
        headerName: t('users_page.col_mobile'),
        width: 130,
      },
      {
        field: 'lastLoginDtm',
        headerName: t('users_page.col_last_login'),
        minWidth: 150,
        flex: 1,
        valueFormatter: (p) => formatDt(p.value as string | undefined),
      },
      {
        field: 'authGroup',
        headerName: t('users_page.col_auth_group'),
        width: 140,
      },
      {
        field: 'secondAuthYn',
        headerName: t('users_page.col_second_auth'),
        width: 90,
      },
      {
        field: 'createdAt',
        headerName: t('users_page.col_created'),
        minWidth: 150,
        flex: 1,
        valueFormatter: (p) => formatDt(p.value as string | undefined),
      },
      {
        field: 'updatedAt',
        headerName: t('users_page.col_updated'),
        minWidth: 150,
        flex: 1,
        valueFormatter: (p) => formatDt(p.value as string | undefined),
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
        <h1 className="h4 mb-2">{t('users_page.title')}</h1>
        <p className="text-body-secondary mb-4">{t('users_page.forbidden')}</p>
        <Link to="/home" className="btn btn-sm btn-default-visible">
          {t('nav_home')}
        </Link>
      </div>
    );
  }

  return (
    <PageLayout title={t('users_page.title')} lead={t('users_page.description')}>
      <div className="user-list-content">
        <DataGrid<AdminUserListItem>
          columnDefs={columnDefs}
          rowData={rowData}
          loading={listQuery.isPending || listQuery.isFetching}
          pagination={false}
          exportFileName="users"
          rowSelection="multiple"
          getRowId={(p) => p.data.userId}
          defaultColDef={{
            sortable: false,
          }}
          context={gridContext}
          footer={footer}
        />
      </div>
    </PageLayout>
  );
}
