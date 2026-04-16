import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { useAuthMe } from '@/hooks/useAuthMe';

export function RootRedirect() {
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

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  if (data?.success === true) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/login" replace />;
}
