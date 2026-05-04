<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppLayout from '../../layouts/AppLayout.vue'
import {
  changeAdminPassword,
  cleanExpiredImages,
  createFeaturedPrompt,
  deleteFeaturedPrompt,
  fetchAdminStatus,
  fetchAnnouncementConfig,
  fetchFeaturedPrompts,
  fetchInviteCodes,
  fetchStatistics,
  fetchUsers,
  generateInviteCodes,
  resetUserPassword,
  saveAnnouncement,
  saveCleanupCron,
  saveDailyLimit,
  saveEmailServiceConfig,
  saveRegisterPolicy,
  saveUpstreamConfig,
  testUpstreamConfig,
  updateUserBanStatus,
  fetchAdminImages,
  deleteAdminImage,
  clearAllAdminImages,
} from '../../api/admin'
import { useAdminStore } from '../../stores/admin'
import { useToastStore } from '../../stores/toast'

const adminStore = useAdminStore()
const toastStore = useToastStore()
const form = reactive({
  token: '',
  imageApiBaseUrl: '',
  siteBaseUrl: '',
  emailAuthUser: '',
  emailAuthPass: '',
  allowRegister: true,
  requireInviteCode: false,
  inviteCodeCount: 10,
  dailyLimit: 20,
  cleanupCron: '0 * * * *',
})
const announcementForm = reactive({
  title: '',
  content: '',
  isEnabled: false,
})
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const status = ref(null)
const statistics = ref(null)
const featuredPrompts = ref([])
const inviteCodes = ref([])
const users = ref([])
const images = ref([])
const passwordDrafts = reactive({})
const resettingUsers = reactive({})
const banningUsers = reactive({})
const newFeaturedPrompt = ref('')
const message = ref('')
const loading = ref(false)
const passwordSaving = ref(false)
const mustChangePassword = ref(false)

async function loadData() {
  const nextStatus = await fetchAdminStatus()
  status.value = nextStatus
  mustChangePassword.value = nextStatus.mustChangePassword === true || adminStore.mustChangePassword === true
  form.token = nextStatus.sharedToken || ''
  form.imageApiBaseUrl = nextStatus.imageApiBaseUrl || ''
  form.siteBaseUrl = nextStatus.siteBaseUrl || ''
  form.emailAuthUser = nextStatus.emailAuthUser || ''
  form.emailAuthPass = ''
  form.allowRegister = nextStatus.allowRegister !== false
  form.requireInviteCode = nextStatus.requireInviteCode === true
  form.dailyLimit = nextStatus.dailyLimit
  form.cleanupCron = nextStatus.cleanupCron

  const announcement = await fetchAnnouncementConfig()
  announcementForm.title = announcement.title || ''
  announcementForm.content = announcement.content || ''
  announcementForm.isEnabled = announcement.isEnabled === true

  if (mustChangePassword.value) {
    return
  }

  const [nextStatistics, nextFeaturedPrompts, nextInviteCodes, nextUsers, nextImages] = await Promise.all([
    fetchStatistics(),
    fetchFeaturedPrompts(),
    fetchInviteCodes(),
    fetchUsers(),
    fetchAdminImages(),
  ])
  statistics.value = nextStatistics
  featuredPrompts.value = nextFeaturedPrompts
  inviteCodes.value = nextInviteCodes
  users.value = nextUsers
  images.value = nextImages
}

async function saveUpstreamAction() {
  await saveUpstreamConfig({
    accessToken: form.token,
    imageApiBaseUrl: form.imageApiBaseUrl,
    siteBaseUrl: form.siteBaseUrl,
  })
  message.value = '上游配置已保存'
  toastStore.success('上游配置已保存')
  await loadData()
}

async function saveEmailServiceAction() {
  await saveEmailServiceConfig({
    authUser: form.emailAuthUser,
    authPass: form.emailAuthPass,
  })
  message.value = '邮箱服务配置已保存'
  toastStore.success('邮箱服务配置已保存')
  await loadData()
}

async function saveRegisterPolicyAction() {
  await saveRegisterPolicy({
    allowRegister: form.allowRegister,
    requireInviteCode: form.requireInviteCode,
  })
  message.value = '注册策略已保存'
  toastStore.success('注册策略已保存')
  await loadData()
}

