// 内存盾牌令牌，仅存活于进程内，重启即失效

import { SHIELD_CONFIG } from '@/utils/baseConfig';

let inMemoryShieldToken = null;
let inMemoryShieldTokenExpiry = 0;

export const SHIELD_TOKEN_TTL_MS = SHIELD_CONFIG?.tokenTtlMs || (3 * 60 * 60 * 1000); // 3小时

export function hasValidShieldToken() {
  return (
    typeof inMemoryShieldToken === 'string' &&
    inMemoryShieldToken.length > 0 &&
    Date.now() < inMemoryShieldTokenExpiry
  );
}

export function issueShieldToken(ttlMs = SHIELD_TOKEN_TTL_MS) {
  // 简单随机串作为进程内令牌，同时设置前端cookie（仅用于前端持有，不作为后端校验）
  const random = Math.random().toString(36).slice(2) + Date.now().toString(36);
  inMemoryShieldToken = random;
  inMemoryShieldTokenExpiry = Date.now() + Math.max(1000, ttlMs);
  try {
    const expires = new Date(inMemoryShieldTokenExpiry).toUTCString();
    document.cookie = `ez_shield=${encodeURIComponent(random)}; path=/; expires=${expires}; SameSite=Lax`;
    // 同步写入过期时间，便于前端校验有效性
    document.cookie = `ez_shield_exp=${encodeURIComponent(String(inMemoryShieldTokenExpiry))}; path=/; expires=${expires}; SameSite=Lax`;
  } catch (e) {}
  return inMemoryShieldToken;
}

export function clearShieldToken() {
  inMemoryShieldToken = null;
  inMemoryShieldTokenExpiry = 0;
  try {
    document.cookie = 'ez_shield=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'ez_shield_exp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch (e) {}
}

export function getShieldTokenInfo() {
  return {
    token: inMemoryShieldToken,
    expiry: inMemoryShieldTokenExpiry
  };
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

export function hasShieldCookie() {
  try {
    const c = getCookie('ez_shield');
    return typeof c === 'string' && c.length > 0;
  } catch (_) {
    return false;
  }
}

export function hasValidShieldCookie() {
  try {
    const tokenCookie = getCookie('ez_shield');
    if (!(typeof tokenCookie === 'string' && tokenCookie.length > 0)) return false;
    const expStr = getCookie('ez_shield_exp');
    const exp = expStr ? Number(expStr) : 0;
    return Number.isFinite(exp) && exp > Date.now();
  } catch (_) {
    return false;
  }
}

// 若启用预先许可（preclearance），当检测到 Cloudflare 许可 Cookie 时，自动签发内存令牌
// 已移除 preclearance 逻辑


