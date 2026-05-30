import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { deleteImage as removeImageRequest, fetchContributors, fetchHistory, generateImage } from '../api/image'
import { useToastStore } from './toast'
import { useUserStore } from './user'

const draftKey = 'lcode_prompt_draft'
const guestMessagesKey = 'lcode_chat_messages_guest'
const tokenSourceKey = 'lcode_token_source'
const imageSizeKey = 'lcode_image_size'
const imageQualityKey = 'lcode_image_quality'
const maybeCompletedGenerationStatuses = new Set([408, 499, 500, 502, 503, 504, 522, 524])
const historyRecoveryDelaysMs = [0, 2000, 4000, 7000, 11000, 16000, 22000, 30000]
const historyManualRetryDelaysMs = [0, 3000, 6000, 12000, 20000]
const historyMatchClockSkewMs = 60000
const historyMatchMaxAgeMs = 10 * 60 * 1000

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizePrompt(value) {
  return String(value || '').trim()
}

function isMaybeCompletedGenerationError(error) {
  const status = Number(error?.response?.status || 0)
  if (!status) return true
  return maybeCompletedGenerationStatuses.has(status)
}

function resolveErrorMessage(error) {
  return error?.response?.data?.message || error?.message || '生成失败，请稍后重试'
}

function resolveGenerationCheckingMessage(error) {
  const status = Number(error?.response?.status || 0)
  if (status === 504 || status === 524) {
    return '请求超时，正在检查历史记录；如果图片已生成会自动恢复显示。'
  }
  return '请求已中断，正在检查历史记录；如果图片已生成会自动恢复显示。'
}

