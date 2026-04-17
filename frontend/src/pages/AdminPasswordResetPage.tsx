import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { adminResetUserPassword } from '@/api/adminUsers';
import { showError } from '@/utils/swal';

export function AdminPasswordResetPage() {
  const { t } = useTranslation(['common', 'validation']);
  const [searchParams] = useSearchParams();
  const targetId = useId();
  const [targetUserId, setTargetUserId] = useState('');
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const uid = searchParams.get('userId');
    if (uid) {
      setTargetUserId(uid);
    }
  }, [searchParams]);

  return (
    <div className="mx-auto" style={{ maxWidth: '32rem' }}>
      <h1 className="h4 mb-2">{t('admin_password_reset.title')}</h1>
      <p className="text-body-secondary small mb-4">{t('admin_password_reset.description')}</p>

      <form
        className="card border shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const uid = targetUserId.trim();
          if (!uid) {
            await showError(t('admin_password_reset.error_title'), t('validation:user_id_required'));
            return;
          }
          setIsSubmitting(true);
          setLastTempPassword(null);
          try {
            const res = await adminResetUserPassword(uid);
            if (res.success && res.data) {
              setLastTempPassword(res.data.temporaryPassword);
              return;
            }
            await showError(
              t('admin_password_reset.error_title'),
              res.message ?? t('admin_password_reset.error_default'),
            );
          } catch {
            await showError(t('admin_password_reset.error_title'), t('admin_password_reset.error_default'));
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label" htmlFor={targetId}>
              {t('admin_password_reset.target_label')}
            </label>
            <input
              id={targetId}
              className="form-control"
              type="text"
              autoComplete="username"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('admin_password_reset.submitting') : t('admin_password_reset.submit')}
          </button>
        </div>
      </form>

      {lastTempPassword ? (
        <div className="alert alert-warning mt-4 mb-0" role="status">
          <div className="fw-semibold mb-2">{t('admin_password_reset.result_title')}</div>
          <code className="user-select-all d-block p-2 bg-body-secondary rounded small">{lastTempPassword}</code>
          <p className="small text-body-secondary mt-2 mb-0">{t('admin_password_reset.result_hint')}</p>
        </div>
      ) : null}

      <p className="mt-4 mb-0">
        <Link to="/home" className="btn btn-sm btn-default-visible">
          {t('nav_home')}
        </Link>
      </p>
    </div>
  );
}
