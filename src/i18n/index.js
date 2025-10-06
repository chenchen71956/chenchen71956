

import { createI18n } from 'vue-i18n';
// Seed initial messages to avoid raw keys before async loads complete
import zhCN from './locales/zh-CN.js';
import enUS from './locales/en-US.js';

import { SITE_CONFIG, DEFAULT_CONFIG } from '@/utils/baseConfig';

import { checkLoginStatus } from '@/api/auth';



const injectSiteName = (messages) => {

  Object.keys(messages).forEach(locale => {

    if (messages[locale]?.common) {

      messages[locale].common.appName = SITE_CONFIG.siteName;

      if (messages[locale].common.welcome && messages[locale].common.welcome.includes('V2Board Admin')) {

        messages[locale].common.welcome = messages[locale].common.welcome.replace('V2Board Admin', SITE_CONFIG.siteName);

      }

    }

  });

  return messages;

};



const getBrowserLanguage = () => {

  const browserLang = navigator.language || navigator.userLanguage;

  if (browserLang === 'zh-CN') return 'zh-CN';

  if (browserLang === 'vi-VN' || browserLang === 'vi') return 'vi-VN';

  if (browserLang === 'zh-TW' || browserLang === 'zh-HK') return 'zh-TW';

  if (browserLang === 'ja' || browserLang === 'ja-JP') return 'ja-JP';

  if (browserLang === 'ko' || browserLang === 'ko-KR') return 'ko-KR';

  if (browserLang === 'ru' || browserLang === 'ru-RU') return 'ru-RU';

  if (browserLang === 'fa' || browserLang === 'fa-IR') return 'fa-IR';

  

  if (browserLang.startsWith('zh')) return 'zh-CN';

  if (browserLang.startsWith('vi')) return 'vi-VN';

  if (browserLang.startsWith('ja')) return 'ja-JP';

  if (browserLang.startsWith('ko')) return 'ko-KR';

  if (browserLang.startsWith('ru')) return 'ru-RU';

  if (browserLang.startsWith('fa')) return 'fa-IR';

  

  return 'en-US';

};



const getStoredLanguage = () => {

  const storedLanguage = localStorage.getItem('language');

  if (storedLanguage) {

    return storedLanguage;

  }

  // 优先站点默认语言，其次浏览器语言
  if (DEFAULT_CONFIG && DEFAULT_CONFIG.defaultLanguage) {
    return DEFAULT_CONFIG.defaultLanguage;
  }

  return getBrowserLanguage();

};



const supportedLocales = ['zh-CN', 'vi-VN', 'en-US', 'zh-TW', 'ja-JP', 'ko-KR', 'ru-RU', 'fa-IR'];



const loadLocaleMessages = async (isLoggedIn) => {

  const messages = {};

  

  try {

    let indexModule = null;

    

    

    if (isLoggedIn) {

      try {

        indexModule = await import( './locales/index.js');

      } catch (e) {

      }

    } else {

      try {

        indexModule = await import( './locales/auth/index.js');

      } catch (e) {

      }

    }

    

    if (indexModule && indexModule.default) {

      for (const locale of supportedLocales) {

        if (indexModule.default[locale]) {

          messages[locale] = indexModule.default[locale];

        }

      }

    }

    

    // Always merge full locale packs to ensure missing keys (e.g., common.*) are filled
    for (const locale of supportedLocales) {
      try {
        let module = null;
        if (locale === 'zh-CN') {
          module = await import('./locales/zh-CN.js');
        } else if (locale === 'vi-VN') {
          module = await import('./locales/vi-VN.js');
        } else if (locale === 'en-US') {
          module = await import('./locales/en-US.js');
        } else if (locale === 'zh-TW') {
          module = await import('./locales/zh-TW.js');
        } else if (locale === 'ja-JP') {
          module = await import('./locales/ja-JP.js');
        } else if (locale === 'ko-KR') {
          module = await import('./locales/ko-KR.js');
        } else if (locale === 'ru-RU') {
          module = await import('./locales/ru-RU.js');
        } else if (locale === 'fa-IR') {
          module = await import('./locales/fa-IR.js');
        }
        if (module && module.default) {
          const existing = messages[locale] || {};
          messages[locale] = { ...module.default, ...existing };
        }
      } catch (e) {
        if (locale !== 'en-US') {
          try {
            const fallbackModule = await import('./locales/en-US.js');
            if (fallbackModule && fallbackModule.default) {
              const existing = messages[locale] || {};
              messages[locale] = { ...fallbackModule.default, ...existing };
            }
          } catch (fallbackError) {}
        }
      }
    }

  } catch (e) {

  }

  

  return injectSiteName(messages);

};



