<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../../layouts/AppLayout.vue'
import { fetchUsers, resetUserPassword, updateUserBanStatus } from '../../api/admin'
import { useI18nStore } from '../../stores/i18n'
import { useToastStore } from '../../stores/toast'

const i18n = useI18nStore()
const toastStore = useToastStore()
const users = ref([])
const passwordDrafts = reactive({})
const resettingUsers = reactive({})
const banningUsers = reactive({})
const loading = ref(false)

async function loadUsers() {
  users.value = await fetchUsers()
}

function canResetPassword(userId) {
  return (passwordDrafts[userId] || '').trim().length >= 6 && !resettingUsers[userId]
}

async function resetUserPasswordAction(userId) {
  const password = (passwordDrafts[userId] || '').trim()
  if (password.length < 6) return

  resettingUsers[userId] = true
  try {
    await resetUserPassword(userId, password)
    passwordDrafts[userId] = ''
    toastStore.success(i18n.t('userPasswordReset'))
    await loadUsers()
  } finally {
    resettingUsers[userId] = false
  }
}

async function updateUserBanStatusAction(user) {
  const nextIsBanned = !user.isBanned
  if (nextIsBanned && !window.confirm(i18n.t('confirmBan', { username: user.username }))) {
    return
  }

  banningUsers[user.id] = true
  try {
    const result = await updateUserBanStatus(user.id, nextIsBanned)
    toastStore.success(result.message)
    await loadUsers()
  } finally {
    banningUsers[user.id] = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadUsers()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppLayout>
    <div class="admin-page-shell">
      <section class="card admin-card admin-main-card">
        <div class="section-head">
          <div>
            <p class="admin-eyebrow">{{ i18n.t('adminDashboard') }}</p>
            <h1 class="section-title">{{ i18n.t('adminUsers') }}</h1>
          </div>
          <RouterLink to="/admin" class="button-secondary admin-link-button">{{ i18n.t('adminOverview') }}</RouterLink>
        </div>

        <div v-if="loading" class="muted loading-copy">Loading...</div>
        <div v-else class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>{{ i18n.t('avatar') }}</th>
                <th>{{ i18n.t('username') }}</th>
                <th>{{ i18n.t('email') }}</th>
                <th>{{ i18n.t('status') }}</th>
                <th>{{ i18n.t('resetUserPassword') }}</th>
                <th>{{ i18n.t('banAction') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td><img class="admin-avatar" :src="user.avatarUrl || '/lcode-image-logo.png'" alt="用户头像" loading="lazy" /></td>
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.isBanned ? i18n.t('banned') : i18n.t('normal') }}</td>
                <td>
                  <div class="inline-actions">
                    <input v-model="passwordDrafts[user.id]" class="input" type="password" :placeholder="i18n.t('passwordPlaceholder')" />
                    <button class="button-secondary" type="button" :disabled="!canResetPassword(user.id)" @click="resetUserPasswordAction(user.id)">{{ i18n.t('reset') }}</button>
                  </div>
                </td>
                <td>
                  <button class="button-danger" type="button" :disabled="banningUsers[user.id]" @click="updateUserBanStatusAction(user)">
                    {{ user.isBanned ? i18n.t('unbanUser') : i18n.t('banUser') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside class="admin-section-nav card" aria-label="后台导航">
        <RouterLink to="/admin/users" class="admin-section-link active">{{ i18n.t('adminUsers') }}</RouterLink>
        <RouterLink to="/admin/images" class="admin-section-link">{{ i18n.t('adminImages') }}</RouterLink>
      </aside>
    </div>
  </AppLayout>
</template>

<style scoped>
.admin-page-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 18px;
  align-items: start;
}

.admin-card,
.admin-section-nav {
  padding: 22px;
}

.admin-main-card {
  min-width: 0;
}

.admin-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.admin-link-button {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.table-wrap {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(120, 130, 170, 0.16);
  vertical-align: top;
  text-align: left;
}

.admin-avatar {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 14px;
  display: block;
  background: var(--color-card-muted);
}

.inline-actions {
  display: flex;
  gap: 10px;
  min-width: 280px;
}

.admin-section-nav {
  position: sticky;
  top: 124px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-section-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-card-muted);
  color: var(--color-text-secondary);
  text-decoration: none;
}

.admin-section-link.active {
  color: var(--color-text-soft);
  background: var(--color-primary-soft);
}

.loading-copy {
  padding: 24px 0;
}

@media (max-width: 1024px) {
  .admin-page-shell {
    grid-template-columns: 1fr;
  }

  .admin-section-nav {
    position: static;
    order: -1;
    flex-direction: row;
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .admin-card,
  .admin-section-nav {
    padding: 18px;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .inline-actions {
    min-width: 220px;
    flex-direction: column;
  }
}
</style>
