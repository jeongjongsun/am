import { AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { backofficeGridTheme } from '@/components/grid/backofficeGridTheme';
import { AG_GRID_LOCALE_KO } from '@/components/grid/agGridLocaleKo';
import '@/components/grid/DataGrid.css';
import { useAgGridViewportHeight } from '@/components/grid/useAgGridViewportHeight';
import {
  createCommonCodeGroup,
  createCommonCodeItem,
  fetchCommonCodeGroups,
  fetchCommonCodeItems,
  updateCommonCodeRow,
  type CommonCodeGroupDto,
  type CommonCodeItemDto,
} from '@/api/commonCodeAdmin';
import { DataGridPaginationFooter } from '@/components/grid';
import { useAuthMe } from '@/hooks/useAuthMe';
import { showError } from '@/utils/swal';

const NAME_KEYS = ['ko', 'en', 'ja', 'vi'] as const;

type NameFormFields = {
  nm_ko: string;
  nm_en: string;
  nm_ja: string;
  nm_vi: string;
};

type GroupFormState = {
  groupId: string;
  useYn: 'Y' | 'N';
  dispSeq: string | number;
} & NameFormFields;

type ItemFormState = {
  subCd: string;
  useYn: 'Y' | 'N';
  dispSeq: string | number;
} & NameFormFields;

export type CommonGridRow = {
  rowKey: string;
  kind: 'GROUP' | 'ITEM';
  groupId: string;
  subCd?: string;
  codeNm: Record<string, string>;
  useYn: string;
  dispSeq: number;
  updatedAt?: string | null;
  groupDto?: CommonCodeGroupDto;
  itemDto?: CommonCodeItemDto;
};

/** 구분·사용·순서 열 헤더·셀 가운데 정렬 */
const COMMON_CODE_GRID_CENTER: Pick<ColDef<CommonGridRow>, 'headerStyle' | 'cellStyle'> = {
  headerStyle: { textAlign: 'center' },
  cellStyle: { textAlign: 'center' },
};

export type CommonGridContext = {
  expandedIds: string[];
  toggleExpand: (groupId: string) => void;
  openChildModal: (groupId: string) => void;
  openEditGroup: (g: CommonCodeGroupDto) => void;
  openEditItem: (groupId: string, item: CommonCodeItemDto) => void;
  t: TFunction;
  lang: string;
};

function emptyNameFields(): NameFormFields {
  return { nm_ko: '', nm_en: '', nm_ja: '', nm_vi: '' };
}

function labelForLocale(codeNm: Record<string, string>, lang: string): string {
  const v = codeNm[lang] ?? codeNm.ko ?? codeNm.en ?? Object.values(codeNm)[0];
  return v ?? '';
}

function codeNmFromNameFields(f: NameFormFields): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of NAME_KEYS) {
    const v = f[`nm_${k}`].trim();
    if (v) {
      out[k] = v;
    }
  }
  return out;
}

function namesFromRecord(codeNm: Record<string, string>): NameFormFields {
  return {
    nm_ko: codeNm.ko ?? '',
    nm_en: codeNm.en ?? '',
    nm_ja: codeNm.ja ?? '',
    nm_vi: codeNm.vi ?? '',
  };
}

function matchesText(hay: string, q: string): boolean {
  return hay.toLowerCase().includes(q);
}

function groupMatchesQuery(g: CommonCodeGroupDto, q: string): boolean {
  if (matchesText(g.groupId, q)) {
    return true;
  }
  return Object.values(g.codeNm).some((v) => matchesText(v, q));
}

function itemMatchesQuery(it: CommonCodeItemDto, q: string): boolean {
  if (matchesText(it.subCd, q)) {
    return true;
  }
  return Object.values(it.codeNm).some((v) => matchesText(v, q));
}

/** 첫 열: 대분류·하위 행 수정 */
function ModifyFirstCell(props: ICellRendererParams<CommonGridRow, unknown, CommonGridContext>) {
  const data = props.data;
  const ctx = props.context;
  if (!data || !ctx) {
    return null;
  }
  if (data.kind === 'GROUP' && data.groupDto) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 py-1">
        <button
          type="button"
          className="btn btn-sm btn-default-visible"
          onClick={() => ctx.openEditGroup(data.groupDto!)}
        >
          {ctx.t('common_code.modify')}
        </button>
      </div>
    );
  }
  if (data.kind === 'ITEM' && data.itemDto) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 py-1">
        <button
          type="button"
          className="btn btn-sm btn-default-visible"
          onClick={() => ctx.openEditItem(data.groupId, data.itemDto!)}
        >
          {ctx.t('common_code.modify')}
        </button>
      </div>
    );
  }
  return null;
}

