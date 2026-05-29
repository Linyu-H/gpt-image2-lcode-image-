<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../layouts/AdminLayout.vue'
import {
  cleanExpiredImages,
  createFeaturedPrompt,
  deleteFeaturedPrompt,
  fetchAdminStatus,
  fetchAnnouncementConfig,
  fetchFeaturedPrompts,
  fetchInviteCodes,
  fetchLinuxdoSetting,
  generateInviteCodes,
  saveAnnouncement,
  saveCleanupCron,
  saveDailyLimit,
  saveEmailServiceConfig,
  saveLinuxdoSetting,
  saveRegisterPolicy,
  saveUpstreamConfig,
  testUpstreamConfig,
} from '../../api/admin'
import { useAdminStore } from '../../stores/admin'
import { useToastStore } from '../../stores/toast'
import { useI18nStore } from '../../stores/i18n'
import { formatDateTime } from '../../utils/datetime'

const adminStore = useAdminStore()
const toastStore = useToastStore()
const i18n = useI18nStore()

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
const linuxdoForm = reactive({
  clientId: '',
  clientSecret: '',
  redirectUrl: '',
})
const linuxdoStatus = ref({ hasConfig: false })
const linuxdoSaving = ref(false)
const status = ref(null)
const featuredPrompts = ref([])
const inviteCodes = ref([])
const newFeaturedPrompt = ref('')
const message = ref('')
const loading = ref(false)
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

  const linuxdo = await fetchLinuxdoSetting()
  linuxdoStatus.value = linuxdo
  linuxdoForm.clientId = linuxdo.clientId || ''
  linuxdoForm.clientSecret = linuxdo.clientSecret || ''
  linuxdoForm.redirectUrl = linuxdo.redirectUrl || ''

  if (mustChangePassword.value) return

  const [nextFeaturedPrompts, nextInviteCodes] = await Promise.all([
    fetchFeaturedPrompts(),
    fetchInviteCodes(),
  ])
  featuredPrompts.value = nextFeaturedPrompts
  inviteCodes.value = nextInviteCodes
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

