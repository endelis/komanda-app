import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import lv from './lv.js'
import en from './en.js'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      lv,
      en,
    },
    lng: 'lv',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
