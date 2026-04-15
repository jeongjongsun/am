import { useTranslation } from 'react-i18next';

export function LoginPage() {
  const { t } = useTranslation('common');

  return (
    <div className="mx-auto" style={{ maxWidth: '24rem' }}>
      <h1 className="h4 mb-3">{t('nav_login')}</h1>
      <p className="text-body-secondary small">
        세션 로그인 화면은 백엔드 연동 후 구현합니다. (401 시 이 경로로 이동할 수 있도록 axios 인터셉터만
        준비되어 있습니다.)
      </p>
    </div>
  );
}
