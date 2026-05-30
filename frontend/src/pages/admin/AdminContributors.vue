<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { fetchAdminContributors, updateAdminContributorShare } from '../../api/admin'
import { useToastStore } from '../../stores/toast'
import { extractErrorMessage } from '../../utils/errors'
import { formatDateTime } from '../../utils/datetime'

const toastStore = useToastStore()
const items = ref([])
const loading = ref(false)
const updating = ref({})

const activeCount = computed(() => items.value.filter((item) => item.sharePersonalToken).length)

async function loadList() {
  loading.value = true
  try {
    items.value = await fetchAdminContributors()
  } catch (error) {
    toastStore.error(extractErrorMessage(error, '贡献者列表加载失败'))
  } finally {
    loading.value = false
  }
}

async function toggleShare(item) {
  if (updating.value[item.userId]) return
  const nextEnable = !item.sharePersonalToken
  if (!nextEnable && !window.confirm(`确认关闭 ${item.username} 的共享吗？关闭后他的 API 将不再被自动选中。`)) {
    return
  }
  updating.value[item.userId] = true
  try {
    await updateAdminContributorShare(item.userId, {
      sharePersonalToken: nextEnable,
      reason: nextEnable ? '' : '管理员手动关闭',
    })
    toastStore.success(nextEnable ? '已重新启用共享' : '已关闭共享')
    await loadList()
  } catch (error) {
    toastStore.error(extractErrorMessage(error, '操作失败，请稍后重试'))
  } finally {
    updating.value[item.userId] = false
  }
}

onMounted(loadList)
</script>

<template>
  <AdminLayout>
    <div class="admin-content">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">API 贡献者</h1>
          <p class="admin-subtitle">查看与管理用户共享的个人身份令牌；token 始终打码不会展示明文。</p>
        </div>
        <span class="admin-stat">当前共享中：<strong>{{ activeCount }}</strong></span>
      </div>

      <div v-if="loading" class="muted loading-copy">Loading...</div>
      <div v-else-if="!items.length" class="empty-card card">
        <h2>还没有贡献者</h2>
        <p class="muted">让用户在「个人 API 配置」里打开「共享给社区使用」开关，他们就会出现在这里。</p>
      </div>
      <div v-else class="card admin-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="index-col">#</th>
              <th>用户</th>
              <th>状态</th>
              <th>API 地址</th>
              <th>令牌（打码）</th>
              <th>已被使用</th>
              <th>最近更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="item.userId">
              <td class="index-col">{{ index + 1 }}</td>
              <td>
                <div class="user-cell">
                  <img class="admin-avatar" :src="item.avatarUrl || '/lcode-image-logo.png'" alt="头像" loading="lazy" />
                  <div>
                    <strong>{{ item.username }}</strong>
                    <p class="muted">{{ item.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span v-if="item.sharePersonalToken" class="status-pill share-on">共享中</span>
                <span v-else class="status-pill share-off">已关闭</span>
                <p v-if="!item.sharePersonalToken && item.shareDisabledReason" class="muted reason-line">{{ item.shareDisabledReason }}</p>
              </td>
              <td class="break-cell">{{ item.personalImageApiBaseUrl || '继承管理员配置' }}</td>
              <td>{{ item.maskedToken || '-' }}</td>
              <td>{{ item.totalUsage }}</td>
              <td>{{ formatDateTime(item.updatedAt) }}</td>
              <td>
                <button
                  type="button"
                  class="button-secondary"
                  :disabled="updating[item.userId] || (!item.sharePersonalToken && !item.hasPersonalToken)"
                  @click="toggleShare(item)"
                >
                  {{ item.sharePersonalToken ? '关闭共享' : '重新启用' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-content {
  max-width: 1400px;
}

.admin-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.admin-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.admin-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.7;
  max-width: 720px;
}

.admin-stat {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-stat strong {
  margin-left: 6px;
  font-size: 15px;
}

.admin-card {
  padding: 0;
  overflow: hidden;
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
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.index-col {
  width: 56px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-cell strong {
  display: block;
  color: var(--color-text);
}

.user-cell p {
  margin: 4px 0 0;
  font-size: 12px;
}

.admin-avatar {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 12px;
  background: var(--color-card-muted);
  border: 1px solid var(--color-border);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.share-on {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.share-off {
  background: var(--color-card-muted);
  color: var(--color-text-secondary);
}

.reason-line {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
}

.break-cell {
  word-break: break-all;
  max-width: 320px;
}

.empty-card {
  padding: 40px 28px;
  text-align: center;
}

.empty-card h2 {
  margin: 0 0 8px;
}

.loading-copy {
  padding: 32px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-table th,
  .admin-table td {
    padding: 12px;
    font-size: 13px;
  }
}
</style>
