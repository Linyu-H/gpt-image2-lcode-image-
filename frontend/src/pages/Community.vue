<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { deleteCommunityPost, fetchCommunityFeed } from '../api/image'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'
import { formatDateTime } from '../utils/datetime'

const toastStore = useToastStore()
const userStore = useUserStore()
const posts = ref([])
const loading = ref(false)
const confirmDialogOpen = ref(false)
const pendingDeletePost = ref(null)

async function loadFeed() {
  loading.value = true
  try {
    posts.value = await fetchCommunityFeed()
  } catch (error) {
    toastStore.error(error.response?.data?.message || '社区内容加载失败')
  } finally {
    loading.value = false
  }
}

async function removePost(post) {
  pendingDeletePost.value = post
  confirmDialogOpen.value = true
}

async function handleConfirmDelete() {
  if (!pendingDeletePost.value) return

  try {
    await deleteCommunityPost(pendingDeletePost.value.id)
    toastStore.success('帖子已删除')
    await loadFeed()
  } catch (error) {
    toastStore.error(error.response?.data?.message || '帖子删除失败')
  } finally {
    pendingDeletePost.value = null
    confirmDialogOpen.value = false
  }
}

function handleCancelDelete() {
  pendingDeletePost.value = null
  confirmDialogOpen.value = false
}

onMounted(loadFeed)
</script>

<template>
  <AppLayout>
    <section class="card community-page">
      <div class="community-header">
        <div>
          <p class="community-eyebrow">社区广场</p>
          <h1 class="section-title">最近分享</h1>
          <p class="muted section-copy">这里只展示仍在有效期内的公开分享，帖子会随着图片一起在 3 天后自动失效。</p>
        </div>
      </div>

      <div v-if="loading" class="empty-community muted">正在加载社区内容...</div>
      <div v-else-if="posts.length" class="community-list">
        <article v-for="post in posts" :key="post.id" class="card community-card">
          <div class="community-author">
            <img class="community-avatar" :src="post.avatarUrl || '/lcode-image-logo.png'" alt="用户头像" />
            <div class="community-author-info">
              <strong>
                {{ post.username }}
                <span v-if="post.authorIsContributor" class="contributor-tag" title="该用户开放了个人 API 共享">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 2 14.09 8.26 20.5 8.27l-5.18 3.76L17.18 19 12 15.27 6.82 19l1.86-6.97L3.5 8.27l6.41-.01Z" />
                  </svg>
                  贡献者
                </span>
              </strong>
              <p class="muted">发布于 {{ formatDateTime(post.createdAt) }}</p>
            </div>
          </div>

          <RouterLink :to="`/community/${post.id}`" class="community-image-link">
            <img class="community-image" :src="post.imageUrl" :alt="post.prompt" loading="lazy" />
          </RouterLink>
          <p class="community-content">{{ post.content }}</p>
          <RouterLink :to="`/community/${post.id}`" class="community-more">查看全文</RouterLink>
          <p class="muted community-prompt">Prompt：{{ post.prompt }}</p>
          <p class="muted community-expire">到期时间：{{ formatDateTime(post.expiresAt) }}</p>
          <div v-if="userStore.user?.id === post.userId" class="community-actions">
            <button type="button" class="button-danger" @click="removePost(post)">删除帖子</button>
          </div>
        </article>
      </div>
      <div v-else class="empty-community muted">社区里还没有内容，去历史记录页发布你的第一条分享吧。</div>
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
.community-page {
  padding: 22px;
}

.community-header {
  margin-bottom: 22px;
}

.community-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.community-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.community-card {
  padding: 16px;
}

.community-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.community-author-info {
  min-width: 0;
}

.community-author-info strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.contributor-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.community-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  object-fit: cover;
  background: var(--color-card-muted);
}

.community-image-link {
  display: block;
}

.community-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 18px;
  display: block;
  background: var(--color-card-muted);
}

.community-content {
  margin: 14px 0 0;
  line-height: 1.7;
  color: var(--color-text-soft);
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.community-more {
  display: inline-flex;
  width: fit-content;
  margin-top: 10px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.community-prompt,
.community-expire {
  margin: 12px 0 0;
}

.community-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.empty-community {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

@media (max-width: 768px) {
  .community-page {
    padding: 18px;
  }
}
</style>