async function testUpstreamAction() {
  try {
    await testUpstreamConfig({
      accessToken: form.token,
      imageApiBaseUrl: form.imageApiBaseUrl,
    })
    message.value = '上游 API 可用'
    toastStore.success('上游 API 可用')
  } catch (error) {
    const nextMessage = error.response?.data?.message || '上游连通性测试失败'
    message.value = nextMessage
    toastStore.error(nextMessage)
  }
}

async function saveLimitAction() {
  await saveDailyLimit(form.dailyLimit)
  message.value = '每日限流已更新'
  toastStore.success('每日限流已更新')
  await loadData()
}

async function saveCronAction() {
  await saveCleanupCron(form.cleanupCron)
  message.value = '清理周期已更新'
  toastStore.success('清理周期已更新')
  await loadData()
}

async function cleanExpiredAction() {
  const result = await cleanExpiredImages()
  message.value = `清理完成，共处理 ${result.cleaned} 条记录`
  toastStore.success(`清理完成，共处理 ${result.cleaned} 条记录`)
  await loadData()
}

async function saveAnnouncementAction() {
  await saveAnnouncement({
    title: announcementForm.title,
    content: announcementForm.content,
    isEnabled: announcementForm.isEnabled,
  })
  message.value = '网站公告已保存'
  toastStore.success('网站公告已保存')
  await loadData()
}

async function addFeaturedPromptAction() {
  await createFeaturedPrompt(newFeaturedPrompt.value)
  newFeaturedPrompt.value = ''
  message.value = '示例灵感已添加'
  toastStore.success('示例灵感已添加')
  await loadData()
}

async function deleteFeaturedPromptAction(id) {
  await deleteFeaturedPrompt(id)
  message.value = '示例灵感已删除'
  toastStore.success('示例灵感已删除')
  await loadData()
}

async function generateInviteCodesAction() {
  const result = await generateInviteCodes(form.inviteCodeCount)
  message.value = result.message
  toastStore.success(result.message)
  await loadData()
}

function canResetPassword(userId) {
  return (passwordDrafts[userId] || '').trim().length >= 6 && !resettingUsers[userId]
}

async function resetUserPasswordAction(userId) {
  const password = (passwordDrafts[userId] || '').trim()
  if (password.length < 6) {
    return
  }

  resettingUsers[userId] = true
  try {
    await resetUserPassword(userId, password)
    passwordDrafts[userId] = ''
    message.value = '用户密码已重置'
    toastStore.success('用户密码已重置')
    await loadData()
  } finally {
    resettingUsers[userId] = false
  }
}

