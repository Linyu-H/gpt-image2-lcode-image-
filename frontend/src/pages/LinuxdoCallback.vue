<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toastStore = useToastStore()

const status = ref('loading')
const message = ref('正在完成 Linux.do 登录…')

onMounted(async () => {
  const errorMessage = String(route.query.error || '')
  if (errorMessage) {
    status.value = 'error'
    message.value = errorMessage
    toastStore.error(errorMessage)
    setTimeout(() => router.replace('/login'), 1500)
    return
  }

  const token = String(route.query.token || '')
  const returnTo = String(route.query.returnTo || '/create') || '/create'

  if (!token) {
    status.value = 'error'
    message.value = '登录回调缺少令牌'
    toastStore.error('登录回调缺少令牌')
    setTimeout(() => router.replace('/login'), 1500)
    return
  }

  try {
    await userStore.loginWithToken(token)
    status.value = 'success'
    message.value = '登录成功，正在跳转…'
    toastStore.success('Linux.do 登录成功')
    router.replace(returnTo)
  } catch (err) {
    status.value = 'error'
    message.value = err?.response?.data?.message || err?.message || '登录失败，请重试'
    toastStore.error(message.value)
    setTimeout(() => router.replace('/login'), 1500)
  }
})
</script>

<template>
  <div class="oauth-callback">
    <div class="card oauth-card">
      <img src="https://wiki.linux.do/_next/image?url=%2Ffavicon.ico&w=32&q=75" alt="Linux.do" class="oauth-logo" />
      <p :class="['oauth-message', status]">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.oauth-callback {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.oauth-card {
  width: min(420px, 100%);
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.oauth-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.oauth-message {
  margin: 0;
  color: var(--color-text-secondary);
}

.oauth-message.success {
  color: var(--color-primary);
}

.oauth-message.error {
  color: var(--color-danger);
}
</style>
