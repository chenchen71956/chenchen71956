import { AUTHORIZED_DOMAINS, SECURITY_CONFIG } from './baseConfig';

export const isDomainAuthorized = () => {
  if (!SECURITY_CONFIG.enableFrontendDomainCheck) {
    return true;
  }

  const currentDomain = window.location.hostname;
  return AUTHORIZED_DOMAINS.includes(currentDomain);
};

export const handleUnauthorizedDomain = () => {
  if (!SECURITY_CONFIG.enableFrontendDomainCheck) {
    return true;
  }

  if (!isDomainAuthorized()) {
    const currentDomain = window.location.hostname;
    // 仅在控制台给出提示，不再盖白屏或阻止应用初始化，避免错误配置导致整站白屏
    try {
      console.warn && console.warn('[EZ-Theme] Unauthorized domain detected:', currentDomain, '\nAllowed domains:', AUTHORIZED_DOMAINS);
    } catch (_) {}
    return true;
  }

  return true;
};
