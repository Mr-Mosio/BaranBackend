import i18n from '../utils/i18n.js';

const i18nMiddleware = (req, res, next) => {
  const lang = req.headers['accept-language'] || 'fa';
  i18n.changeLanguage(lang.split(',')[0]);
  next();
};
export default i18nMiddleware;
