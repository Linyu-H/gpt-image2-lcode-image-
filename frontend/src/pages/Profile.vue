<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import AvatarConfirmModal from '../components/AvatarConfirmModal.vue'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const toastStore = useToastStore()
const avatarInput = ref(null)
const avatarStyle = ref('')
const previewId = ref('')
const previewUrl = ref('')
const previewOpen = ref(false)
const previewSaving = ref(false)
const previewLoading = ref(false)

const profile = computed(() => userStore.profile || {})
const avatarUrl = computed(() => profile.value.avatarUrl || '/lcode-image-logo.png')

async function loadPage() {
  await userStore.loadProfile()
}

function openFilePicker() {
  avatarInput.value?.click()
}

async function handleAvatarUpload(event) {
  const [file] = event.target.files || []
  if (!file) return

  previewLoading.value = true
  try {
    const result = await userStore.createAvatarUploadPreview(file)
    previewId.value = result.previewId
    previewUrl.value = result.imageUrl
    previewOpen.value = true
  } catch (error) {
    toastStore.error(error.response?.data?.message || '头像上传失败')
  } finally {
    previewLoading.value = false
    event.target.value = ''
  }
}

async function generateAvatar() {
  previewLoading.value = true
  try {
    const result = await userStore.createAvatarGenerationPreview(avatarStyle.value)
    previewId.value = result.previewId
    previewUrl.value = result.imageUrl
    previewOpen.value = true
  } catch (error) {
    toastStore.error(error.response?.data?.message || '头像生成失败')
  } finally {
    previewLoading.value = false
  }
}

async function confirmAvatar() {
  if (!previewId.value) return
  previewSaving.value = true
  try {
    await userStore.confirmAvatarPreview(previewId.value)
    previewOpen.value = false
    previewId.value = ''
    previewUrl.value = ''
    toastStore.success('头像已保存')
  } catch (error) {
    toastStore.error(error.response?.data?.message || '头像保存失败')
  } finally {
    previewSaving.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <AppLayout>
    <section class="card profile-page">
      <div class="profile-header">
        <div class="profile-identity">
          <img class="profile-avatar" :src="avatarUrl" alt="用户头像" />
          <div>
            <p class="profile-eyebrow">个人主页</p>
            <h1 class="section-title">{{ profile.username || userStore.user?.username || '未登录用户' }}</h1>
            <p class="muted section-copy">累计生成 {{ profile.generationCount ?? 0 }} 张图片</p>
          </div>
        </div>
      </div>

      <div class="profile-grid">
        <section class="card profile-panel">
          <h2>更换头像</h2>
          <p class="muted">你可以上传自己的头像，也可以直接使用 AI 生成一张新头像。生成后会先预览，确认后才会正式保存。</p>
          <div class="profile-actions">
            <button type="button" class="button-secondary" :disabled="previewLoading" @click="openFilePicker">上传头像</button>
            <input ref="avatarInput" class="hidden-input" type="file" accept="image/*" @change="handleAvatarUpload" />
          </div>

          <label class="profile-field">
            <span>AI 头像风格</span>
            <textarea v-model="avatarStyle" class="textarea" rows="4" placeholder="例如：温柔插画风、蓝绿色调、简洁背景、戴眼镜。" />
          </label>
          <button type="button" class="button-primary" :disabled="previewLoading" @click="generateAvatar">
            {{ previewLoading ? '处理中...' : 'AI 生成头像' }}
          </button>
        </section>

        <section class="card profile-panel">
          <h2>当前资料</h2>
          <div class="profile-info muted">
            <p>用户名：<strong>{{ profile.username || userStore.user?.username || '-' }}</strong></p>
            <p>累计生成：<strong>{{ profile.generationCount ?? 0 }}</strong></p>
            <p>头像更新时间：<strong>{{ profile.avatarUpdatedAt || '尚未设置' }}</strong></p>
            <p>配置更新时间：<strong>{{ profile.updatedAt || '-' }}</strong></p>
          </div>
        </section>
      </div>
    </section>

    <AvatarConfirmModal
      :open="previewOpen"
      :preview-url="previewUrl"
      :loading="previewSaving"
      @close="previewOpen = false"
      @confirm="confirmAvatar"
    />
  </AppLayout>
</template>

<style scoped>
.profile-page {
  padding: 22px;
}

.profile-header {
  margin-bottom: 22px;
}

.profile-identity {
  display: flex;
  align-items: center;
  gap: 18px;
}

.profile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 32px;
  object-fit: cover;
  background: var(--color-card-muted);
}

.profile-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.profile-panel {
  padding: 20px;
}

.profile-actions {
  display: flex;
  gap: 10px;
  margin: 18px 0;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.profile-info p {
  margin: 0 0 12px;
}

.hidden-input {
  display: none;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 18px;
  }

  .profile-identity {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