function getByPath(obj, path) {
  try {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  } catch (_) {
    return undefined;
  }
}

export const tWithFallback = (key) => {
  try {
    const val = i18n.global.t(key);
    if (typeof val === 'string' && val !== key) return val;
  } catch (_) {}
  const zh = getByPath(zhCN, key);
  if (typeof zh === 'string') return zh;
  return key;
};

const i18n = createI18n({

  legacy: false, 
  locale: getStoredLanguage(),

  fallbackLocale: 'zh-CN',

  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }, 
  silentTranslationWarn: true, 

  missingWarn: false, 
  fallbackWarn: false 
});



export const setLanguage = async (lang) => {

  if (!supportedLocales.includes(lang)) {

    lang = 'en-US'; 
  }

  

  const isLoggedIn = checkLoginStatus();

  

  const messages = await loadLocaleMessages(isLoggedIn);

  

  for (const locale in messages) {
    if (messages[locale]) {
      try {
        i18n.global.mergeLocaleMessage(locale, messages[locale]);
      } catch (_) {
        i18n.global.setLocaleMessage(locale, messages[locale]);
      }
    }
  }

  

  i18n.global.locale.value = lang;

  localStorage.setItem('language', lang);

  document.querySelector('html').setAttribute('lang', lang);

  

  updatePageTitle();

  

  setTimeout(() => {

    updatePageTitle();

  }, 300);

  

  return {

    success: true,

    availableLocales: Object.keys(messages)

  };

};



export const updatePageTitle = () => {

  if (window.router?.currentRoute?.value?.meta?.titleKey) {

    const titleKey = window.router.currentRoute.value.meta.titleKey;

    try {
      const translatedTitle = tWithFallback(titleKey);
      document.title = `${translatedTitle} - ${SITE_CONFIG.siteName}`;
    } catch (error) {
      document.title = SITE_CONFIG.siteName;
    }

  } else if (window.router?.currentRoute?.value) {

    document.title = SITE_CONFIG.siteName;

  }

};



export const reloadMessages = async () => {

  const isLoggedIn = checkLoginStatus();

  

  for (const locale of supportedLocales) {

    i18n.global.setLocaleMessage(locale, {});

  }

  

  const messages = await loadLocaleMessages(isLoggedIn);

  

  const currentLang = i18n.global.locale.value;

  

  for (const locale in messages) {
    if (messages[locale]) {
      try {
        i18n.global.mergeLocaleMessage(locale, messages[locale]);
      } catch (_) {
        i18n.global.setLocaleMessage(locale, messages[locale]);
      }
    }
  }

  

  i18n.global.locale.value = currentLang;

  

  updatePageTitle();

  

  setTimeout(() => {

    updatePageTitle();

  }, 300);

  

  return {

    success: true,

    availableLocales: Object.keys(messages)

  };

};



(async () => {

  try {

    const isLoggedIn = checkLoginStatus();

    const initialLang = getStoredLanguage();

    

    const messages = await loadLocaleMessages(isLoggedIn);

    

    for (const locale in messages) {
      if (messages[locale]) {
        try {
          i18n.global.mergeLocaleMessage(locale, messages[locale]);
        } catch (_) {
          i18n.global.setLocaleMessage(locale, messages[locale]);
        }
      }
    }

    

    i18n.global.locale.value = initialLang;

    

    updatePageTitle();

  } catch (error) {

  }

})();



export default i18n;
