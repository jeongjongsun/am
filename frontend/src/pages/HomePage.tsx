import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation('common');

  return (
    <>
      <h2 className="mb-2 lh-sm">{t('home.content_title')}</h2>
      <div className="d-flex flex-center content-min-h">
        <div className="text-center py-9">
          <h1 className="text-body-secondary fw-normal mb-4">{t('home.title')}</h1>
          <p className="text-body-tertiary mb-0">{t('home.description')}</p>
        </div>
      </div>
    </>
  );
}
