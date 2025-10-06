

import { SITE_CONFIG } from './baseConfig';





export default function initPageTitle() {
  // 延迟到配置可用后再设置标题，避免暴露默认占位
  try {
    if (SITE_CONFIG && SITE_CONFIG.siteName) {
      document.title = SITE_CONFIG.siteName;
      return;
    }
  } catch (e) {}

  // 若首次未取到，短延迟重试一次
  setTimeout(() => {
    try {
      if (SITE_CONFIG && SITE_CONFIG.siteName) {
        document.title = SITE_CONFIG.siteName;
      }
    } catch (e) {}
  }, 50);
}
