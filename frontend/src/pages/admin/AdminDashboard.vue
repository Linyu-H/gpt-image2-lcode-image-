<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../layouts/AdminLayout.vue'
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
  <AdminLayout>
    <div class="admin-content">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">{{ i18n.t('adminHeroTitle') }}</h1>
          <p class="admin-subtitle">{{ i18n.t('adminHeroCopy') }}</p>
        </div>
      </div>

      <section v-if="mustChangePassword" class="card admin-card password-guard">
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

      <section v-if="!mustChangePassword" class="quick-links">
        <RouterLink to="/admin/config" class="quick-link-card card">
          <div class="quick-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
            </svg>
          </div>
          <h3>{{ i18n.t('adminConfig') }}</h3>
          <p>配置系统参数和上游接口</p>
        </RouterLink>
        <RouterLink to="/admin/users" class="quick-link-card card">
          <div class="quick-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3>{{ i18n.t('adminUsers') }}</h3>
          <p>管理用户账号和权限</p>
        </RouterLink>
        <RouterLink to="/admin/images" class="quick-link-card card">
          <div class="quick-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h3>{{ i18n.t('adminImages') }}</h3>
          <p>查看和管理生成的图片</p>
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
  </AdminLayout>
</template>

<style scoped>
.admin-content {
  max-width: 1400px;
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

.admin-card,
.password-guard {
  padding: 28px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.quick-link-card {
  padding: 28px;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.quick-link-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(76, 110, 245, 0.15);
}

.quick-link-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--color-primary);
}

.quick-link-card h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.quick-link-card p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
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
  gap: 14px;
  margin-top: 16px;
}

.statistics-grid div {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 16px;
  background: var(--color-card-muted);
  transition: all 0.2s ease;
}

.statistics-grid div:hover {
  background: var(--color-card-hover, rgba(120, 130, 170, 0.18));
  transform: translateY(-2px);
}

.statistics-grid div strong {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.stat-list p {
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(120, 130, 170, 0.08);
}

.stat-list p:last-child {
  border-bottom: none;
}

.stat-list strong {
  color: var(--color-text);
  font-weight: 600;
}

.password-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
  margin-top: 18px;
}

@media (max-width: 1024px) {
  .quick-links {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-card,
  .password-guard {
    padding: 20px;
  }

  .admin-title {
    font-size: 24px;
  }

  .statistics-grid,
  .password-grid {
    grid-template-columns: 1fr;
  }
}
</style>
