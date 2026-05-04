import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { deleteImage as removeImageRequest, fetchHistory, generateImage } from '../api/image'
import { useToastStore } from './toast'
import { useUserStore } from './user'

const draftKey = 'lcode_prompt_draft'
const guestMessagesKey = 'lcode_chat_messages_guest'

function resolveErrorMessage(error) {
  return error?.response?.data?.message || error?.message || '生成失败，请稍后重试'
}

function createMessagesStorageKey(userId) {
  return userId ? `lcode_chat_messages_user_${userId}` : guestMessagesKey
}

function createPendingMessage({ prompt, attachmentName }) {
  return {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'pending',
    role: 'assistant',
    status: 'pending',
    prompt,
    attachmentName,
    createdAt: new Date().toISOString(),
    errorMessage: '',
    stale: false,
  }
}

function markRestoredPendingMessage(item) {
  if (item?.type !== 'pending' || item.status !== 'pending') return item
  return {
    ...item,
    status: 'failed',
    stale: true,
    errorMessage: '页面刷新前这次生成尚未完成，请到历史记录查看最终结果，或重新发送一次。',
  }
}

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore()
  const toastStore = useToastStore()
  const messages = ref([])
  const history = ref([])
  const draft = ref(localStorage.getItem(draftKey) || '')
  const selectedFile = ref(null)
  const loading = ref(false)
  const errorMessage = ref('')

  watch(draft, (value) => {
    localStorage.setItem(draftKey, value)
  })

  watch(messages, (value) => {
    const key = createMessagesStorageKey(userStore.user?.id || null)
    localStorage.setItem(key, JSON.stringify(value))
  }, { deep: true })

  const combinedHistory = computed(() => {
    const seen = new Set()
    return [...messages.value.filter((item) => item.type === 'image'), ...history.value].filter((item) => {
      if (!item?.id || seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  })

  const userApiKey = computed(() => userStore.profile?.personalToken || '')
  const userBaseUrl = computed(() => userStore.profile?.personalImageApiBaseUrl || '')
  const selectedFileName = computed(() => selectedFile.value?.name || '')

  function restoreMessages() {
    const key = createMessagesStorageKey(userStore.user?.id || null)
    try {
      const restored = JSON.parse(localStorage.getItem(key) || '[]')
      messages.value = restored.map(markRestoredPendingMessage)
    } catch {
      messages.value = []
    }
  }

  async function loadHistory() {
    history.value = await fetchHistory()
  }

  function setSelectedFile(file) {
    selectedFile.value = file || null
  }

  function clearSelectedFile() {
    selectedFile.value = null
  }

  async function submitPrompt(prompt) {
    const content = prompt.trim()
    if ((!content && !selectedFile.value) || loading.value) return

    const attachmentName = selectedFile.value?.name || ''
    const file = selectedFile.value
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'text',
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      attachmentName,
    }
    const pendingMessage = createPendingMessage({ prompt: content, attachmentName })

    loading.value = true
    errorMessage.value = ''
    messages.value.push(userMessage, pendingMessage)
    draft.value = ''
    clearSelectedFile()

    try {
      const image = await generateImage({
        prompt: content,
        agent: 'image',
        file,
      })

      messages.value = messages.value.map((item) => item.id === pendingMessage.id
        ? {
            ...image,
            type: 'image',
            role: 'assistant',
          }
        : item)
      toastStore.success('图片任务已完成，可以继续下一条了')
      await loadHistory()
    } catch (error) {
      const message = resolveErrorMessage(error)
      errorMessage.value = message
      messages.value = messages.value.map((item) => item.id === pendingMessage.id
        ? {
            ...item,
            status: 'failed',
            errorMessage: message,
            stale: false,
          }
        : item)
    } finally {
      loading.value = false
    }
  }

  async function deleteImage(id) {
    await removeImageRequest(id)
    messages.value = messages.value.filter((item) => item.id !== id)
    history.value = history.value.filter((item) => item.id !== id)
  }

  function clearError() {
    errorMessage.value = ''
  }

  return {
    messages,
    history,
    combinedHistory,
    draft,
    selectedFile,
    selectedFileName,
    loading,
    userApiKey,
    userBaseUrl,
    errorMessage,
    restoreMessages,
    loadHistory,
    setSelectedFile,
    clearSelectedFile,
    submitPrompt,
    deleteImage,
    clearError,
  }
})