/** 관리 열: 대분류 행에만 펼침·하위 등록 */
function GroupManageCell(props: ICellRendererParams<CommonGridRow, unknown, CommonGridContext>) {
  const data = props.data;
  const ctx = props.context;
  if (!data || data.kind !== 'GROUP' || !ctx) {
    return null;
  }
  const open = ctx.expandedIds.includes(data.groupId);
  return (
    <div className="d-flex align-items-center gap-1 flex-nowrap justify-content-start py-1">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary py-0 px-2"
        aria-expanded={open}
        title={open ? ctx.t('common_code.collapse') : ctx.t('common_code.expand')}
        onClick={() => ctx.toggleExpand(data.groupId)}
      >
        {open ? '−' : '+'}
      </button>
      <button type="button" className="btn btn-sm btn-primary py-0 px-2" onClick={() => ctx.openChildModal(data.groupId)}>
        {ctx.t('common_code.add_child')}
      </button>
    </div>
  );
}

function KindCell(props: ICellRendererParams<CommonGridRow, unknown, CommonGridContext>) {
  const ctx = props.context;
  const k = props.data?.kind;
  if (!ctx) {
    return null;
  }
  const isGroup = k === 'GROUP';
  return (
    <div className="d-flex justify-content-center align-items-center h-100 py-1">
      <span
        className={`badge badge-phoenix ${isGroup ? 'badge-phoenix-primary' : 'badge-phoenix-secondary'}`}
      >
        {isGroup ? ctx.t('common_code.kind_group') : ctx.t('common_code.kind_item')}
      </span>
    </div>
  );
}

function CodeCell(props: ICellRendererParams<CommonGridRow, unknown, CommonGridContext>) {
  const d = props.data;
  const ctx = props.context;
  if (!d || !ctx) {
    return null;
  }
  const text = d.kind === 'GROUP' ? d.groupId : (d.subCd ?? '');
  const pad = d.kind === 'ITEM' ? { paddingLeft: '1.25rem' } : undefined;
  return (
    <code className="small" style={pad}>
      {text}
    </code>
  );
}

function LabelCell(props: ICellRendererParams<CommonGridRow, unknown, CommonGridContext>) {
  const d = props.data;
  const ctx = props.context;
  if (!d || !ctx) {
    return null;
  }
  return <span className="small text-body">{labelForLocale(d.codeNm, ctx.lang)}</span>;
}