async function saveLinuxdoAction() {
  if (!linuxdoForm.clientId.trim() || !linuxdoForm.clientSecret.trim() || !linuxdoForm.redirectUrl.trim()) {
    toastStore.error('Client ID、Client Secret 和回调地址均不能为空')
    return
  }
  linuxdoSaving.value = true
  try {
    await saveLinuxdoSetting({
      clientId: linuxdoForm.clientId.trim(),
      clientSecret: linuxdoForm.clientSecret.trim(),
      redirectUrl: linuxdoForm.redirectUrl.trim(),
    })
    message.value = 'Linux.do 接入配置已保存'
    toastStore.success('Linux.do 接入配置已保存')
    await loadData()
  } catch (error) {
    const nextMessage = error.response?.data?.message || 'Linux.do 配置保存失败'
    message.value = nextMessage
    toastStore.error(nextMessage)
  } finally {
    linuxdoSaving.value = false
  }
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
        <h1 class="admin-title">{{ i18n.t('adminConfig') }}</h1>
        <p class="admin-subtitle">配置系统参数、上游接口和站点设置</p>
      </div>

      <p v-if="loading" class="muted loading-copy">Loading...</p>
      <p v-else-if="mustChangePassword" class="muted loading-copy">请先在控制台完成首次密码修改，再回到这里配置。</p>

      <div v-else class="config-sections">
          <section class="card admin-sub-card">
            <h2>基础配置</h2>
            <p v-if="message" class="admin-message">{{ message }}</p>

            <div class="config-grid">
              <label class="admin-field">
                <span>图片 API 地址</span>
                <input v-model="form.imageApiBaseUrl" class="input" placeholder="例如 https://image.lcode.space/v1 或 https://image.lcode.space" />
              </label>

              <label class="admin-field">
                <span>站点 URL</span>
                <input v-model="form.siteBaseUrl" class="input" placeholder="例如 https://image.lcode.space" />
              </label>
            </div>

            <label class="admin-field">
              <span>共享身份令牌</span>
              <textarea v-model="form.token" class="textarea" placeholder="请输入单个共享 chatgpt2api 身份令牌" />
            </label>

            <div class="admin-actions">
              <button class="button-primary" type="button" @click="saveUpstreamAction">保存上游配置</button>
              <button class="button-secondary" type="button" @click="testUpstreamAction">测试上游 API</button>
            </div>
          </section>

          <section class="card admin-sub-card">
            <h2>邮箱服务配置</h2>
            <div class="config-grid">
              <label class="admin-field">
                <span>发件 QQ 邮箱</span>
                <input v-model="form.emailAuthUser" class="input" type="email" placeholder="例如 123456789@qq.com" />
              </label>
              <label class="admin-field">
                <span>邮箱授权码</span>
                <input v-model="form.emailAuthPass" class="input" type="password" placeholder="请输入 QQ 邮箱 SMTP 授权码" />
              </label>
            </div>
            <button class="button-secondary" type="button" @click="saveEmailServiceAction">保存邮箱服务配置</button>
          </section>

          <section class="card admin-sub-card">
            <h2>注册与限流</h2>
            <div class="config-grid">
              <label class="admin-field toggle-field">
                <span>允许平台注册</span>
                <input v-model="form.allowRegister" type="checkbox" class="switch" role="switch" />
              </label>
              <label class="admin-field toggle-field">
                <span>注册必须邀请码</span>
                <input v-model="form.requireInviteCode" type="checkbox" class="switch" role="switch" />
              </label>
            </div>
            <button class="button-secondary" type="button" @click="saveRegisterPolicyAction">保存注册策略</button>

            <label class="admin-field">
              <span>每日单 IP 次数限制</span>
              <input v-model="form.dailyLimit" class="input" type="number" min="1" style="max-width: 200px;" />
            </label>
            <button class="button-secondary" type="button" @click="saveLimitAction">保存限流</button>
          </section>

          <section class="card admin-sub-card">
            <h2>自动清理</h2>
            <label class="admin-field">
              <span>自动清理 Cron</span>
              <input v-model="form.cleanupCron" class="input" placeholder="0 * * * *" style="max-width: 300px;" />
            </label>
            <div class="admin-actions">
              <button class="button-secondary" type="button" @click="saveCronAction">保存清理周期</button>
              <button class="button-danger" type="button" @click="cleanExpiredAction">立即清理过期资源</button>
            </div>
          </section>

          <section class="card admin-sub-card">
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
              <input v-model="announcementForm.isEnabled" type="checkbox" class="switch" role="switch" />
            </label>
            <button class="button-primary" type="button" @click="saveAnnouncementAction">保存公告</button>
          </section>

          <section class="card admin-sub-card">
            <div class="linuxdo-heading">
              <img src="https://wiki.linux.do/_next/image?url=%2Ffavicon.ico&w=32&q=75" alt="Linux.do" class="linuxdo-heading-icon" />
              <h2>Linux.do 接入配置</h2>
            </div>
            <p class="muted">配置 OAuth2 应用的 Client ID、Client Secret 和回调地址，启用"使用 Linux.do 登录"。</p>

            <label class="admin-field">
              <span>Client ID</span>
              <input v-model="linuxdoForm.clientId" class="input" placeholder="Linux.do 应用 Client ID" />
            </label>
            <label class="admin-field">
              <span>Client Secret</span>
              <input v-model="linuxdoForm.clientSecret" class="input" type="password" placeholder="Linux.do 应用 Client Secret" />
            </label>
            <label class="admin-field">
              <span>回调地址</span>
              <input v-model="linuxdoForm.redirectUrl" class="input" placeholder="例如 https://your-site.example/api/auth/linuxdo/callback" />
            </label>
            <p class="muted linuxdo-hint">
              回调地址必须与 Linux.do 应用后台填写的一致，建议指向 <code>/api/auth/linuxdo/callback</code>。
            </p>
            <div class="admin-actions">
              <button class="button-primary" type="button" :disabled="linuxdoSaving" @click="saveLinuxdoAction">
                {{ linuxdoSaving ? '保存中…' : '保存 Linux.do 配置' }}
              </button>
              <span class="muted">{{ linuxdoStatus.hasConfig ? '当前已启用 Linux.do 登录' : '尚未配置' }}</span>
            </div>
          </section>

          <section class="card admin-sub-card">
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
              <p>最后更新时间：<strong>{{ formatDateTime(status?.updatedAt) }}</strong></p>
            </div>
          </section>
        </div>

        <section v-if="!loading && !mustChangePassword" class="card admin-sub-card">
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

        <section v-if="!loading && !mustChangePassword" class="card admin-sub-card">
          <h2>邀请码管理</h2>
          <div class="admin-actions wrap-actions">
            <input v-model="form.inviteCodeCount" class="input short-input" type="number" min="1" />
            <button class="button-primary" type="button" @click="generateInviteCodesAction">批量生成邀请码</button>
          </div>
          <ul class="simple-list compact-list">
            <li v-for="code in inviteCodes" :key="code.code" class="simple-row">
              <span>{{ code.code }}</span>
              <span class="muted">{{ code.usedAt ? `已使用：${formatDateTime(code.usedAt)}` : '未使用' }}</span>
            </li>
          </ul>
        </section>
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

.config-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-card {
  padding: 28px;
}

.admin-sub-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-sub-card h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.admin-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 0;
}

