<script setup>
import { computed, ref, watch } from 'vue'
import { saveUserProfile, testUserProfile } from '../api/auth'
import { useChatStore } from '../stores/chat'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])
const chatStore = useChatStore()
const userStore = useUserStore()
const toastStore = useToastStore()
const draftBaseUrl = ref('')
const draftValue = ref('')
const message = ref('')
const testing = ref(false)
const saving = ref(false)

const isLoggedIn = computed(() => userStore.isLoggedIn)

watch(() => props.open, (value) => {
  if (value) {
    draftBaseUrl.value = userStore.profile?.personalImageApiBaseUrl || ''
    draftValue.value = userStore.profile?.personalToken || ''
    message.value = ''
    testing.value = false
    saving.value = false
  }
})

async function runTest() {
  if (!draftValue.value.trim() || testing.value || !isLoggedIn.value) return

  testing.value = true
  message.value = ''

  try {
    const result = await testUserProfile({
      personalToken: draftValue.value.trim(),
      personalImageApiBaseUrl: draftBaseUrl.value.trim(),
    })
    message.value = result.ok ? '个人配置可用' : '个人配置不可用'
    if (result.ok) {
      toastStore.success('个人配置测试通过')
    }
  } catch (error) {
    message.value = error?.response?.data?.message || '测试失败，请稍后重试'
  } finally {
    testing.value = false
  }
}

async function save() {
  if (!isLoggedIn.value || saving.value) return

  saving.value = true
  message.value = ''

  try {
    await saveUserProfile({
      personalToken: draftValue.value.trim(),
      personalImageApiBaseUrl: draftBaseUrl.value.trim(),
    })
    userStore.setProfile({
      personalToken: draftValue.value.trim(),
      personalImageApiBaseUrl: draftBaseUrl.value.trim(),
      hasPersonalToken: Boolean(draftValue.value.trim()),
      updatedAt: new Date().toISOString(),
    })
    message.value = '个人配置已保存'
    toastStore.success('个人配置已保存')
    emit('close')
  } catch (error) {
    message.value = error?.response?.data?.message || '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-mask" @click.self="close">
        <div class="modal-panel card">
          <h3>个人图片 API 配置</h3>
          <template v-if="isLoggedIn">
            <p class="muted">现在会保存到你的账号里。清理浏览器缓存后，重新登录仍然可以恢复。</p>
            <label class="modal-field">
              <span>个人请求地址</span>
              <input v-model="draftBaseUrl" class="input" placeholder="请输入你自己的图片 API 地址" />
            </label>
            <label class="modal-field">
              <span>个人身份令牌</span>
              <textarea v-model="draftValue" class="textarea" placeholder="请输入你自己的身份令牌" />
            </label>
            <p class="muted modal-tip">登录后，生成图片会优先使用你自己的配置；没有个人令牌时才会回退到管理员共享配置。</p>
            <div class="saved-config muted">
              <p>当前个人地址：<strong>{{ chatStore.userBaseUrl || '-' }}</strong></p>
              <p>当前个人令牌：<strong>{{ chatStore.userApiKey || '-' }}</strong></p>
            </div>
            <p v-if="message" class="modal-message" :class="{ danger: message.includes('不可用') || message.includes('失败') || message.includes('请先输入') }">
              {{ message }}
            </p>
            <div class="modal-actions">
              <button type="button" class="button-secondary" @click="close">取消</button>
              <button type="button" class="button-secondary" :disabled="testing || !draftValue.trim()" @click="runTest">
                {{ testing ? '测试中...' : '测试个人配置' }}
              </button>
              <button type="button" class="button-primary" :disabled="saving" @click="save">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </template>
          <template v-else>
            <p class="muted">请先登录账号，再保存你自己的图片 API 地址和身份令牌。</p>
            <div class="modal-actions">
              <button type="button" class="button-primary" @click="close">我知道了</button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(28, 35, 29, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.modal-panel {
  width: min(560px, 100%);
  padding: 24px;
  transform-origin: 50% 46%;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition: opacity 0.24s ease, transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-panel,
.modal-fade-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.modal-tip {
  margin: 10px 0 0;
  line-height: 1.6;
}

.saved-config {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--color-card-muted);
  line-height: 1.7;
}

.saved-config p {
  margin: 0 0 8px;
}

.saved-config p:last-child {
  margin-bottom: 0;
}

.saved-config strong {
  color: var(--color-text);
  word-break: break-all;
}

.modal-message {
  margin: 12px 0 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--color-primary-soft);
  color: var(--color-text);
  line-height: 1.6;
}

.modal-message.danger {
  background: rgba(213, 91, 91, 0.12);
  color: var(--color-danger);
}

.modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
