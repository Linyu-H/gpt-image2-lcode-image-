<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
import { useI18nStore } from '../../stores/i18n'

const i18n = useI18nStore()

const router = useRouter()
const adminStore = useAdminStore()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await adminStore.login(username.value, password.value)
    router.push('/admin')
  } catch (err) {
    error.value = err.response?.data?.message || i18n.t('adminLoginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="shell login-shell">
    <section class="card login-card">
      <div class="login-hero">
        <img src="/lcode-image-logo.png" alt="Lcode-image logo" class="login-logo" />
        <div>
          <p class="login-eyebrow">{{ i18n.t('adminEntry') }}</p>
          <h1>{{ i18n.t('adminLoginTitle') }}</h1>
          <p class="muted">{{ i18n.t('adminLoginCopy') }}</p>
        </div>
      </div>
      <input v-model="username" class="input" :placeholder="i18n.t('username')" autocomplete="username" />
      <input v-model="password" class="input" type="password" :placeholder="i18n.t('password')" autocomplete="current-password" />
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="button-primary" type="button" :disabled="loading" @click="submit">
        {{ loading ? i18n.t('adminLoggingIn') : i18n.t('adminLoginButton') }}
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
  width: min(520px, 100%);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
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

  .login-hero {
    grid-template-columns: 1fr;
  }
}
</style>
