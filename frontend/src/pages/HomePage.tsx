import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1 className="h3 mb-3">{t('app_title')}</h1>
      <p className="text-body-secondary mb-0">
        Vite + React + TypeScript, React Query, axios, react-router-dom, react-i18next 기본 구성입니다.
        API는 개발 시 <code>/api</code> 프록시로 Spring Boot 등 백엔드에 전달됩니다.
      </p>
    </div>
  );
}
