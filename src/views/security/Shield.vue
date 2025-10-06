<template>
  <div class="shield-page">
    <div class="shield-card">
      <h2>{{ tf('common.verification', '验证') }}</h2>
      <p>{{ tf('common.pleaseCompleteVerification', '请完成验证以继续') }}</p>

      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

      <div id="turnstile-container" ref="turnstileEl"></div>

      <div class="tips">
        <p>{{ tf('common.shieldTips', '本站已启用 Turnstile 保护，如使用拦截器请允许 Cloudflare 小组件。') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { issueShieldToken, SHIELD_TOKEN_TTL_MS } from '@/utils/shieldToken';
import { SHIELD_CONFIG } from '@/utils/baseConfig';
const { t } = useI18n();

const tf = (key, zhFallback) => {
  try {
    const val = t(key);
    return (typeof val === 'string' && val === key) ? zhFallback : val;
  } catch (_) {
    return zhFallback;
  }
};
const route = useRoute();
const router = useRouter();

const siteKey = SHIELD_CONFIG?.turnstileSiteKey || '';
// 硬编码 Turnstile 选项（不再从配置读取）
const theme = 'auto';
const appearance = 'always';
const size = 'normal';
const action = 'shield';
const execution = 'render'; // 或 'execute'
let widgetId = null;
const turnstileEl = ref(null);
const errorMsg = ref('');

async function onVerified(token) {
  try {
    if (!token) {
      errorMsg.value = (t('common.verificationFailed') === 'common.verificationFailed') ? '验证失败，请重试' : t('common.verificationFailed');
      return;
    }
    // 纯前端：Turnstile 回调成功即签发内存令牌
    issueShieldToken(SHIELD_TOKEN_TTL_MS);
    const redirect = route.query.redirect || '/';
    router.replace(redirect);
  } catch (e) {
    errorMsg.value = (t('common.verificationFailed') === 'common.verificationFailed') ? '验证失败，请重试' : t('common.verificationFailed');
  }
}

function ensureTurnstileScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  try {
    if (!siteKey) {
      errorMsg.value = t('common.turnstileSiteKeyMissing') || 'Turnstile siteKey not configured';
      return;
    }
    await ensureTurnstileScript();
      widgetId = window.turnstile.render('#turnstile-container', {
        sitekey: siteKey,
        callback: onVerified,
        theme,
        appearance,
        size,
        action,
        execution,
        'error-callback': (err) => {
          console && console.error && console.error('Turnstile error:', err);
          errorMsg.value = (t('common.verificationFailed') === 'common.verificationFailed') ? '验证失败，请重试' : t('common.verificationFailed');
        },
        'expired-callback': () => {
          // 令牌过期时尝试重置
          try { window.turnstile.reset(widgetId); } catch (e) {}
        }
      });
      if (execution === 'execute') {
        try { window.turnstile.execute('#turnstile-container'); } catch (e) {}
      }
    
  } catch (e) {
    errorMsg.value = e?.message || 'Failed to initialize Turnstile';
  }
});
</script>

<style scoped>
.shield-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.shield-card {
  width: 100%;
  max-width: 480px;
  background: var(--card-bg, rgba(30, 30, 30, 0.8));
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  color: var(--text-color, #fff);
}
.error { color: #ff6b6b; margin-bottom: 12px; }
.tips { opacity: 0.7; margin-top: 12px; font-size: 12px; }
</style>


