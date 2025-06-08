import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

i18next.use(Backend).init({
  fallbackLng: 'fa',
  lng: 'fa', 
  backend: {
    loadPath: path.join(process.cwd(), 'src/localizations/{{lng}}/translation.json'),
  },
  interpolation: {
    escapeValue: false, 
  },
  debug: false,
});

export default i18next;
