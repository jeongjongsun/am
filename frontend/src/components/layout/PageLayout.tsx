import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'react-feather';

export interface PageLayoutProps {
  title: ReactNode;
  actions?: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * 공통코드 관리 화면과 동일한 타이틀 블록(h1.h4·부가문구 small)·우측 액션·새로고침.
 * 바깥 `py-3`는 CommonCodeAdminPage 루트와 동일한 상·하 안쪽 여백.
 */
export function PageLayout({ title, actions, lead, children, className = '' }: PageLayoutProps) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const rootClass = ['page-layout', 'py-3', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="page-layout__header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{title}</h1>
          {lead != null ? (
            <p className="text-body-secondary small mb-0">{lead}</p>
          ) : null}
        </div>
        <div className="page-layout__header-right d-flex flex-wrap align-items-center gap-2">
          {actions != null && <div className="page-layout__actions">{actions}</div>}
          <button
            type="button"
            className="btn btn-phoenix-primary btn-sm page-layout__refresh-btn"
            onClick={() => {
              void queryClient.invalidateQueries();
            }}
            title={t('refresh')}
            aria-label={t('refresh')}
          >
            <RefreshCw size={14} />
            <span>{t('refresh')}</span>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
