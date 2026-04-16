import { useTranslation } from 'react-i18next';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuthMe } from '@/hooks/useAuthMe';

export function RequireAuth() {
  const { t } = useTranslation('common');
  const { isPending, isError, data } = useAuthMe();

  if (isPending) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center gap-3 bg-body-tertiary">
        <div className="spinner-border text-primary" role="status" aria-label={t('login.loading')} />
        <span className="text-body-secondary small">{t('login.loading')}</span>
      </div>
    );
  }

  if (isError || data?.success !== true) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
