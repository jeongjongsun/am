import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';

import { setAppLocale } from '@/locales';

export function AppLayout() {
  const { t, i18n } = useTranslation('common');

  return (
    <div className="min-vh-100 d-flex flex-column">
      <header className="border-bottom bg-body-tertiary py-2 px-3 d-flex align-items-center gap-3 flex-wrap">
        <strong className="me-auto">{t('app_title')}</strong>
        <nav className="d-flex gap-2 align-items-center">
          <Link className="btn btn-sm btn-link" to="/">
            {t('nav_home')}
          </Link>
          <Link className="btn btn-sm btn-link" to="/login">
            {t('nav_login')}
          </Link>
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
