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
import { useI18nStore } from '../stores/i18n'

const i18n = useI18nStore()

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

const registerDisabledMessage = computed(() => registerPolicy.value.allowRegister ? '' : i18n.t('registrationPaused'))
const showInviteField = computed(() => registerPolicy.value.requireInviteCode)
const codeButtonText = computed(() => {
  if (sendingCode.value) return i18n.t('sending')
  if (countdown.value > 0) return i18n.t('resendAfter', { seconds: countdown.value })
  return i18n.t('sendCode')
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
      error.value = i18n.t('passwordResetDone')
      return
    }

    if (!registerPolicy.value.allowRegister) {
      throw new Error(i18n.t('registrationPaused'))
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
    error.value = err?.response?.data?.message || err?.message || i18n.t('submitFailed')
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
    error.value = err?.response?.data?.message || i18n.t('codeFailed')
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
        <button type="button" class="switch-chip" :class="{ active: mode === 'login' }" @click="switchMode('login')">{{ i18n.t('userLogin') }}</button>
        <button type="button" class="switch-chip" :class="{ active: mode === 'register' }" @click="switchMode('register')">{{ i18n.t('userRegister') }}</button>
        <button type="button" class="switch-chip" :class="{ active: mode === 'forgot' }" @click="switchMode('forgot')">{{ i18n.t('forgotPassword') }}</button>
      </div>

      <div class="login-hero">
        <img src="/lcode-image-logo.png" alt="Lcode-image logo" class="login-logo" />
        <div>
          <p class="login-eyebrow">{{ i18n.t('userEntry') }}</p>
          <h1>{{ mode === 'login' ? i18n.t('loginTitle') : mode === 'register' ? i18n.t('registerTitle') : i18n.t('forgotTitle') }}</h1>
          <p class="muted">
            {{ mode === 'forgot' ? i18n.t('forgotCopy') : i18n.t('loginCopy') }}
          </p>
        </div>
      </div>

      <label v-if="!isForgotMode" class="login-field">
        <span>{{ i18n.t('username') }}</span>
        <input v-model="username" class="input" :placeholder="i18n.t('usernamePlaceholder')" autocomplete="username" />
      </label>

      <template v-if="isRegisterMode || isForgotMode">
        <p v-if="isRegisterMode && registerDisabledMessage" class="register-disabled">{{ registerDisabledMessage }}</p>

        <label class="login-field">
          <span>{{ i18n.t('email') }}</span>
          <input v-model="email" class="input" type="email" :placeholder="i18n.t('emailPlaceholder')" autocomplete="email" :disabled="isRegisterMode && !registerPolicy.allowRegister" />
        </label>

        <label class="login-field">
          <span>{{ i18n.t('emailCode') }}</span>
          <div class="code-row">
            <input v-model="emailCode" class="input" :placeholder="i18n.t('emailCodePlaceholder')" :disabled="isRegisterMode && !registerPolicy.allowRegister" />
            <button class="button-secondary code-button" type="button" :disabled="(isRegisterMode && !registerPolicy.allowRegister) || !email.trim() || sendingCode || countdown > 0" @click="sendCode">
              {{ codeButtonText }}
            </button>
          </div>
        </label>

        <label v-if="showInviteField && isRegisterMode" class="login-field">
          <span>{{ i18n.t('inviteCode') }}</span>
          <input v-model="inviteCode" class="input" :placeholder="i18n.t('inviteCodePlaceholder')" :disabled="!registerPolicy.allowRegister" />
        </label>
      </template>

      <label class="login-field">
        <span>{{ isForgotMode ? i18n.t('newPassword') : i18n.t('password') }}</span>
        <input v-model="password" class="input" type="password" :placeholder="i18n.t('passwordPlaceholder')" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" :disabled="isRegisterMode && !registerPolicy.allowRegister" />
      </label>

      <p v-if="error" class="error-text">{{ error }}</p>

      <button class="button-primary" type="button" :disabled="loading || (isRegisterMode && !registerPolicy.allowRegister)" @click="submit">
        {{ loading ? i18n.t('submitLoading') : mode === 'login' ? i18n.t('loginContinue') : mode === 'register' ? i18n.t('registerContinue') : i18n.t('resetPassword') }}
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
