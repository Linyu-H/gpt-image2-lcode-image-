<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../../layouts/AppLayout.vue'
import {
  changeAdminPassword,
  fetchAdminStatus,
  fetchStatistics,
} from '../../api/admin'
import { useAdminStore } from '../../stores/admin'
import { useToastStore } from '../../stores/toast'
import { useI18nStore } from '../../stores/i18n'
import { formatDateTime } from '../../utils/datetime'

const adminStore = useAdminStore()
const toastStore = useToastStore()
const i18n = useI18nStore()

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const status = ref(null)
const statistics = ref(null)
const loading = ref(false)
const passwordSaving = ref(false)
const mustChangePassword = ref(false)

async function loadData() {
  const nextStatus = await fetchAdminStatus()
  status.value = nextStatus
  mustChangePassword.value = nextStatus.mustChangePassword === true || adminStore.mustChangePassword === true

  if (mustChangePassword.value) return

  statistics.value = await fetchStatistics()
}

async function submitPasswordChange() {
  if (passwordForm.newPassword.length < 6) {
    toastStore.error('新密码至少需要 6 个字符')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toastStore.error('两次输入的新密码不一致')
    return
  }

  passwordSaving.value = true
  try {
    await changeAdminPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    mustChangePassword.value = false
    adminStore.markMustChangePassword(false)
    toastStore.success('管理员密码修改成功')
    await loadData()
  } finally {
    passwordSaving.value = false
  }
}

function logout() {
  adminStore.logout()
  location.href = '/admin/login'
}

onMounted(async () => {
  loading.value = true
  try {
    await loadData()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppLayout>
    <div class="admin-shell">
      <section class="card admin-hero">
        <div>
          <p class="admin-eyebrow">{{ i18n.t('adminDashboard') }}</p>
          <h1 class="section-title">{{ i18n.t('adminHeroTitle') }}</h1>
          <p class="muted section-copy">{{ i18n.t('adminHeroCopy') }}</p>
        </div>
        <button class="button-secondary" type="button" @click="logout">{{ i18n.t('adminLogout') }}</button>
      </section>

      <section v-if="mustChangePassword" class="card password-guard">
        <div>
          <p class="admin-eyebrow">首次登录安全校验</p>
          <h2>请先修改管理员密码</h2>
          <p class="muted">当前账号仍在使用默认密码。改密完成前，后台其他管理功能将暂时不可用。</p>
        </div>
        <div class="password-grid">
          <label class="admin-field">
            <span>当前密码</span>
            <input v-model="passwordForm.currentPassword" class="input" type="password" autocomplete="current-password" />
          </label>
          <label class="admin-field">
            <span>新密码</span>
            <input v-model="passwordForm.newPassword" class="input" type="password" autocomplete="new-password" />
          </label>
          <label class="admin-field">
            <span>确认新密码</span>
            <input v-model="passwordForm.confirmPassword" class="input" type="password" autocomplete="new-password" />
          </label>
          <div class="admin-actions">
            <button class="button-primary" type="button" :disabled="passwordSaving" @click="submitPasswordChange">
              {{ passwordSaving ? '保存中...' : '确认修改密码' }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="!mustChangePassword" class="admin-management-links">
        <RouterLink to="/admin/config" class="card admin-management-link">
          <span>{{ i18n.t('adminConfig') }}</span>
        </RouterLink>
        <RouterLink to="/admin/users" class="card admin-management-link">
          <span>{{ i18n.t('adminUsers') }}</span>
        </RouterLink>
        <RouterLink to="/admin/images" class="card admin-management-link">
          <span>{{ i18n.t('adminImages') }}</span>
        </RouterLink>
      </section>

      <div v-if="!mustChangePassword" class="dashboard-grid">
        <section v-if="statistics" class="card admin-card stat-card">
          <h2>图片统计</h2>
          <div class="statistics-grid">
            <div>
              <span class="muted">累计生成</span>
              <strong>{{ statistics?.totalImages ?? 0 }}</strong>
            </div>
            <div>
              <span class="muted">当前有效</span>
              <strong>{{ statistics?.activeImages ?? 0 }}</strong>
            </div>
            <div>
              <span class="muted">今日生成</span>
              <strong>{{ statistics?.todayCount ?? 0 }}</strong>
            </div>
          </div>
        </section>

        <section class="card admin-card stat-card">
          <h2>站点概览</h2>
          <div class="stat-list muted">
            <p>站点 URL：<strong>{{ status?.siteBaseUrl || '-' }}</strong></p>
            <p>图片 API：<strong>{{ status?.imageApiBaseUrl || '-' }}</strong></p>
            <p>允许注册：<strong>{{ status?.allowRegister ? '开启' : '关闭' }}</strong></p>
            <p>每日限流：<strong>{{ status?.dailyLimit ?? '-' }}</strong></p>
            <p>清理周期：<strong>{{ status?.cleanupCron ?? '-' }}</strong></p>
            <p>最后更新时间：<strong>{{ formatDateTime(status?.updatedAt) }}</strong></p>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.admin-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.admin-hero,
.admin-card,
.password-guard {
  padding: 22px;
}

.admin-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.admin-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-management-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.admin-management-link {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  border-radius: 24px;
  color: var(--color-text-soft);
  text-decoration: none;
  font-weight: 700;
}

.admin-management-link:hover {
  background: var(--color-primary-soft);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.admin-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.admin-actions {
  display: flex;
  gap: 10px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.statistics-grid div {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  background: var(--color-card-muted);
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-list p {
  margin: 0;
}

.password-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
  margin-top: 18px;
}

@media (max-width: 1024px) {
  .admin-management-links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-hero,
  .admin-card,
  .password-guard {
    padding: 18px;
  }

  .admin-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .statistics-grid,
  .password-grid {
    grid-template-columns: 1fr;
  }
}
</style>
