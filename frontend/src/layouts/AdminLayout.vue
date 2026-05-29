<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAdminStore } from '../stores/admin'
import { useI18nStore } from '../stores/i18n'

const route = useRoute()
const adminStore = useAdminStore()
const i18n = useI18nStore()

const isActive = (path) => {
  return route.path === path
}

function logout() {
  adminStore.logout()
  location.href = '/admin/login'
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-sidebar-header">
        <div class="admin-logo">
          <img src="/lcode-image-logo.png" alt="Logo" />
          <span>Lcode Image</span>
        </div>
        <p class="admin-role">{{ i18n.t('adminDashboard') }}</p>
      </div>

      <nav class="admin-nav">
        <RouterLink to="/admin" class="admin-nav-item" :class="{ active: isActive('/admin') }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>{{ i18n.t('adminOverview') }}</span>
        </RouterLink>

        <RouterLink to="/admin/config" class="admin-nav-item" :class="{ active: isActive('/admin/config') }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
          </svg>
          <span>{{ i18n.t('adminConfig') }}</span>
        </RouterLink>

        <RouterLink to="/admin/users" class="admin-nav-item" :class="{ active: isActive('/admin/users') }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{{ i18n.t('adminUsers') }}</span>
        </RouterLink>

        <RouterLink to="/admin/images" class="admin-nav-item" :class="{ active: isActive('/admin/images') }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>{{ i18n.t('adminImages') }}</span>
        </RouterLink>
      </nav>

      <div class="admin-sidebar-footer">
        <RouterLink to="/" class="admin-footer-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>返回首页</span>
        </RouterLink>
        <button class="admin-footer-link" @click="logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>{{ i18n.t('adminLogout') }}</span>
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
}

.admin-sidebar {
  width: 260px;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.admin-sidebar-header {
  padding: 28px 24px 24px;
  border-bottom: 1px solid var(--color-border);
}

.admin-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.admin-logo img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.admin-logo span {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.admin-role {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.admin-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.admin-nav-item:hover {
  background: var(--color-card-muted);
  color: var(--color-text);
}

.admin-nav-item.active {
  background: var(--color-primary);
  color: #fff;
}

.admin-nav-item svg {
  flex-shrink: 0;
}

.admin-sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-footer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 10px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.admin-footer-link:hover {
  background: var(--color-card-muted);
  color: var(--color-text);
}

.admin-footer-link svg {
  flex-shrink: 0;
}

.admin-main {
  flex: 1;
  margin-left: 260px;
  padding: 32px 40px;
  min-height: 100vh;
}

@media (max-width: 1024px) {
  .admin-sidebar {
    width: 220px;
  }

  .admin-main {
    margin-left: 220px;
    padding: 24px 28px;
  }
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .admin-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 12px;
  }

  .admin-nav-item {
    white-space: nowrap;
  }

  .admin-sidebar-footer {
    flex-direction: row;
  }

  .admin-main {
    margin-left: 0;
    padding: 20px;
  }
}
</style>
