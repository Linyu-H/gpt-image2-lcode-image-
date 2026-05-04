<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import { deleteCommunityPost, fetchCommunityPostDetail } from '../api/image'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const userStore = useUserStore()
const post = ref(null)
const loading = ref(false)
const missing = ref(false)

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
  if (!post.value) {
    return
  }

  if (!window.confirm('确认删除这条帖子吗？')) {
    return
  }

  try {
    await deleteCommunityPost(post.value.id)
    toastStore.success('帖子已删除')
    router.push('/community')
  } catch (error) {
    toastStore.error(error.response?.data?.message || '帖子删除失败')
  }
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
          <div>
            <strong>{{ post.username }}</strong>
            <p class="muted">发布于 {{ post.createdAt }}</p>
            <p class="muted">到期时间：{{ post.expiresAt }}</p>
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
