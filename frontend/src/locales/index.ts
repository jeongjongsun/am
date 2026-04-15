import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './en/common.json';
import enError from './en/error.json';
import enValidation from './en/validation.json';
import koCommon from './ko/common.json';
import koError from './ko/error.json';
import koValidation from './ko/validation.json';

const LOCALE_KEY = 'app_locale';

function readStoredLocale(): string {
  if (typeof window === 'undefined') return 'ko';
  return window.localStorage.getItem(LOCALE_KEY) ?? 'ko';
}

void i18n.use(initReactI18next).init({
  lng: readStoredLocale(),
  fallbackLng: 'ko',
  defaultNS: 'common',
  ns: ['common', 'error', 'validation'],
  resources: {
    ko: {
      common: koCommon,
      error: koError,
      validation: koValidation,
    },
    en: {
      common: enCommon,
      error: enError,
      validation: enValidation,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export function setAppLocale(lng: string): void {
  void i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_KEY, lng);
  }
}

export default i18n;