.admin-field span {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.toggle-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.switch {
  appearance: none;
  -webkit-appearance: none;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: var(--color-card-muted, rgba(120, 130, 170, 0.24));
  border: 1px solid rgba(120, 130, 170, 0.28);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;
  margin: 0;
}

.switch::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
  transition: left 0.2s ease;
}

.switch:checked {
  background: var(--color-primary, #4c6ef5);
  border-color: var(--color-primary, #4c6ef5);
}

.switch:checked::after {
  left: calc(100% - 20px);
}

.switch:focus-visible {
  outline: 2px solid var(--color-primary, #4c6ef5);
  outline-offset: 2px;
}

.switch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-actions {
  display: flex;
  gap: 12px;
  margin: 8px 0 0;
  flex-wrap: wrap;
  align-items: center;
}

.wrap-actions {
  align-items: stretch;
}

.flex-input {
  flex: 1;
}

.short-input {
  width: 120px;
}

.admin-message {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 14px;
}

.admin-actions {
  display: flex;
  gap: 12px;
  margin: 0;
  flex-wrap: wrap;
  align-items: center;
}

.flex-input {
  flex: 1;
  min-width: 300px;
}

.short-input {
  width: 140px;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.simple-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--color-card-muted);
  transition: background 0.2s ease;
}

.simple-row:hover {
  background: var(--color-card-hover, rgba(120, 130, 170, 0.18));
}

.compact-list .simple-row {
  flex-wrap: wrap;
}

.admin-section-nav {
  position: sticky;
  top: 124px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-section-link {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  padding: 0 18px;
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.admin-section-link:hover {
  background: var(--color-card-muted);
  color: var(--color-text);
}

.admin-section-link.active {
  color: var(--color-text-soft);
  background: var(--color-primary);
  font-weight: 600;
}

.loading-copy {
  padding: 32px 0;
  text-align: center;
  color: var(--color-text-secondary);
}

@media (max-width: 1024px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-card,
  .admin-sub-card {
    padding: 20px;
  }

  .admin-title {
    font-size: 24px;
  }

  .simple-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .flex-input {
    min-width: 100%;
  }
}
</style>
