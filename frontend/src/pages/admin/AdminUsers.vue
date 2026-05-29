<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { fetchUsers, resetUserPassword, updateUserBanStatus } from '../../api/admin'
import { useI18nStore } from '../../stores/i18n'
import { useToastStore } from '../../stores/toast'

const i18n = useI18nStore()
const toastStore = useToastStore()
const users = ref([])
const currentPage = ref(1)
const pageSize = 20
const passwordDrafts = reactive({})
const resettingUsers = reactive({})
const banningUsers = reactive({})
const loading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(users.value.length / pageSize)))
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return users.value.slice(start, start + pageSize)
})

function normalizeCurrentPage() {
  currentPage.value = Math.min(currentPage.value, totalPages.value)
}

async function loadUsers() {
  users.value = await fetchUsers()
  normalizeCurrentPage()
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
  <AdminLayout>
    <div class="admin-content">
      <div class="admin-header">
        <h1 class="admin-title">{{ i18n.t('adminUsers') }}</h1>
        <p class="admin-subtitle">管理用户账号、重置密码和封禁操作</p>
      </div>

      <div v-if="loading" class="muted loading-copy">Loading...</div>
      <div v-else class="card admin-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th class="index-col">#</th>
                <th>{{ i18n.t('avatar') }}</th>
                <th>{{ i18n.t('username') }}</th>
                <th>{{ i18n.t('email') }}</th>
                <th>{{ i18n.t('status') }}</th>
                <th>{{ i18n.t('resetUserPassword') }}</th>
                <th>{{ i18n.t('banAction') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in pagedUsers" :key="user.id">
                <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
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

          <div v-if="totalPages > 1" class="pagination">
            <button class="button-secondary" type="button" :disabled="currentPage === 1" @click="currentPage -= 1">上一页</button>
            <span class="pagination-copy">{{ currentPage }} / {{ totalPages }}</span>
            <button class="button-secondary" type="button" :disabled="currentPage === totalPages" @click="currentPage += 1">下一页</button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-content {
  max-width: 1600px;
}

.admin-header {
  margin-bottom: 32px;
}

.admin-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.admin-subtitle {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.admin-card {
  padding: 0;
  overflow: hidden;
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
  padding: 14px 16px;
  border-bottom: 1px solid rgba(120, 130, 170, 0.12);
  vertical-align: middle;
  text-align: left;
}

.admin-table th {
  background: var(--color-card-muted);
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.admin-table tbody tr {
  transition: background 0.2s ease;
}

.admin-table tbody tr:hover {
  background: var(--color-card-hover, rgba(120, 130, 170, 0.06));
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

.index-col {
  width: 56px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.index-col {
  width: 56px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 24px;
}

.pagination-copy {
  color: var(--color-text-secondary);
  font-size: 14px;
  min-width: 80px;
  text-align: center;
  font-weight: 500;
}

.admin-avatar {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  background: var(--color-card-muted);
  border: 2px solid var(--color-card-border, rgba(120, 130, 170, 0.12));
}

.inline-actions {
  display: flex;
  gap: 12px;
  min-width: 300px;
  align-items: center;
}

.inline-actions {
  display: flex;
  gap: 12px;
  min-width: 300px;
  align-items: center;
}

.loading-copy {
  padding: 32px 0;
  text-align: center;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .admin-card {
    padding: 0;
  }

  .admin-title {
    font-size: 24px;
  }

  .inline-actions {
    min-width: 240px;
    flex-direction: column;
    align-items: stretch;
  }

  .pagination {
    justify-content: center;
    flex-wrap: wrap;
  }

  .admin-table th,
  .admin-table td {
    padding: 12px;
    font-size: 14px;
  }
}
</style>
