<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchRegisterPolicy,
  resetPasswordWithEmailCode,
  sendPasswordResetEmailCode,
  sendRegisterEmailCode,
} from '../api/auth'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const mode = ref('login')
const username = ref('')
const email = ref('')
const emailCode = ref('')
const inviteCode = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const sendingCode = ref(false)
const registerPolicy = ref({ allowRegister: true, requireInviteCode: false })
const countdown = ref(0)
let timer = null

const registerDisabledMessage = computed(() => registerPolicy.value.allowRegister ? '' : '当前暂停新用户注册')
const showInviteField = computed(() => registerPolicy.value.requireInviteCode)
const codeButtonText = computed(() => {
  if (sendingCode.value) return '发送中...'
  if (countdown.value > 0) return `${countdown.value}s 后重发`
  return '发送验证码'
})
const isRegisterMode = computed(() => mode.value === 'register')
const isForgotMode = computed(() => mode.value === 'forgot')

function resetTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function resetForm() {
  username.value = ''
  email.value = ''
  emailCode.value = ''
  inviteCode.value = ''
  password.value = ''
  error.value = ''
  countdown.value = 0
  resetTimer()
}

function switchMode(nextMode) {
  mode.value = nextMode
  resetForm()
}

function startCountdown() {
  countdown.value = 60
  resetTimer()
  timer = setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      resetTimer()
      return
    }
    countdown.value -= 1
  }, 1000)
}

async function loadRegisterPolicy() {
  registerPolicy.value = await fetchRegisterPolicy()
}

async function submit() {
  loading.value = true
  error.value = ''

  try {
    if (mode.value === 'login') {
      await userStore.login(username.value, password.value)
      router.push('/create')
      return
    }

    if (mode.value === 'forgot') {
      await resetPasswordWithEmailCode({
        email: email.value,
        emailCode: emailCode.value,
        password: password.value,
      })
      switchMode('login')
      error.value = '密码已重置，请重新登录'
      return
    }

    if (!registerPolicy.value.allowRegister) {
      throw new Error('当前暂停新用户注册')
    }

    await userStore.register({
      username: username.value,
      email: email.value,
      emailCode: emailCode.value,
      inviteCode: inviteCode.value,
      password: password.value,
    })
    router.push('/create')
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || '提交失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function sendCode() {
  if (sendingCode.value || countdown.value > 0) return
  sendingCode.value = true
  error.value = ''

  try {
    if (mode.value === 'forgot') {
      await sendPasswordResetEmailCode({ receiveEmail: email.value, bizType: 'findPwd' })
    } else {
      await sendRegisterEmailCode({ receiveEmail: email.value, bizType: 'register' })
    }
    startCountdown()
  } catch (err) {
    error.value = err?.response?.data?.message || '验证码发送失败，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

onMounted(loadRegisterPolicy)
</script>

<template>
  <div class="shell login-shell">
    <section class="card login-card">
      <div class="login-switch">
        <button type="button" class="switch-chip" :class="{ active: mode === 'login' }" @click="switchMode('login')">登录账号</button>
        <button type="button" class="switch-chip" :class="{ active: mode === 'register' }" @click="switchMode('register')">注册账号</button>
        <button type="button" class="switch-chip" :class="{ active: mode === 'forgot' }" @click="switchMode('forgot')">忘记密码</button>
      </div>

      <div class="login-hero">
        <img src="/lcode-image-logo.png" alt="Lcode-image logo" class="login-logo" />
        <div>
          <p class="login-eyebrow">普通用户入口</p>
          <h1>{{ mode === 'login' ? '登录你的账号' : mode === 'register' ? '创建你的账号' : '找回你的密码' }}</h1>
          <p class="muted">
            {{ mode === 'forgot'
              ? '输入注册邮箱、邮箱验证码和新密码，即可重置当前账号密码。'
              : '登录后，你的个人图片 API 地址、身份令牌和历史记录都会绑定到账号，不再依赖浏览器缓存。' }}
          </p>
        </div>
      </div>

      <label v-if="!isForgotMode" class="login-field">
        <span>用户名</span>
        <input v-model="username" class="input" placeholder="至少 3 个字符" autocomplete="username" />
      </label>

      <template v-if="isRegisterMode || isForgotMode">
        <p v-if="isRegisterMode && registerDisabledMessage" class="register-disabled">{{ registerDisabledMessage }}</p>

        <label class="login-field">
          <span>邮箱</span>
          <input v-model="email" class="input" type="email" placeholder="请输入可接收验证码的邮箱" autocomplete="email" :disabled="isRegisterMode && !registerPolicy.allowRegister" />
        </label>

        <label class="login-field">
          <span>邮箱验证码</span>
          <div class="code-row">
            <input v-model="emailCode" class="input" placeholder="请输入 6 位验证码" :disabled="isRegisterMode && !registerPolicy.allowRegister" />
            <button class="button-secondary code-button" type="button" :disabled="(isRegisterMode && !registerPolicy.allowRegister) || !email.trim() || sendingCode || countdown > 0" @click="sendCode">
              {{ codeButtonText }}
            </button>
          </div>
        </label>

        <label v-if="showInviteField && isRegisterMode" class="login-field">
          <span>邀请码</span>
          <input v-model="inviteCode" class="input" placeholder="当前注册必须填写邀请码" :disabled="!registerPolicy.allowRegister" />
        </label>
      </template>

      <label class="login-field">
        <span>{{ isForgotMode ? '新密码' : '密码' }}</span>
        <input v-model="password" class="input" type="password" placeholder="至少 6 个字符" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" :disabled="isRegisterMode && !registerPolicy.allowRegister" />
      </label>

      <p v-if="error" class="error-text">{{ error }}</p>

      <button class="button-primary" type="button" :disabled="loading || (isRegisterMode && !registerPolicy.allowRegister)" @click="submit">
        {{ loading ? '提交中...' : mode === 'login' ? '登录并继续' : mode === 'register' ? '注册并继续' : '重置密码' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.login-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: min(560px, 100%);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-switch {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.switch-chip {
  min-height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: var(--color-card-muted);
  color: var(--color-text-secondary);
}

.switch-chip.active {
  background: var(--color-primary-soft);
  color: var(--color-text);
}

.login-hero {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 6px;
}

.login-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 255, 0.92));
  border: 1px solid rgba(120, 130, 170, 0.16);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  padding: 8px;
}

.login-eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.login-hero h1,
.login-hero p {
  margin-top: 0;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 136px;
  gap: 12px;
}

.code-button {
  min-height: 48px;
}

.register-disabled {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--color-card-muted);
  color: var(--color-text-secondary);
}

.error-text {
  margin: 0;
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .login-shell {
    padding: 16px;
  }

  .login-card {
    padding: 20px;
  }

  .login-hero,
  .code-row {
    grid-template-columns: 1fr;
  }
}
</style>
