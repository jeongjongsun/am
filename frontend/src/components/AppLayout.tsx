import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import { logout } from '@/api/auth';
import { useAuthMe } from '@/hooks/useAuthMe';
import { setAppLocale } from '@/locales';

export function AppLayout() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: meRes } = useAuthMe();
  const isAdmin = meRes?.success === true && meRes.data?.gradeCd === 'ADMIN';

  return (
    <div className="min-vh-100 d-flex flex-column">
      <header className="border-bottom bg-body-tertiary py-2 px-3 d-flex align-items-center gap-3 flex-wrap">
        <strong className="me-auto">{t('app_title')}</strong>
        <nav className="d-flex gap-2 align-items-center">
          <Link className="btn btn-sm btn-link" to="/home">
            {t('nav_home')}
          </Link>
          {isAdmin ? (
            <Link className="btn btn-sm btn-link" to="/home/admin/password-reset">
              {t('nav_admin_password_reset')}
            </Link>
          ) : null}
          <button
            type="button"
            className="btn btn-sm btn-link"
            onClick={async () => {
              try {
                await logout();
              } finally {
                await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
                navigate('/login', { replace: true });
              }
            }}
          >
            {t('nav_logout')}
          </button>
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={i18n.language}
            aria-label="Language"
            onChange={(e) => setAppLocale(e.target.value)}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </nav>
      </header>
      <main className="flex-grow-1 p-3">
        <Outlet />
      </main>
    </div>
  );
}