async function updateUserBanStatusAction(user) {
  const nextIsBanned = !user.isBanned
  if (nextIsBanned && !window.confirm(`确认封禁用户「${user.username}」吗？`)) {
    return
  }

  banningUsers[user.id] = true
  try {
    const result = await updateUserBanStatus(user.id, nextIsBanned)
    message.value = result.message
    toastStore.success(result.message)
    await loadData()
  } finally {
    banningUsers[user.id] = false
  }
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

async function deleteAdminImageAction(image) {
  if (!window.confirm('确认删除这张图片吗？')) {
    return
  }
  const result = await deleteAdminImage(image.id)
  toastStore.success(result.message)
  await loadData()
}

async function clearAllAdminImagesAction() {
  if (!window.confirm('确认清空所有生成图片吗？这个操作会同时使关联社区帖子失效，但不会删除首页示例图。')) {
    return
  }
  const result = await clearAllAdminImages()
  toastStore.success(result.message)
  await loadData()
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
          <p class="admin-eyebrow">后台控制台</p>
          <h1 class="section-title">管理上游 API、邮箱、注册策略、站点公告、社区与图片治理</h1>
          <p class="muted section-copy">这里是 Lcode-image 的运行控制中心。你可以维护生成配置、公告、用户、社区资源和图片清理策略。</p>
        </div>
        <button class="button-secondary" type="button" @click="logout">退出登录</button>
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

      <div class="admin-grid" :class="{ disabled: mustChangePassword }">
        <section class="card admin-card">
          <h2>基础配置</h2>
          <p v-if="message" class="admin-message">{{ message }}</p>

          <label class="admin-field">
            <span>图片 API 地址</span>
            <input v-model="form.imageApiBaseUrl" class="input" placeholder="例如 https://image.lcode.space/v1 或 https://image.lcode.space" />
          </label>

          <label class="admin-field">
            <span>站点 URL</span>
            <input v-model="form.siteBaseUrl" class="input" placeholder="例如 https://image.lcode.space" />
          </label>

          <label class="admin-field">
            <span>共享身份令牌</span>
            <textarea v-model="form.token" class="textarea" placeholder="请输入单个共享 chatgpt2api 身份令牌" />
          </label>

          <div class="admin-actions">
            <button class="button-primary" type="button" :disabled="mustChangePassword" @click="saveUpstreamAction">保存上游配置</button>
            <button class="button-secondary" type="button" :disabled="mustChangePassword" @click="testUpstreamAction">测试上游 API</button>
          </div>

          <label class="admin-field">
            <span>发件 QQ 邮箱</span>
            <input v-model="form.emailAuthUser" class="input" type="email" placeholder="例如 123456789@qq.com" />
          </label>
          <label class="admin-field">
            <span>邮箱授权码</span>
            <input v-model="form.emailAuthPass" class="input" type="password" placeholder="请输入 QQ 邮箱 SMTP 授权码" />
          </label>
          <button class="button-secondary" type="button" :disabled="mustChangePassword" @click="saveEmailServiceAction">保存邮箱服务配置</button>

          <label class="admin-field toggle-field">
            <span>允许平台注册</span>
            <input v-model="form.allowRegister" type="checkbox" />
          </label>
          <label class="admin-field toggle-field">
            <span>注册必须邀请码</span>
            <input v-model="form.requireInviteCode" type="checkbox" />
          </label>
          <button class="button-secondary" type="button" :disabled="mustChangePassword" @click="saveRegisterPolicyAction">保存注册策略</button>

          <label class="admin-field">
            <span>每日单 IP 次数限制</span>
            <input v-model="form.dailyLimit" class="input" type="number" min="1" />
          </label>
          <button class="button-secondary" type="button" :disabled="mustChangePassword" @click="saveLimitAction">保存限流</button>

          <label class="admin-field">
            <span>自动清理 Cron</span>
            <input v-model="form.cleanupCron" class="input" placeholder="0 * * * *" />
          </label>
          <div class="admin-actions">
            <button class="button-secondary" type="button" :disabled="mustChangePassword" @click="saveCronAction">保存清理周期</button>
            <button class="button-danger" type="button" :disabled="mustChangePassword" @click="cleanExpiredAction">立即清理过期资源</button>
          </div>
        </section>

        <section class="card admin-card">
          <h2>网站公告</h2>
          <label class="admin-field">
            <span>公告标题</span>
            <input v-model="announcementForm.title" class="input" placeholder="例如：五一期间系统维护通知" />
          </label>
          <label class="admin-field">
            <span>公告内容</span>
            <textarea v-model="announcementForm.content" class="textarea" rows="6" placeholder="请输入面向用户展示的公告内容" />
          </label>
          <label class="admin-field toggle-field">
            <span>启用公告弹窗</span>
            <input v-model="announcementForm.isEnabled" type="checkbox" />
          </label>
          <button class="button-primary" type="button" :disabled="mustChangePassword" @click="saveAnnouncementAction">保存公告</button>
        </section>

        <section class="admin-side">
          <section class="card admin-card stat-card">
            <h2>当前状态</h2>
            <div class="stat-list muted">
              <p>站点 URL：<strong>{{ status?.siteBaseUrl || '-' }}</strong></p>
              <p>图片 API 地址：<strong>{{ status?.imageApiBaseUrl || '-' }}</strong></p>
              <p>共享身份令牌：<strong>{{ status?.sharedToken || '-' }}</strong></p>
              <p>发件 QQ 邮箱：<strong>{{ status?.emailAuthUser || '-' }}</strong></p>
              <p>邮箱授权码：<strong>{{ status?.hasEmailAuthPass ? '已保存' : '未配置' }}</strong></p>
              <p>允许注册：<strong>{{ status?.allowRegister ? '开启' : '关闭' }}</strong></p>
              <p>邀请码要求：<strong>{{ status?.requireInviteCode ? '必须填写' : '可选' }}</strong></p>
              <p>当前每日限流：<strong>{{ status?.dailyLimit ?? '-' }}</strong></p>
              <p>当前清理周期：<strong>{{ status?.cleanupCron ?? '-' }}</strong></p>
              <p>首次改密状态：<strong>{{ status?.mustChangePassword ? '待处理' : '已完成' }}</strong></p>
              <p>最后更新时间：<strong>{{ status?.updatedAt ?? '-' }}</strong></p>
            </div>
          </section>

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
        </section>
      </div>

      <section v-if="!mustChangePassword" class="card admin-card wide-card">
        <h2>示例灵感</h2>
        <div class="admin-actions wrap-actions">
          <input v-model="newFeaturedPrompt" class="input flex-input" placeholder="输入新的首页示例灵感 Prompt" />
          <button class="button-primary" type="button" @click="addFeaturedPromptAction">添加灵感</button>
        </div>
        <ul class="simple-list">
          <li v-for="item in featuredPrompts" :key="item.id" class="simple-row">
            <span>{{ item.prompt }}</span>
            <button class="button-danger" type="button" @click="deleteFeaturedPromptAction(item.id)">删除</button>
          </li>
        </ul>
      </section>

      <section v-if="!mustChangePassword" class="card admin-card wide-card">
        <h2>邀请码管理</h2>
        <div class="admin-actions wrap-actions">
          <input v-model="form.inviteCodeCount" class="input short-input" type="number" min="1" />
          <button class="button-primary" type="button" @click="generateInviteCodesAction">批量生成邀请码</button>
        </div>
        <ul class="simple-list compact-list">
          <li v-for="code in inviteCodes" :key="code.code" class="simple-row">
            <span>{{ code.code }}</span>
            <span class="muted">{{ code.usedAt ? `已使用：${code.usedAt}` : '未使用' }}</span>
          </li>
        </ul>
      </section>

      <section v-if="!mustChangePassword" class="card admin-card wide-card">
        <h2>用户管理</h2>
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>状态</th>
                <th>重置密码</th>
                <th>封禁操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.isBanned ? '已封禁' : '正常' }}</td>
                <td>
                  <div class="inline-actions">
                    <input v-model="passwordDrafts[user.id]" class="input" type="password" placeholder="新密码，至少 6 位" />
                    <button class="button-secondary" type="button" :disabled="!canResetPassword(user.id)" @click="resetUserPasswordAction(user.id)">重置</button>
                  </div>
                </td>
                <td>
                  <button class="button-danger" type="button" :disabled="banningUsers[user.id]" @click="updateUserBanStatusAction(user)">
                    {{ user.isBanned ? '解除封禁' : '封禁用户' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="!mustChangePassword" class="card admin-card wide-card">
        <div class="section-head">
          <h2>所有图片资源</h2>
          <button class="button-danger" type="button" @click="clearAllAdminImagesAction">清空生成图片</button>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>预览</th>
                <th>用户</th>
                <th>Prompt</th>
                <th>来源</th>
                <th>资源类型</th>
                <th>创建时间</th>
                <th>过期时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="image in images" :key="image.id">
                <td><img class="admin-thumb" :src="image.imageUrl" :alt="image.prompt" loading="lazy" /></td>
                <td>{{ image.username || image.userId || '游客' }}</td>
                <td class="prompt-cell">{{ image.prompt }}</td>
                <td>{{ image.sourceType }}</td>
                <td>{{ image.resourceType === 'featured' ? '首页展示' : '生成图片' }}</td>
                <td>{{ image.createdAt }}</td>
                <td>{{ image.expiresAt }}</td>
                <td>{{ image.status }}</td>
                <td>
                  <button class="button-danger" type="button" :disabled="image.status !== 'active' || image.resourceType === 'featured'" @click="deleteAdminImageAction(image)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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

.admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr) minmax(280px, 0.75fr);
  gap: 16px;
}

.admin-grid.disabled {
  opacity: 0.72;
}

.admin-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.toggle-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.admin-actions {
  display: flex;
  gap: 10px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.wrap-actions {
  align-items: center;
}

.flex-input {
  flex: 1;
}

.short-input {
  width: 120px;
}

.admin-message {
  margin: 10px 0 18px;
  color: var(--color-primary);
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

.password-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
  margin-top: 18px;
}

.wide-card {
  width: 100%;
}

.simple-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.simple-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--color-card-muted);
}

.compact-list .simple-row {
  flex-wrap: wrap;
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

.inline-actions {
  display: flex;
  gap: 10px;
  min-width: 280px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.admin-thumb {
  width: 68px;
  height: 68px;
  object-fit: cover;
  border-radius: 16px;
  display: block;
}

.prompt-cell {
  max-width: 320px;
  white-space: pre-wrap;
}

@media (max-width: 1200px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }

  .password-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-hero,
  .admin-card,
  .password-guard {
    padding: 18px;
  }

  .admin-hero,
  .section-head,
  .simple-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .inline-actions {
    min-width: 220px;
    flex-direction: column;
  }
}
</style>