export function CommonCodeAdminPage() {
  const { t, i18n } = useTranslation('common');
  const queryClient = useQueryClient();
  const { data: meRes } = useAuthMe();
  const isAdmin = meRes?.success === true && meRes.data?.gradeCd === 'ADMIN';

  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const gridHeight = useAgGridViewportHeight(gridWrapperRef, 24);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const [modal, setModal] = useState<
    | { type: 'none' }
    | { type: 'newGroup' }
    | { type: 'editGroup'; group: CommonCodeGroupDto }
    | { type: 'newItem'; groupId: string }
    | { type: 'editItem'; groupId: string; item: CommonCodeItemDto }
  >({ type: 'none' });

  const [groupForm, setGroupForm] = useState<GroupFormState>({
    groupId: '',
    useYn: 'Y',
    dispSeq: '',
    ...emptyNameFields(),
  });
  const [itemForm, setItemForm] = useState<ItemFormState>({
    subCd: '',
    useYn: 'Y',
    dispSeq: '',
    ...emptyNameFields(),
  });

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const groupsQuery = useQuery({
    queryKey: ['admin', 'common-codes', 'groups'],
    queryFn: fetchCommonCodeGroups,
    enabled: isAdmin,
  });

  const groups = useMemo(
    () => (groupsQuery.data?.success ? (groupsQuery.data.data ?? []) : []),
    [groupsQuery.data],
  );

  const groupIds = useMemo(() => groups.map((g) => g.groupId), [groups]);

  const itemQueries = useQueries({
    queries: groupIds.map((gid) => ({
      queryKey: ['admin', 'common-codes', 'items', gid],
      queryFn: () => fetchCommonCodeItems(gid),
      enabled: isAdmin && expandedIds.includes(gid),
      staleTime: 60_000,
    })),
  });

  const expandedItemsMap = useMemo(() => {
    const m: Record<string, CommonCodeItemDto[]> = {};
    groupIds.forEach((gid, i) => {
      if (!expandedIds.includes(gid)) {
        return;
      }
      const res = itemQueries[i]?.data;
      if (res?.success && res.data) {
        m[gid] = res.data;
      }
    });
    return m;
  }, [groupIds, expandedIds, itemQueries]);

  const searchItemsQuery = useQuery({
    queryKey: ['admin', 'common-codes', 'search-items', debouncedSearch],
    queryFn: async () => {
      const gRes = await fetchCommonCodeGroups();
      const glist = gRes.success && gRes.data ? gRes.data : [];
      const out: Record<string, CommonCodeItemDto[]> = {};
      for (const g of glist) {
        const res = await fetchCommonCodeItems(g.groupId);
        out[g.groupId] = res.success && res.data ? res.data : [];
      }
      return out;
    },
    enabled: isAdmin && debouncedSearch.length > 0,
  });

  const searchItemsMap = searchItemsQuery.data ?? {};

  const toggleExpand = useCallback((groupId: string) => {
    setExpandedIds((prev) =>
      prev.includes(groupId) ? prev.filter((x) => x !== groupId) : [...prev, groupId],
    );
  }, []);

  const openChildModal = useCallback((groupId: string) => {
    setItemForm({
      subCd: '',
      useYn: 'Y',
      dispSeq: '',
      ...emptyNameFields(),
    });
    setModal({ type: 'newItem', groupId });
  }, []);

  const openEditGroup = useCallback((group: CommonCodeGroupDto) => {
    setGroupForm({
      groupId: group.groupId,
      useYn: group.useYn === 'N' ? 'N' : 'Y',
      dispSeq: group.dispSeq,
      ...namesFromRecord(group.codeNm),
    });
    setModal({ type: 'editGroup', group });
  }, []);

  const openEditItem = useCallback((groupId: string, item: CommonCodeItemDto) => {
    setItemForm({
      subCd: item.subCd,
      useYn: item.useYn === 'N' ? 'N' : 'Y',
      dispSeq: item.dispSeq,
      ...namesFromRecord(item.codeNm),
    });
    setModal({ type: 'editItem', groupId, item });
  }, []);

  const openNewGroupModal = useCallback(() => {
    setGroupForm({
      groupId: '',
      useYn: 'Y',
      dispSeq: '',
      ...emptyNameFields(),
    });
    setModal({ type: 'newGroup' });
  }, []);

  const closeModal = useCallback(() => setModal({ type: 'none' }), []);

  const gridContext = useMemo<CommonGridContext>(
    () => ({
      expandedIds,
      toggleExpand,
      openChildModal,
      openEditGroup,
      openEditItem,
      t,
      lang: i18n.language,
    }),
    [expandedIds, toggleExpand, openChildModal, openEditGroup, openEditItem, t, i18n.language],
  );

  const rowData = useMemo((): CommonGridRow[] => {
    const q = debouncedSearch.toLowerCase();
    const sortedGroups = [...groups].sort(
      (a, b) => a.dispSeq - b.dispSeq || a.groupId.localeCompare(b.groupId),
    );
    const rows: CommonGridRow[] = [];

    for (const g of sortedGroups) {
      const itemsForSearch = q ? (searchItemsMap[g.groupId] ?? []) : [];
      const itemsForExpand = expandedItemsMap[g.groupId] ?? [];
      const groupHit = !q || groupMatchesQuery(g, q);
      const anyChildHit =
        q && itemsForSearch.some((it) => itemMatchesQuery(it, q));

      if (q && !groupHit && !anyChildHit) {
        continue;
      }

      rows.push({
        rowKey: `G:${g.groupId}`,
        kind: 'GROUP',
        groupId: g.groupId,
        codeNm: g.codeNm,
        useYn: g.useYn,
        dispSeq: g.dispSeq,
        updatedAt: null,
        groupDto: g,
      });

      const showChildren = q
        ? groupHit || anyChildHit
        : expandedIds.includes(g.groupId);
      if (!showChildren) {
        continue;
      }

      const sourceItems = q ? itemsForSearch : itemsForExpand;
      const sortedItems = [...sourceItems].sort(
        (a, b) => a.dispSeq - b.dispSeq || a.subCd.localeCompare(b.subCd),
      );

      for (const it of sortedItems) {
        if (q && !groupHit && !itemMatchesQuery(it, q)) {
          continue;
        }
        rows.push({
          rowKey: `I:${g.groupId}:${it.subCd}`,
          kind: 'ITEM',
          groupId: g.groupId,
          subCd: it.subCd,
          codeNm: it.codeNm,
          useYn: it.useYn,
          dispSeq: it.dispSeq,
          updatedAt: it.updatedAt,
          itemDto: it,
        });
      }
    }
    return rows;
  }, [
    groups,
    debouncedSearch,
    expandedIds,
    expandedItemsMap,
    searchItemsMap,
  ]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  useEffect(() => {
    const maxP = pageSize > 0 ? Math.max(0, Math.ceil(rowData.length / pageSize) - 1) : 0;
    setPage((p) => Math.min(p, maxP));
  }, [rowData.length, pageSize]);

  const gridLoading =
    groupsQuery.isPending ||
    groupsQuery.isFetching ||
    (debouncedSearch.length > 0 && searchItemsQuery.isFetching);

  const total = rowData.length;
  const first = page <= 0;
  const last = pageSize <= 0 || (page + 1) * pageSize >= total || total === 0;

  const pagedRowData = useMemo(
    () => rowData.slice(page * pageSize, page * pageSize + pageSize),
    [rowData, page, pageSize],
  );

  const onPageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const paginationFooter = useMemo(
    () => (
      <DataGridPaginationFooter
        total={total}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={[100, 1000, 5000, 10000]}
        loading={gridLoading}
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
    [total, page, pageSize, gridLoading, onPageSizeChange, first, last],
  );

  const columnDefs = useMemo<ColDef<CommonGridRow>[]>(
    () => [
      {
        colId: 'modify',
        headerName: t('common_code.col_modify'),
        width: 88,
        minWidth: 80,
        maxWidth: 100,
        pinned: 'left',
        sortable: false,
        filter: false,
        cellRenderer: ModifyFirstCell,
      },
      {
        colId: 'manage',
        headerName: t('common_code.col_manage'),
        width: 168,
        minWidth: 168,
        maxWidth: 200,
        pinned: 'left',
        sortable: false,
        filter: false,
        cellRenderer: GroupManageCell,
      },
      {
        colId: 'kind',
        headerName: t('common_code.col_kind'),
        width: 100,
        sortable: false,
        ...COMMON_CODE_GRID_CENTER,
        cellRenderer: KindCell,
      },
      {
        colId: 'parentGroup',
        headerName: t('common_code.col_parent_group'),
        flex: 1,
        minWidth: 120,
        valueGetter: (p) => p.data?.groupId ?? '',
      },
      {
        colId: 'code',
        headerName: t('common_code.col_code'),
        flex: 1,
        minWidth: 140,
        cellRenderer: CodeCell,
      },
      {
        colId: 'label',
        headerName: t('common_code.col_label'),
        flex: 1.4,
        minWidth: 160,
        cellRenderer: LabelCell,
      },
      {
        field: 'useYn',
        headerName: t('common_code.col_use'),
        width: 80,
        maxWidth: 100,
        ...COMMON_CODE_GRID_CENTER,
      },
      {
        field: 'dispSeq',
        headerName: t('common_code.col_disp'),
        width: 88,
        maxWidth: 110,
        ...COMMON_CODE_GRID_CENTER,
      },
    ],
    [t],
  );

  const defaultColDef = useMemo<ColDef<CommonGridRow>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
    }),
    [],
  );

  const agGridLocaleText = useMemo(
    () => (i18n.language === 'ko' ? AG_GRID_LOCALE_KO : undefined),
    [i18n.language],
  );

  const onSaveGroup = async () => {
    const codeNm = codeNmFromNameFields(groupForm);
    if (!Object.keys(codeNm).length) {
      await showError(t('common_code.error_title'), t('common_code.validation_name_required'));
      return;
    }
    if (modal.type === 'newGroup') {
      const gid = groupForm.groupId.trim();
      if (!gid) {
        await showError(t('common_code.error_title'), t('common_code.validation_group_id'));
        return;
      }
      const disp =
        groupForm.dispSeq === '' || groupForm.dispSeq === null
          ? undefined
          : Number(groupForm.dispSeq);
      const res = await createCommonCodeGroup({
        groupId: gid,
        codeNm,
        useYn: groupForm.useYn,
        dispSeq: Number.isFinite(disp) ? disp : undefined,
      });
      if (!res.success) {
        await showError(t('common_code.error_title'), res.message ?? t('common_code.error_default'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'groups'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'search-items'] });
      closeModal();
      return;
    }
    if (modal.type === 'editGroup') {
      const disp = Number(groupForm.dispSeq);
      if (!Number.isFinite(disp)) {
        await showError(t('common_code.error_title'), t('common_code.validation_disp_seq'));
        return;
      }
      const res = await updateCommonCodeRow('CODE', groupForm.groupId.trim(), {
        codeNm,
        useYn: groupForm.useYn,
        dispSeq: disp,
      });
      if (!res.success) {
        await showError(t('common_code.error_title'), res.message ?? t('common_code.error_default'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'groups'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'search-items'] });
      closeModal();
    }
  };

  const onSaveItem = async () => {
    if (modal.type !== 'newItem' && modal.type !== 'editItem') {
      return;
    }
    const gid = modal.groupId;
    const codeNm = codeNmFromNameFields(itemForm);
    if (!Object.keys(codeNm).length) {
      await showError(t('common_code.error_title'), t('common_code.validation_name_required'));
      return;
    }
    if (modal.type === 'newItem') {
      const sub = itemForm.subCd.trim();
      if (!sub) {
        await showError(t('common_code.error_title'), t('common_code.validation_sub_cd'));
        return;
      }
      const dispRaw =
        itemForm.dispSeq === '' || itemForm.dispSeq === null ? undefined : Number(itemForm.dispSeq);
      const res = await createCommonCodeItem(gid, {
        subCd: sub,
        codeNm,
        useYn: itemForm.useYn,
        dispSeq: Number.isFinite(dispRaw) ? dispRaw : undefined,
      });
      if (!res.success) {
        await showError(t('common_code.error_title'), res.message ?? t('common_code.error_default'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'items', gid] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'search-items'] });
      if (!expandedIds.includes(gid)) {
        setExpandedIds((p) => [...p, gid]);
      }
      closeModal();
      return;
    }
    const disp = Number(itemForm.dispSeq);
    if (!Number.isFinite(disp)) {
      await showError(t('common_code.error_title'), t('common_code.validation_disp_seq'));
      return;
    }
    const res = await updateCommonCodeRow(gid, itemForm.subCd.trim(), {
      codeNm,
      useYn: itemForm.useYn,
      dispSeq: disp,
    });
    if (!res.success) {
      await showError(t('common_code.error_title'), res.message ?? t('common_code.error_default'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'items', gid] });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'search-items'] });
    closeModal();
  };

  const modalOpen = modal.type !== 'none';
  const modalTitle =
    modal.type === 'newGroup'
      ? t('common_code.panel_new_group')
      : modal.type === 'editGroup'
        ? t('common_code.panel_edit_group')
        : modal.type === 'newItem'
          ? t('common_code.panel_new_item')
          : modal.type === 'editItem'
            ? t('common_code.panel_edit_item')
            : '';

  if (!isAdmin) {
    return (
      <div className="py-4">
        <h1 className="h4 mb-2">{t('common_code.page_title')}</h1>
        <p className="text-body-secondary mb-4">{t('common_code.forbidden')}</p>
        <Link to="/home" className="btn btn-sm btn-default-visible">
          {t('nav_home')}
        </Link>
      </div>
    );
  }

  return (
    <AgGridProvider modules={[AllCommunityModule]}>
      <div className="py-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h1 className="h4 mb-1">{t('common_code.page_title')}</h1>
            <p className="text-body-secondary small mb-0">{t('common_code.lead_grid')}</p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button type="button" className="btn btn-sm btn-primary" onClick={openNewGroupModal}>
              {t('common_code.add_top_group')}
            </button>
          </div>
        </div>

        <div className="card border shadow-sm mb-3">
          <div className="card-body py-3">
            <div className="row g-2 align-items-end">
              <div className="col-md-8 col-lg-9">
                <label className="form-label small mb-1" htmlFor="cc-search">
                  {t('common_code.search_label')}
                </label>
                <input
                  id="cc-search"
                  type="search"
                  className="form-control form-control-sm"
                  placeholder={t('common_code.search_placeholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="col-md-4 col-lg-3 text-md-end">
                {debouncedSearch && searchItemsQuery.isFetching ? (
                  <span className="small text-body-secondary">{t('common_code.search_loading')}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          className="data-grid-wrapper"
          ref={gridWrapperRef}
          style={{
            height: gridHeight,
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          <div
            className="data-grid-container"
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <div className="data-grid-body" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {gridLoading ? (
                <div className="data-grid-loading-overlay" aria-live="polite" aria-busy="true">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common_code.loading')}</span>
                  </div>
                  <span className="data-grid-loading-text">{t('common_code.loading')}</span>
                </div>
              ) : null}
              <AgGridReact<CommonGridRow>
                key={i18n.language}
                theme={backofficeGridTheme}
                localeText={agGridLocaleText}
                rowData={pagedRowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                context={gridContext}
                getRowId={(p) => p.data.rowKey}
                animateRows
                domLayout="normal"
                enableCellTextSelection
                ensureDomOrder
              />
            </div>
            <div className="data-grid-footer">{paginationFooter}</div>
          </div>
        </div>

        {modalOpen ? (
          <>
            <div
              className="modal fade show d-block"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cc-modal-title"
            >
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2 className="modal-title h5" id="cc-modal-title">
                      {modalTitle}
                    </h2>
                    <button type="button" className="btn-close" aria-label={t('common_code.close')} onClick={closeModal} />
                  </div>
                  <div className="modal-body">
                    {(modal.type === 'newGroup' || modal.type === 'editGroup') && (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small" htmlFor="ccf-group-id">
                            {t('common_code.field_group_id')}
                          </label>
                          <input
                            id="ccf-group-id"
                            className="form-control form-control-sm"
                            disabled={modal.type === 'editGroup'}
                            value={groupForm.groupId}
                            onChange={(e) => setGroupForm((s) => ({ ...s, groupId: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small">{t('common_code.field_use_yn')}</label>
                          <select
                            className="form-select form-select-sm"
                            value={groupForm.useYn}
                            onChange={(e) =>
                              setGroupForm((s) => ({ ...s, useYn: e.target.value === 'N' ? 'N' : 'Y' }))
                            }
                          >
                            <option value="Y">Y</option>
                            <option value="N">N</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small">{t('common_code.field_disp_seq')}</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={groupForm.dispSeq}
                            onChange={(e) => setGroupForm((s) => ({ ...s, dispSeq: e.target.value }))}
                          />
                        </div>
                        {NAME_KEYS.map((k) => (
                          <div className="col-md-6" key={k}>
                            <label className="form-label small text-uppercase">{k}</label>
                            <input
                              className="form-control form-control-sm"
                              value={groupForm[`nm_${k}`]}
                              onChange={(e) => setGroupForm((s) => ({ ...s, [`nm_${k}`]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {(modal.type === 'newItem' || modal.type === 'editItem') && (
                      <div className="row g-3">
                        <div className="col-12">
                          <p className="small text-body-secondary mb-0">
                            {t('common_code.modal_item_parent', { id: modal.groupId })}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small" htmlFor="ccf-item-sub">
                            {t('common_code.field_sub_cd')}
                          </label>
                          <input
                            id="ccf-item-sub"
                            className="form-control form-control-sm"
                            disabled={modal.type === 'editItem'}
                            value={itemForm.subCd}
                            onChange={(e) => setItemForm((s) => ({ ...s, subCd: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small">{t('common_code.field_use_yn')}</label>
                          <select
                            className="form-select form-select-sm"
                            value={itemForm.useYn}
                            onChange={(e) =>
                              setItemForm((s) => ({ ...s, useYn: e.target.value === 'N' ? 'N' : 'Y' }))
                            }
                          >
                            <option value="Y">Y</option>
                            <option value="N">N</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small">{t('common_code.field_disp_seq')}</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={itemForm.dispSeq}
                            onChange={(e) => setItemForm((s) => ({ ...s, dispSeq: e.target.value }))}
                          />
                        </div>
                        {NAME_KEYS.map((k) => (
                          <div className="col-md-6" key={`i-${k}`}>
                            <label className="form-label small text-uppercase">{k}</label>
                            <input
                              className="form-control form-control-sm"
                              value={itemForm[`nm_${k}`]}
                              onChange={(e) => setItemForm((s) => ({ ...s, [`nm_${k}`]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-sm btn-default-visible" onClick={closeModal}>
                      {t('common_code.cancel')}
                    </button>
                    {modal.type === 'newGroup' || modal.type === 'editGroup' ? (
                      <button type="button" className="btn btn-sm btn-primary" onClick={onSaveGroup}>
                        {t('common_code.save')}
                      </button>
                    ) : null}
                    {modal.type === 'newItem' || modal.type === 'editItem' ? (
                      <button type="button" className="btn btn-sm btn-primary" onClick={onSaveItem}>
                        {t('common_code.save')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" aria-hidden="true" />
          </>
        ) : null}
      </div>
    </AgGridProvider>
  );
}
