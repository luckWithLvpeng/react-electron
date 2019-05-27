import i18n from 'i18next';
// import Backend from 'i18next-xhr-backend';
import Backend from './electron-i18n-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
const path = electron.remote.require('path');
var userStore = new Store({name: "userData"})


// 默认中文
var lang  = userStore.get("language", "ch")

i18n
// load translation using xhr -> see /public/locales
// learn more: https://github.com/i18next/i18next-xhr-backend
    .use(Backend)
    // detect user language
    // // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        backend: {
            loadPath: electron.remote.app.getAppPath() + `${__dirname}/build/locales/{{lng}}/{{ns}}.json`
        },
        fallbackLng: lang,
        debug: false,
        preload: ['en', 'ch'],
        load: 'languageOnly',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        react: {
            wait: true
        }
    });
export default i18n;
