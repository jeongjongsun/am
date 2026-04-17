import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  createCommonCodeGroup,
  createCommonCodeItem,
  fetchCommonCodeGroups,
  fetchCommonCodeItems,
  saveCommonCodeDisplayOrder,
  updateCommonCodeRow,
  type CommonCodeGroupDto,
  type CommonCodeItemDto,
} from '@/api/commonCodeAdmin';
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

export function CommonCodeAdminPage() {
  const { t, i18n } = useTranslation('common');
  const queryClient = useQueryClient();
  const { data: meRes } = useAuthMe();
  const isAdmin = meRes?.success === true && meRes.data?.gradeCd === 'ADMIN';

  const [groupFilter, setGroupFilter] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [orderSubCds, setOrderSubCds] = useState<string[]>([]);

  const [panel, setPanel] = useState<
    'none' | 'newGroup' | 'editGroup' | 'newItem' | 'editItem'
  >('none');
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

  const groupsQuery = useQuery({
    queryKey: ['admin', 'common-codes', 'groups'],
    queryFn: fetchCommonCodeGroups,
    enabled: isAdmin,
  });

  const itemsQuery = useQuery({
    queryKey: ['admin', 'common-codes', 'items', selectedGroupId],
    queryFn: () => fetchCommonCodeItems(selectedGroupId!),
    enabled: isAdmin && !!selectedGroupId,
  });

  const items = itemsQuery.data?.success ? (itemsQuery.data.data ?? []) : [];

  useEffect(() => {
    if (!itemsQuery.data?.success || !itemsQuery.data.data) {
      setOrderSubCds([]);
      return;
    }
    const sorted = [...itemsQuery.data.data].sort(
      (a, b) => a.dispSeq - b.dispSeq || a.subCd.localeCompare(b.subCd),
    );
    setOrderSubCds(sorted.map((r) => r.subCd));
  }, [itemsQuery.data, selectedGroupId]);

  const itemBySubCd = useMemo(() => {
    const m = new Map<string, CommonCodeItemDto>();
    for (const row of items) {
      m.set(row.subCd, row);
    }
    return m;
  }, [items]);

  const orderedItems: CommonCodeItemDto[] = useMemo(() => {
    const out: CommonCodeItemDto[] = [];
    for (const sub of orderSubCds) {
      const row = itemBySubCd.get(sub);
      if (row) {
        out.push(row);
      }
    }
    return out;
  }, [orderSubCds, itemBySubCd]);

  const filteredGroups = useMemo(() => {
    const list = groupsQuery.data?.success ? (groupsQuery.data.data ?? []) : [];
    const q = groupFilter.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((g) => {
      const idHit = g.groupId.toLowerCase().includes(q);
      const nmHit = Object.values(g.codeNm).some((v) => v.toLowerCase().includes(q));
      return idHit || nmHit;
    });
  }, [groupsQuery.data, groupFilter]);

  const openNewGroup = () => {
    setGroupForm({
      groupId: '',
      useYn: 'Y',
      dispSeq: '',
      ...emptyNameFields(),
    });
    setPanel('newGroup');
  };

  const openEditGroup = (g: CommonCodeGroupDto) => {
    setGroupForm({
      groupId: g.groupId,
      useYn: g.useYn === 'N' ? 'N' : 'Y',
      dispSeq: g.dispSeq,
      ...namesFromRecord(g.codeNm),
    });
    setPanel('editGroup');
  };

  const closePanel = () => setPanel('none');

  const onSaveGroup = async () => {
    const codeNm = codeNmFromNameFields(groupForm);
    if (!Object.keys(codeNm).length) {
      await showError(t('common_code.error_title'), t('common_code.validation_name_required'));
      return;
    }
    if (panel === 'newGroup') {
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
      closePanel();
      return;
    }
    if (panel === 'editGroup') {
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
      closePanel();
    }
  };

  const openNewItem = () => {
    if (!selectedGroupId) {
      return;
    }
    setItemForm({
      subCd: '',
      useYn: 'Y',
      dispSeq: '',
      ...emptyNameFields(),
    });
    setPanel('newItem');
  };

  const openEditItem = (row: CommonCodeItemDto) => {
    setItemForm({
      subCd: row.subCd,
      useYn: row.useYn === 'N' ? 'N' : 'Y',
      dispSeq: row.dispSeq,
      ...namesFromRecord(row.codeNm),
    });
    setPanel('editItem');
  };

  const onSaveItem = async () => {
    if (!selectedGroupId) {
      return;
    }
    const codeNm = codeNmFromNameFields(itemForm);
    if (!Object.keys(codeNm).length) {
      await showError(t('common_code.error_title'), t('common_code.validation_name_required'));
      return;
    }
    if (panel === 'newItem') {
      const sub = itemForm.subCd.trim();
      if (!sub) {
        await showError(t('common_code.error_title'), t('common_code.validation_sub_cd'));
        return;
      }
      const dispRaw =
        itemForm.dispSeq === '' || itemForm.dispSeq === null ? undefined : Number(itemForm.dispSeq);
      const res = await createCommonCodeItem(selectedGroupId, {
        subCd: sub,
        codeNm,
        useYn: itemForm.useYn,
        dispSeq: Number.isFinite(dispRaw) ? dispRaw : undefined,
      });
      if (!res.success) {
        await showError(t('common_code.error_title'), res.message ?? t('common_code.error_default'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'items', selectedGroupId] });
      closePanel();
      return;
    }
    if (panel === 'editItem') {
      const disp = Number(itemForm.dispSeq);
      if (!Number.isFinite(disp)) {
        await showError(t('common_code.error_title'), t('common_code.validation_disp_seq'));
        return;
      }
      const res = await updateCommonCodeRow(selectedGroupId, itemForm.subCd.trim(), {
        codeNm,
        useYn: itemForm.useYn,
        dispSeq: disp,
      });
      if (!res.success) {
        await showError(t('common_code.error_title'), res.message ?? t('common_code.error_default'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'items', selectedGroupId] });
      closePanel();
    }
  };

  const moveItem = useCallback((subCd: string, dir: -1 | 1) => {
    setOrderSubCds((prev) => {
      const i = prev.indexOf(subCd);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const onSaveOrder = async () => {
    if (!selectedGroupId || !orderSubCds.length) {
      return;
    }
    const res = await saveCommonCodeDisplayOrder(selectedGroupId, orderSubCds);
    if (!res.success) {
      await showError(t('common_code.error_title'), res.message ?? t('common_code.error_default'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['admin', 'common-codes', 'items', selectedGroupId] });
  };

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
    <div className="py-3">
      <h1 className="h4 mb-2">{t('common_code.page_title')}</h1>
      <p className="text-body-secondary small mb-4">{t('common_code.lead')}</p>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-body-secondary d-flex justify-content-between align-items-center py-2">
              <span className="fw-semibold small">{t('common_code.groups_title')}</span>
              <button type="button" className="btn btn-sm btn-primary" onClick={openNewGroup}>
                {t('common_code.add_group')}
              </button>
            </div>
            <div className="card-body py-2">
              <input
                type="search"
                className="form-control form-control-sm mb-2"
                placeholder={t('common_code.search_groups')}
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                aria-label={t('common_code.search_groups')}
              />
              {groupsQuery.isPending ? (
                <div className="small text-body-secondary">{t('common_code.loading')}</div>
              ) : groupsQuery.isError ? (
                <div className="small text-danger">{t('common_code.load_error')}</div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredGroups.map((g) => (
                    <div
                      key={g.groupId}
                      className={`list-group-item px-2 py-2 ${selectedGroupId === g.groupId ? 'active' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <button
                          type="button"
                          className={`btn btn-link text-start text-decoration-none p-0 flex-grow-1 ${selectedGroupId === g.groupId ? 'text-white' : ''}`}
                          onClick={() => {
                            setSelectedGroupId(g.groupId);
                            setPanel('none');
                          }}
                        >
                          <div className="fw-semibold small">{g.groupId}</div>
                          <div
                            className={`small ${selectedGroupId === g.groupId ? 'text-white-50' : 'text-body-secondary'}`}
                          >
                            {labelForLocale(g.codeNm, i18n.language)}
                          </div>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm btn-default-visible ${selectedGroupId === g.groupId ? 'border-light text-white' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditGroup(g);
                          }}
                        >
                          {t('common_code.edit')}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredGroups.length === 0 ? (
                    <div className="small text-body-secondary py-2">{t('common_code.no_groups')}</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {!selectedGroupId ? (
            <div className="card border shadow-sm">
              <div className="card-body text-body-secondary small">{t('common_code.select_group_hint')}</div>
            </div>
          ) : (
            <div className="card border shadow-sm">
              <div className="card-header bg-body-secondary d-flex flex-wrap gap-2 justify-content-between align-items-center py-2">
                <span className="fw-semibold small">
                  {t('common_code.items_title', { id: selectedGroupId })}
                </span>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm btn-default-visible" onClick={onSaveOrder}>
                    {t('common_code.save_order')}
                  </button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={openNewItem}>
                    {t('common_code.add_item')}
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="small">
                        {t('common_code.col_order')}
                      </th>
                      <th scope="col" className="small">
                        {t('common_code.col_sub_cd')}
                      </th>
                      <th scope="col" className="small">
                        {t('common_code.col_label')}
                      </th>
                      <th scope="col" className="small">
                        {t('common_code.col_use')}
                      </th>
                      <th scope="col" className="small">
                        {t('common_code.col_disp')}
                      </th>
                      <th scope="col" className="small">
                        {t('common_code.col_actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsQuery.isPending ? (
                      <tr>
                        <td colSpan={6} className="small text-body-secondary px-3 py-3">
                          {t('common_code.loading')}
                        </td>
                      </tr>
                    ) : orderedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="small text-body-secondary px-3 py-3">
                          {t('common_code.no_items')}
                        </td>
                      </tr>
                    ) : (
                      orderedItems.map((row) => (
                        <tr key={row.subCd}>
                          <td className="text-nowrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-default-visible py-0 me-1"
                              aria-label={t('common_code.move_up')}
                              onClick={() => moveItem(row.subCd, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-default-visible py-0"
                              aria-label={t('common_code.move_down')}
                              onClick={() => moveItem(row.subCd, 1)}
                            >
                              ↓
                            </button>
                          </td>
                          <td>
                            <code className="small">{row.subCd}</code>
                          </td>
                          <td className="small">{labelForLocale(row.codeNm, i18n.language)}</td>
                          <td className="small">{row.useYn}</td>
                          <td className="small">{row.dispSeq}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-default-visible"
                              onClick={() => openEditItem(row)}
                            >
                              {t('common_code.edit')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {panel !== 'none' ? (
        <div className="card border shadow-sm mt-4">
          <div className="card-header d-flex justify-content-between align-items-center py-2">
            <span className="fw-semibold small">
              {panel === 'newGroup'
                ? t('common_code.panel_new_group')
                : panel === 'editGroup'
                  ? t('common_code.panel_edit_group')
                  : panel === 'newItem'
                    ? t('common_code.panel_new_item')
                    : t('common_code.panel_edit_item')}
            </span>
            <button type="button" className="btn-close" aria-label={t('common_code.close')} onClick={closePanel} />
          </div>
          <div className="card-body">
            {(panel === 'newGroup' || panel === 'editGroup') && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small" htmlFor="ccf-group-id">
                    {t('common_code.field_group_id')}
                  </label>
                  <input
                    id="ccf-group-id"
                    className="form-control form-control-sm"
                    disabled={panel === 'editGroup'}
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
                <div className="col-12 d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-primary" onClick={onSaveGroup}>
                    {t('common_code.save')}
                  </button>
                  <button type="button" className="btn btn-sm btn-default-visible" onClick={closePanel}>
                    {t('common_code.cancel')}
                  </button>
                </div>
              </div>
            )}

            {(panel === 'newItem' || panel === 'editItem') && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small" htmlFor="ccf-item-sub">
                    {t('common_code.field_sub_cd')}
                  </label>
                  <input
                    id="ccf-item-sub"
                    className="form-control form-control-sm"
                    disabled={panel === 'editItem'}
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
                <div className="col-12 d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-primary" onClick={onSaveItem}>
                    {t('common_code.save')}
                  </button>
                  <button type="button" className="btn btn-sm btn-default-visible" onClick={closePanel}>
                    {t('common_code.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
