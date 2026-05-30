<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { deleteCommunityPost, fetchCommunityPostDetail } from '../api/image'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'
import { formatDateTime } from '../utils/datetime'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const userStore = useUserStore()
const post = ref(null)
const loading = ref(false)
const missing = ref(false)
const confirmDialogOpen = ref(false)

const isOwner = computed(() => userStore.user?.id === post.value?.userId)

async function loadPost() {
  loading.value = true
  missing.value = false
  try {
    post.value = await fetchCommunityPostDetail(route.params.id)
  } catch (error) {
    post.value = null
    if (error.response?.status === 404) {
      missing.value = true
      return
    }
    toastStore.error(error.response?.data?.message || '帖子加载失败')
  } finally {
    loading.value = false
  }
}

async function removePost() {
  if (!post.value) return
  confirmDialogOpen.value = true
}

async function handleConfirmDelete() {
  if (!post.value) return

  try {
    await deleteCommunityPost(post.value.id)
    toastStore.success('帖子已删除')
    router.push('/community')
  } catch (error) {
    toastStore.error(error.response?.data?.message || '帖子删除失败')
  } finally {
    confirmDialogOpen.value = false
  }
}

function handleCancelDelete() {
  confirmDialogOpen.value = false
}

onMounted(loadPost)
</script>

<template>
  <AppLayout>
    <section class="card detail-page">
      <div class="detail-topbar">
        <RouterLink to="/community" class="button-secondary detail-back">返回社区</RouterLink>
      </div>

      <div v-if="loading" class="detail-empty muted">正在加载帖子内容...</div>
      <div v-else-if="missing" class="detail-empty">
        <h1 class="section-title">帖子已失效</h1>
        <p class="muted">这条帖子可能已经删除，或已随图片一起过期。</p>
      </div>
      <article v-else-if="post" class="detail-card">
        <div class="detail-author">
          <img class="detail-avatar" :src="post.avatarUrl || '/lcode-image-logo.png'" alt="用户头像" />
          <div class="detail-author-info">
            <strong>
              {{ post.username }}
              <span v-if="post.authorIsContributor" class="detail-contributor" title="该用户开放了个人 API 共享">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 2 14.09 8.26 20.5 8.27l-5.18 3.76L17.18 19 12 15.27 6.82 19l1.86-6.97L3.5 8.27l6.41-.01Z" />
                </svg>
                贡献者
              </span>
            </strong>
            <p class="muted">发布于 {{ formatDateTime(post.createdAt) }}</p>
            <p class="muted">到期时间：{{ formatDateTime(post.expiresAt) }}</p>
          </div>
        </div>

        <img class="detail-image" :src="post.imageUrl" :alt="post.prompt" />

        <div class="detail-block">
          <h1 class="section-title">帖子正文</h1>
          <p class="detail-content">{{ post.content }}</p>
        </div>

        <div class="detail-block">
          <h2>Prompt</h2>
          <p class="muted detail-prompt">{{ post.prompt }}</p>
        </div>

        <div v-if="isOwner" class="detail-actions">
          <button type="button" class="button-danger" @click="removePost">删除帖子</button>
        </div>
      </article>
      <div v-else class="detail-empty muted">帖子加载失败，请稍后重试。</div>
    </section>

    <ConfirmDialog
      :open="confirmDialogOpen"
      title="删除帖子"
      message="确认删除这条帖子吗？删除后无法恢复。"
      confirm-text="删除"
      cancel-text="取消"
      danger
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
      @close="confirmDialogOpen = false"
    />
  </AppLayout>
</template>

<style scoped>
.detail-page {
  padding: 22px;
}

.detail-topbar {
  margin-bottom: 18px;
}

.detail-back {
  text-decoration: none;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-author {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.detail-author-info {
  min-width: 0;
}

.detail-author-info strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.detail-contributor {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: 12px;
  font-weight: 700;
}

.detail-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  object-fit: cover;
  background: var(--color-card-muted);
}

.detail-image {
  width: 100%;
  max-height: 720px;
  object-fit: contain;
  border-radius: 22px;
  background: var(--color-card-muted);
}

.detail-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-block h2,
.detail-block .section-title {
  margin: 0;
}

.detail-content,
.detail-prompt {
  margin: 0;
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
}

.detail-empty {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

@media (max-width: 768px) {
  .detail-page {
    padding: 18px;
  }

  .detail-image {
    max-height: 420px;
  }
}
</style>
