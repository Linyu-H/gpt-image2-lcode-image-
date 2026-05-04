<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const username = ref('admin')
const password = ref('admin123')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await adminStore.login(username.value, password.value)
    router.push('/admin')
  } catch (err) {
    error.value = err.response?.data?.message || '登录失败'
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
          <p class="login-eyebrow">管理员入口</p>
          <h1>进入控制台</h1>
          <p class="muted">在这里配置共享身份令牌、限流规则和自动清理周期。</p>
        </div>
      </div>
      <input v-model="username" class="input" placeholder="用户名" autocomplete="username" />
      <input v-model="password" class="input" type="password" placeholder="密码" autocomplete="current-password" />
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="button-primary" type="button" :disabled="loading" @click="submit">
        {{ loading ? '登录中...' : '登录后台' }}
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
