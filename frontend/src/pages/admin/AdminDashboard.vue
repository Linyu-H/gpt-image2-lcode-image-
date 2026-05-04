<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppLayout from '../../layouts/AppLayout.vue'
import {
  cleanExpiredImages,
  createFeaturedPrompt,
  deleteFeaturedPrompt,
  fetchAdminStatus,
  fetchFeaturedPrompts,
  fetchInviteCodes,
  fetchStatistics,
  fetchUsers,
  generateInviteCodes,
  resetUserPassword,
  saveCleanupCron,
  saveDailyLimit,
  saveEmailServiceConfig,
  saveRegisterPolicy,
  saveUpstreamConfig,
  testUpstreamConfig,
  updateUserBanStatus,
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
const status = ref(null)
const statistics = ref(null)
const featuredPrompts = ref([])
const inviteCodes = ref([])
const users = ref([])
const passwordDrafts = reactive({})
const resettingUsers = reactive({})
const banningUsers = reactive({})
const newFeaturedPrompt = ref('')
const message = ref('')

async function loadData() {
  const [nextStatus, nextStatistics, nextFeaturedPrompts, nextInviteCodes, nextUsers] = await Promise.all([
    fetchAdminStatus(),
    fetchStatistics(),
    fetchFeaturedPrompts(),
    fetchInviteCodes(),
    fetchUsers(),
  ])
  status.value = nextStatus
  statistics.value = nextStatistics
  featuredPrompts.value = nextFeaturedPrompts
  inviteCodes.value = nextInviteCodes
  users.value = nextUsers
  form.token = status.value.sharedToken || ''
  form.imageApiBaseUrl = status.value.imageApiBaseUrl || ''
  form.siteBaseUrl = status.value.siteBaseUrl || ''
  form.emailAuthUser = status.value.emailAuthUser || ''
  form.emailAuthPass = ''
  form.allowRegister = status.value.allowRegister !== false
  form.requireInviteCode = status.value.requireInviteCode === true
  form.dailyLimit = status.value.dailyLimit
  form.cleanupCron = status.value.cleanupCron
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
  await testUpstreamConfig({
    accessToken: form.token,
    imageApiBaseUrl: form.imageApiBaseUrl,
  })
  message.value = '上游 API 可用'
  toastStore.success('上游 API 可用')
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
  message.value = `清理完成，共处理 ${result.cleaned} 张图片`
  toastStore.success(`清理完成，共处理 ${result.cleaned} 张图片`)
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

function logout() {
  adminStore.logout()
  location.href = '/admin/login'
}

onMounted(loadData)
</script>

<template>
  <AppLayout>
    <div class="admin-shell">
      <section class="card admin-hero">
        <div>
          <p class="admin-eyebrow">后台控制台</p>
          <h1 class="section-title">管理上游 API、邮箱验证码服务、注册策略、邀请码与首页灵感池</h1>
          <p class="muted section-copy">这里是 Lcode-image 的运行控制中心。你可以维护图片 API 地址、站点 URL、QQ 邮箱验证码配置、注册治理策略，以及首页“示例灵感”的每日轮换数据源。</p>
        </div>
        <button class="button-secondary" type="button" @click="logout">退出登录</button>
      </section>

      <div class="admin-grid">
        <section class="card admin-card">
          <h2>基础配置</h2>
          <p v-if="message" class="admin-message">{{ message }}</p>

          <label class="admin-field">
            <span>图片 API 地址</span>
            <input v-model="form.imageApiBaseUrl" class="input" placeholder="例如 https://image.lcode.space/v1 或 https://image.lcode.space" />
            <small class="muted">不要写死到 localhost，这里填写你实际可访问的上游地址。</small>
          </label>

          <label class="admin-field">
            <span>站点 URL</span>
            <input v-model="form.siteBaseUrl" class="input" placeholder="例如 https://image.lcode.space" />
            <small class="muted">生成后的图片地址会拼接这个前缀，前台和历史记录都会显示完整链接。</small>
          </label>

          <label class="admin-field">
            <span>共享身份令牌</span>
            <textarea v-model="form.token" class="textarea" placeholder="请输入单个共享 chatgpt2api 身份令牌" />
            <small class="muted">会显示当前已保存的令牌；如需更换，直接输入新的令牌再保存。</small>
          </label>

          <div class="admin-actions">
            <button class="button-primary" type="button" @click="saveUpstreamAction">保存上游配置</button>
            <button class="button-secondary" type="button" @click="testUpstreamAction">测试上游 API</button>
          </div>

          <label class="admin-field">
            <span>发件 QQ 邮箱</span>
            <input v-model="form.emailAuthUser" class="input" type="email" placeholder="例如 123456789@qq.com" />
          </label>

          <label class="admin-field">
            <span>邮箱授权码</span>
            <input v-model="form.emailAuthPass" class="input" type="password" placeholder="请输入 QQ 邮箱 SMTP 授权码" />
            <small class="muted">已保存授权码不会回显明文；如需更换，直接输入新的授权码再保存。</small>
          </label>

          <button class="button-secondary" type="button" @click="saveEmailServiceAction">保存邮箱服务配置</button>

          <label class="admin-field toggle-field">
            <span>允许平台注册</span>
            <input v-model="form.allowRegister" type="checkbox" />
          </label>

          <label class="admin-field toggle-field">
            <span>注册必须邀请码</span>
            <input v-model="form.requireInviteCode" type="checkbox" />
          </label>

          <button class="button-secondary" type="button" @click="saveRegisterPolicyAction">保存注册策略</button>

          <label class="admin-field">
            <span>每日单 IP 次数限制</span>
            <input v-model="form.dailyLimit" class="input" type="number" min="1" />
          </label>
          <button class="button-secondary" type="button" @click="saveLimitAction">保存限流</button>

          <label class="admin-field">
            <span>自动清理 Cron</span>
            <input v-model="form.cleanupCron" class="input" placeholder="0 * * * *" />
          </label>
          <div class="admin-actions">
            <button class="button-secondary" type="button" @click="saveCronAction">保存清理周期</button>
            <button class="button-danger" type="button" @click="cleanExpiredAction">立即清理过期图片</button>
          </div>
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
              <p>最后更新时间：<strong>{{ status?.updatedAt ?? '-' }}</strong></p>
            </div>
          </section>

          <section class="card admin-card stat-card">
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

      <section class="card admin-card prompt-card">
        <div class="prompt-head">
          <div>
            <h2>用户管理</h2>
            <p class="muted">这里可以查看当前注册用户，并直接为指定用户重置登录密码。</p>
          </div>
          <span class="prompt-count">共 {{ users.length }} 位</span>
        </div>

        <div class="prompt-table-wrap">
          <table class="prompt-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>邮箱验证</th>
                <th>账号状态</th>
                <th>注册时间</th>
                <th>最后更新</th>
                <th>重置密码</th>
                <th>封禁操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in users" :key="item.id">
                <td><strong>{{ item.username }}</strong></td>
                <td>{{ item.email || '-' }}</td>
                <td>{{ item.emailVerified ? '已验证' : '未验证' }}</td>
                <td>{{ item.isBanned ? '已封禁' : '正常' }}</td>
                <td>{{ item.createdAt }}</td>
                <td>{{ item.updatedAt }}</td>
                <td>
                  <div class="password-reset-cell">
                    <input
                      v-model="passwordDrafts[item.id]"
                      class="input password-reset-input"
                      type="password"
                      minlength="6"
                      placeholder="输入至少 6 位的新密码"
                    />
                    <button
                      class="button-primary table-action"
                      type="button"
                      :disabled="!canResetPassword(item.id)"
                      @click="resetUserPasswordAction(item.id)"
                    >
                      {{ resettingUsers[item.id] ? '重置中...' : '重置密码' }}
                    </button>
                  </div>
                </td>
                <td>
                  <button
                    class="table-action"
                    :class="item.isBanned ? 'button-secondary' : 'button-danger'"
                    type="button"
                    :disabled="banningUsers[item.id]"
                    @click="updateUserBanStatusAction(item)"
                  >
                    {{ banningUsers[item.id] ? '提交中...' : item.isBanned ? '解除封禁' : '封禁用户' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card admin-card prompt-card">
        <div class="prompt-head">
          <div>
            <h2>邀请码管理</h2>
            <p class="muted">可批量生成邀请码，并在这里查看使用状态、使用邮箱和使用用户。</p>
          </div>
          <span class="prompt-count">共 {{ inviteCodes.length }} 条</span>
        </div>

        <div class="invite-create">
          <input v-model="form.inviteCodeCount" class="input invite-count-input" type="number" min="1" max="200" />
          <button class="button-primary" type="button" @click="generateInviteCodesAction">一键生成邀请码</button>
        </div>

        <div class="prompt-table-wrap">
          <table class="prompt-table">
            <thead>
              <tr>
                <th>邀请码</th>
                <th>创建时间</th>
                <th>是否已使用</th>
                <th>使用时间</th>
                <th>使用邮箱</th>
                <th>使用用户</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in inviteCodes" :key="item.id">
                <td><strong>{{ item.code }}</strong></td>
                <td>{{ item.createdAt }}</td>
                <td>{{ item.used ? '已使用' : '未使用' }}</td>
                <td>{{ item.usedAt || '-' }}</td>
                <td>{{ item.usedByEmail || '-' }}</td>
                <td>{{ item.usedByUserId || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card admin-card prompt-card">
        <div class="prompt-head">
          <div>
            <h2>示例灵感</h2>
            <p class="muted">首页每天 0:00 会从这里按顺序轮换 1 条，用管理员共享配置自动生成新的示例图片。</p>
          </div>
          <span class="prompt-count">共 {{ featuredPrompts.length }} 条</span>
        </div>

        <div class="prompt-create">
          <textarea v-model="newFeaturedPrompt" class="textarea" placeholder="输入新的示例灵感，例如：薄雾清晨中的绿色玻璃温室，柔和侧光，安静、通透、治愈感。" />
          <button class="button-primary" type="button" :disabled="!newFeaturedPrompt.trim()" @click="addFeaturedPromptAction">添加灵感</button>
        </div>

        <div class="prompt-table-wrap">
          <table class="prompt-table">
            <thead>
              <tr>
                <th>顺序</th>
                <th>灵感内容</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in featuredPrompts" :key="item.id">
                <td>{{ item.sortOrder }}</td>
                <td class="prompt-cell">{{ item.prompt }}</td>
                <td>{{ item.createdAt }}</td>
                <td>
                  <button class="button-danger table-action" type="button" @click="deleteFeaturedPromptAction(item.id)">删除</button>
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
  padding-bottom: 28px;
}

.admin-hero {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.admin-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 20px;
}

.admin-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-card {
  padding: 22px;
}

.admin-card h2 {
  margin-top: 0;
}

.admin-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.toggle-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.admin-message {
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--color-primary-soft);
}

.stat-list p {
  margin: 0 0 12px;
  line-height: 1.7;
}

.stat-list strong,
.statistics-grid strong {
  color: var(--color-text);
  word-break: break-all;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.statistics-grid div {
  padding: 16px;
  border-radius: 18px;
  background: var(--color-card-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.statistics-grid strong {
  font-size: 1.5rem;
}

.prompt-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.prompt-head p {
  margin: 8px 0 0;
  line-height: 1.7;
}

.prompt-count {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-text-soft);
}

.prompt-create {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-create {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.invite-count-input {
  width: min(180px, 100%);
}

.prompt-table-wrap {
  overflow-x: auto;
}

.prompt-table {
  width: 100%;
  border-collapse: collapse;
}

.prompt-table th,
.prompt-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}

.prompt-table th {
  color: var(--color-text-soft);
  font-weight: 600;
}

.prompt-cell {
  min-width: 360px;
  line-height: 1.7;
}

.password-reset-cell {
  min-width: 280px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.password-reset-input {
  min-width: 180px;
}

.table-action {
  min-height: 36px;
  padding: 0 14px;
}

@media (max-width: 1024px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-hero,
  .admin-card {
    padding: 18px;
  }

  .admin-hero,
  .prompt-head,
  .invite-create,
  .password-reset-cell {
    flex-direction: column;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .prompt-cell {
    min-width: 240px;
  }

  .invite-count-input,
  .password-reset-input,
  .password-reset-cell {
    width: 100%;
  }
}
</style>
