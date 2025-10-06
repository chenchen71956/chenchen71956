// 登录路由混淆令牌（内存存储，重启即失效）

const THIRTY_MIN_MS = 30 * 60 * 1000;

// token -> { expiry: number, used: boolean }
const tokenStore = new Map();

function generateRandomHex256Bits() {
  // 256-bit = 32 bytes -> 64 hex chars
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function purgeExpiredLoginTokens() {
  const now = Date.now();
  for (const [token, info] of tokenStore.entries()) {
    if (!info || info.expiry <= now || info.used === true) {
      tokenStore.delete(token);
    }
  }
}

export function createLoginObfToken(ttlMs = THIRTY_MIN_MS) {
  purgeExpiredLoginTokens();
  const token = generateRandomHex256Bits();
  tokenStore.set(token, { expiry: Date.now() + Math.max(1000, ttlMs), used: false });
  return token;
}

export function isValidLoginObfToken(token) {
  purgeExpiredLoginTokens();
  const rec = tokenStore.get(token);
  if (!rec) return false;
  if (rec.used === true) return false;
  if (Date.now() >= rec.expiry) return false;
  return true;
}

export function consumeLoginObfToken(token) {
  const rec = tokenStore.get(token);
  if (!rec) return false;
  if (rec.used === true) return false;
  if (Date.now() >= rec.expiry) return false;
  rec.used = true;
  tokenStore.set(token, rec);
  return true;
}

export const LOGIN_OBF_TTL_MS = THIRTY_MIN_MS;





export function navigateToLogin(router, options = {}) {
  try {
    const obf = createLoginObfToken(LOGIN_OBF_TTL_MS);
    const routeObj = { name: 'Login', params: { obf } };
    if (options && options.query) {
      routeObj.query = options.query;
    }
    if (options && options.replace) {
      return router.replace(routeObj);
    }
    return router.push(routeObj);
  } catch (e) {
    try {
      const obf = createLoginObfToken(LOGIN_OBF_TTL_MS);
      window.location.href = `/#/login/${obf}`;
    } catch (_) {}
  }
}