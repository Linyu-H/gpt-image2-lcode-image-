<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18nStore } from '../stores/i18n'
import { useUserStore } from '../stores/user'

const router = useRouter()
const i18n = useI18nStore()
const userStore = useUserStore()

const links = computed(() => [
  { label: i18n.t('github'), href: 'https://github.com/Linyu-H/gpt-image2-lcode-image-.git' },
  { label: i18n.t('donate'), href: 'https://money.lcode.space' },
])

const userLabel = computed(() => userStore.user?.username || '')
const userAvatar = computed(() => userStore.profile?.avatarUrl || '/lcode-image-logo.png')

function goProfile() {
  router.push('/profile')
}
</script>

<template>
  <div class="floating-stack">
    <nav class="floating-external-nav card" aria-label="外部链接">
      <a
        v-for="link in links"
        :key="link.href"
        class="floating-external-link"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ link.label }}
      </a>
    </nav>

    <button v-if="userStore.isLoggedIn" type="button" class="floating-user-chip card" @click="goProfile">
      <img class="floating-user-avatar" :src="userAvatar" alt="用户头像" />
      <span>{{ userLabel }}</span>
    </button>
  </div>
</template>

<style scoped>
.floating-stack {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.floating-external-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
}

.floating-external-link {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.floating-external-link:hover {
  color: var(--color-text-soft);
  background: var(--color-primary-soft);
}

.floating-user-chip {
  max-width: 220px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 8px;
  border: none;
  border-radius: 999px;
  color: var(--color-text-soft);
}

.floating-user-avatar {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.8);
}

.floating-user-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .floating-stack {
    top: 12px;
    right: 12px;
    max-width: calc(100vw - 24px);
  }

  .floating-external-link {
    min-height: 36px;
    padding: 0 12px;
    font-size: 13px;
  }

  .floating-user-chip {
    max-width: 180px;
  }
}
</style>
