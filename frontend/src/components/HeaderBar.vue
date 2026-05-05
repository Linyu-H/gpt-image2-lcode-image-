<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import { useUserStore } from '../stores/user'
import { useI18nStore } from '../stores/i18n'

const props = defineProps({
  onOpenApiKey: {
    type: Function,
    default: null,
  },
  onOpenAnnouncement: {
    type: Function,
    default: null,      
  },
  hasAnnouncement: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const i18n = useI18nStore()
const mobileMenuOpen = ref(false)

const navItems = computed(() => [
  { label: i18n.t('navHome'), path: '/' },
  { label: i18n.t('navCreate'), path: '/create' },
  { label: i18n.t('navHistory'), path: '/history' },
  { label: i18n.t('navCommunity'), path: '/community' },
  { label: i18n.t('navLogin'), path: '/login', hidden: userStore.isLoggedIn },
  { label: i18n.t('navAdmin'), path: '/admin' },
].filter((item) => !item.hidden))

const userLabel = computed(() => userStore.user?.username || '')
const userAvatar = computed(() => userStore.profile?.avatarUrl || '/lcode-image-logo.png')

function navigate(path) {
  mobileMenuOpen.value = false
  router.push(path)
}

function goProfile() {
  mobileMenuOpen.value = false
  router.push('/profile')
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
        <p class="muted brand-subtitle">{{ i18n.t('brandSubtitle') }}</p>
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
      <button v-if="hasAnnouncement" type="button" class="button-secondary bell-button action-pill" :aria-label="i18n.t('viewAnnouncement')" @click="onOpenAnnouncement?.()">{{ i18n.t('viewAnnouncement') }}</button>
      <button v-if="userStore.isLoggedIn" type="button" class="button-secondary action-pill" @click="onOpenApiKey?.()">{{ i18n.t('personalConfig') }}</button>
      <button v-if="userStore.isLoggedIn" type="button" class="button-secondary action-pill" @click="logoutUser">{{ i18n.t('logout') }}</button>
      <button type="button" class="button-secondary action-pill" @click="i18n.toggleLocale">{{ i18n.t('language') }}</button>
      <ThemeToggle />
      <button type="button" class="button-secondary mobile-menu action-pill" @click="mobileMenuOpen = !mobileMenuOpen">{{ i18n.t('menu') }}</button>
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
      <button v-if="hasAnnouncement" type="button" class="mobile-link" @click="onOpenAnnouncement?.(); mobileMenuOpen = false">{{ i18n.t('viewAnnouncement') }}</button>
      <button v-if="userStore.isLoggedIn" type="button" class="mobile-link" @click="goProfile">{{ i18n.t('profile') }}</button>
      <button v-if="userStore.isLoggedIn" type="button" class="mobile-link" @click="onOpenApiKey?.(); mobileMenuOpen = false">{{ i18n.t('personalConfig') }}</button>
      <button v-if="userStore.isLoggedIn" type="button" class="mobile-link" @click="logoutUser">{{ i18n.t('logout') }}</button>
      <button type="button" class="mobile-link" @click="i18n.toggleLocale">{{ i18n.t('language') }}</button>
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

.action-pill {
  border-radius: 999px;
}

.bell-button {
  min-width: 44px;
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
