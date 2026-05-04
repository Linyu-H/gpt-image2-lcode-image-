<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import { useUserStore } from '../stores/user'

const props = defineProps({
  onOpenApiKey: {
    type: Function,
    default: null,
  },
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const mobileMenuOpen = ref(false)

const navItems = computed(() => [
  { label: '首页', path: '/' },
  { label: '开始生成', path: '/create' },
  { label: '历史记录', path: '/history' },
  { label: '登录账号', path: '/login', hidden: userStore.isLoggedIn },
  { label: '管理后台', path: '/admin' },
].filter((item) => !item.hidden))

const userLabel = computed(() => userStore.user?.username || '')

function navigate(path) {
  mobileMenuOpen.value = false
  router.push(path)
}

function logoutUser() {
  userStore.logout()
  mobileMenuOpen.value = false
  if (route.path !== '/') {
    router.push('/')
  }
}
</script>

<template>
  <header class="header card">
    <div class="brand" @click="navigate('/')">
      <img src="/lcode-image-logo.png" alt="Lcode-image logo" class="brand-logo" />
      <div class="brand-copy">
        <strong>Lcode-image</strong>
        <p class="muted brand-subtitle">柔和、轻盈、开箱即用的公益 AI 图片生成体验</p>
      </div>
    </div>

    <nav class="nav desktop-nav" aria-label="主导航">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        class="nav-link"
        :class="{ active: route.path === item.path || (item.path === '/admin' && route.path.startsWith('/admin')) }"
        @click="navigate(item.path)"
      >
        {{ item.label }}
      </button>
    </nav>

    <div class="header-actions">
      <span v-if="userStore.isLoggedIn" class="user-pill">{{ userLabel }}</span>
      <button v-if="userStore.isLoggedIn" type="button" class="button-secondary action-pill" @click="onOpenApiKey?.()">个人配置</button>
      <button v-if="userStore.isLoggedIn" type="button" class="button-secondary action-pill" @click="logoutUser">退出账号</button>
      <ThemeToggle />
      <button type="button" class="button-secondary mobile-menu action-pill" @click="mobileMenuOpen = !mobileMenuOpen">菜单</button>
    </div>

    <div v-if="mobileMenuOpen" class="mobile-panel card">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        class="mobile-link"
        @click="navigate(item.path)"
      >
        {{ item.label }}
      </button>
      <button v-if="userStore.isLoggedIn" type="button" class="mobile-link" @click="onOpenApiKey?.(); mobileMenuOpen = false">个人配置</button>
      <button v-if="userStore.isLoggedIn" type="button" class="mobile-link" @click="logoutUser">退出账号</button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 16px;
  z-index: 20;
  margin-bottom: 20px;
  padding: 16px 20px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) auto auto;
  align-items: center;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  min-width: 0;
}

.brand-logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 255, 0.92));
  border: 1px solid rgba(120, 130, 170, 0.16);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  padding: 6px;
}

.brand-copy {
  min-width: 0;
}

.brand-copy strong {
  display: block;
  font-size: 1.05rem;
  color: var(--color-text-soft);
}

.brand-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.45;
}

.nav {
  display: flex;
  justify-content: center;
  gap: 10px;
  min-width: 0;
}

.nav-link,
.mobile-link {
  min-height: 44px;
  padding: 0 14px;
  border: none;
  background: transparent;
  border-radius: 999px;
  color: var(--color-text-secondary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.nav-link.active {
  color: var(--color-text-soft);
  background: var(--color-primary-soft);
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.user-pill {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-card-muted);
  color: var(--color-text-soft);
  font-size: 13px;
}

.action-pill {
  border-radius: 999px;
}

.mobile-menu,
.mobile-panel {
  display: none;
}

@media (max-width: 1024px) {
  .header {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .desktop-nav {
    grid-column: 1 / -1;
    justify-content: flex-start;
    order: 3;
    overflow-x: auto;
    padding-bottom: 2px;
  }
}

@media (max-width: 768px) {
  .header {
    top: 10px;
    padding: 14px;
    grid-template-columns: 1fr;
  }

  .brand {
    align-items: flex-start;
  }

  .brand-logo {
    width: 46px;
    height: 46px;
  }

  .brand-subtitle {
    font-size: 12px;
  }

  .desktop-nav {
    display: none;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .mobile-menu {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-panel {
    display: flex;
    position: relative;
    width: 100%;
    flex-direction: column;
    padding: 10px;
    gap: 6px;
  }

  .mobile-link {
    width: 100%;
    text-align: left;
    background: var(--color-card-muted);
  }
}
</style>
