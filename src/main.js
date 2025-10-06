import disableDevtool from "disable-devtool";

const isProd = process.env.NODE_ENV === "production";
const enableConfigJS = process.env.VUE_APP_CONFIGJS == "true";
let enableAntiDebugging = process.env.VUE_APP_DEBUGGING == "true";

(async () => {
  try {
    if (!isProd || !enableConfigJS) {
      const res = await import('./config/index.js');
      if (typeof window !== 'undefined') {
        window.EZ_CONFIG = res.config || res.default || res;
        try {
          if (window.EZ_CONFIG && window.EZ_CONFIG.SECURITY_CONFIG && typeof window.EZ_CONFIG.SECURITY_CONFIG.enableAntiDebugging === 'boolean') {
            enableAntiDebugging = window.EZ_CONFIG.SECURITY_CONFIG.enableAntiDebugging;
          }
        } catch (_) {}
      }
    }
    
    // 反调试逻辑
    if (isProd && enableAntiDebugging) {
      disableDevtool()
    }
    
    // ⚠️ 确保在 config 加载后再初始化应用
    await import('./appInit.js');
  } catch (error) {
    console.error(error);
  }
})();