function resolveGenerationMissMessage(error) {
  const status = Number(error?.response?.status || 0)
  if (!status || maybeCompletedGenerationStatuses.has(status)) {
    return '请求已中断，暂未在历史记录中找到图片。你可以稍后点“检查历史记录”。'
  }
  return resolveErrorMessage(error)
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
    errorMessage: '页面离开前这次生成尚未完成，请到历史记录查看最终结果，或重新发送一次。',
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
  const tokenSource = ref(localStorage.getItem(tokenSourceKey) || 'auto')
  const imageSize = ref(localStorage.getItem(imageSizeKey) || '1024x1024')
  const imageQuality = ref(localStorage.getItem(imageQualityKey) || 'hd')
  const contributors = ref([])

  watch(draft, (value) => {
    localStorage.setItem(draftKey, value)
  })

  watch(tokenSource, (value) => {
    localStorage.setItem(tokenSourceKey, value || 'auto')
  })

  watch(imageSize, (value) => {
    localStorage.setItem(imageSizeKey, value || '1024x1024')
  })

  watch(imageQuality, (value) => {
    localStorage.setItem(imageQualityKey, value || 'hd')
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
      messages.value = loading.value ? restored : restored.map(markRestoredPendingMessage)
    } catch {
      messages.value = []
    }
  }

  async function loadHistory() {
    try {
      history.value = await fetchHistory()
    } catch (error) {
      const message = resolveErrorMessage(error)
      toastStore.error(message)
    }
  }

  async function loadContributors() {
    try {
      contributors.value = await fetchContributors()
    } catch {
      contributors.value = []
    }
  }

  function findRecentImageFromHistory(prompt, startedAt) {
    const normalizedPrompt = normalizePrompt(prompt)
    const startTime = startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime()
    return history.value.find((item) => {
      const createdTime = new Date(item.createdAt).getTime()
      if (!Number.isFinite(createdTime)) return false
      const promptMatch = normalizePrompt(item.prompt) === normalizedPrompt
      const createdAfterRequest = !Number.isFinite(startTime) || createdTime >= startTime - historyMatchClockSkewMs
      const recentEnough = Date.now() - createdTime < historyMatchMaxAgeMs
      return promptMatch && createdAfterRequest && recentEnough
    })
  }

  async function recoverImageFromHistory({ prompt, pendingId, startedAt, delays = historyRecoveryDelaysMs, quiet = false }) {
    for (const delay of delays) {
      if (delay > 0) {
        await wait(delay)
      }
      await loadHistory()
      const recentImage = findRecentImageFromHistory(prompt, startedAt)
      if (recentImage) {
        messages.value = messages.value.map((item) => item.id === pendingId
          ? {
              ...recentImage,
              type: 'image',
              role: 'assistant',
            }
          : item)
        if (!quiet) {
          toastStore.success('图片已生成成功（从历史记录恢复）')
        }
        errorMessage.value = ''
        return recentImage
      }
    }
    return null
  }

  function setTokenSource(value) {
    tokenSource.value = value || 'auto'
  }

  function setImageSize(value) {
    imageSize.value = value || '1024x1024'
  }

  function setImageQuality(value) {
    imageQuality.value = value || 'hd'
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
    const startedAt = new Date()

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
        tokenSource: tokenSource.value || 'auto',
        size: imageSize.value || '1024x1024',
        quality: imageQuality.value || 'hd',
      })

      messages.value = messages.value.map((item) => item.id === pendingMessage.id
        ? {
            ...image,
            type: 'image',
            role: 'assistant',
          }
        : item)
      const fallbackTip = image?.fallback?.disabledContributors?.length
        ? `已自动切换到${image.tokenSourceUsed === 'contributor' ? `贡献者「${image.contributorUsername}」` : image.tokenSourceUsed === 'shared' ? '管理员共享' : '你自己的配置'}，并关闭失效贡献者：${image.fallback.disabledContributors.map((item) => item.username || item.contributorUserId).join('、')}`
        : ''
      if (fallbackTip) {
        toastStore.error(fallbackTip)
        await loadContributors()
      } else {
        toastStore.success('图片任务已完成，可以继续下一条了')
      }
      await loadHistory()
    } catch (error) {
      const maybeCompleted = isMaybeCompletedGenerationError(error)
      if (maybeCompleted) {
        const checkingMessage = resolveGenerationCheckingMessage(error)
        errorMessage.value = checkingMessage
        toastStore.error(checkingMessage)

        const recoveredImage = await recoverImageFromHistory({
          prompt: content,
          pendingId: pendingMessage.id,
          startedAt,
        })
        if (recoveredImage) return
      }

      const message = maybeCompleted ? resolveGenerationMissMessage(error) : resolveErrorMessage(error)
      errorMessage.value = message
      toastStore.error(message)
      messages.value = messages.value.map((item) => item.id === pendingMessage.id
        ? {
            ...item,
            status: 'failed',
            errorMessage: message,
            stale: false,
            recoverable: maybeCompleted,
            requestStartedAt: startedAt.toISOString(),
          }
        : item)
    } finally {
      loading.value = false
    }
  }

  async function deleteImage(id) {
    try {
      await removeImageRequest(id)
      messages.value = messages.value.filter((item) => item.id !== id)
      history.value = history.value.filter((item) => item.id !== id)
      toastStore.success('已删除该图片')
    } catch (error) {
      toastStore.error(resolveErrorMessage(error))
      throw error
    }
  }

  function clearError() {
    errorMessage.value = ''
  }

  async function retryLoadFromHistory(failedItem) {
    try {
      const recentImage = await recoverImageFromHistory({
        prompt: failedItem.prompt,
        pendingId: failedItem.id,
        startedAt: failedItem.requestStartedAt || failedItem.createdAt,
        delays: historyManualRetryDelaysMs,
        quiet: true,
      })

      if (recentImage) {
        toastStore.success('图片已找到并恢复显示')
      } else {
        toastStore.error('未在历史记录中找到该图片，可稍后再试一次')
      }
    } catch (error) {
      toastStore.error('加载历史记录失败')
    }
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
    tokenSource,
    imageSize,
    imageQuality,
    contributors,
    setTokenSource,
    setImageSize,
    setImageQuality,
    restoreMessages,
    loadHistory,
    loadContributors,
    setSelectedFile,
    clearSelectedFile,
    submitPrompt,
    deleteImage,
    clearError,
    retryLoadFromHistory,
  }
})
