import request from './request';
import { SHIELD_CONFIG } from '@/utils/baseConfig';

// 后端 Turnstile 验证
// 期望后端接收 { token }，返回 { success: boolean }
export function verifyTurnstileOnServer(token) {
  const path = SHIELD_CONFIG?.backendVerifyPath || '/security/turnstile/verify';
  return request.post(path, { token });
}


