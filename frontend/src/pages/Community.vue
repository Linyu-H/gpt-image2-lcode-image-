<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import { deleteCommunityPost, fetchCommunityFeed } from '../api/image'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'

const toastStore = useToastStore()
const userStore = useUserStore()
const posts = ref([])
const loading = ref(false)

async function loadFeed() {
  loading.value = true
  try {
    posts.value = await fetchCommunityFeed()
  } finally {
    loading.value = false
  }
}

async function removePost(post) {
  if (!window.confirm('确认删除这条帖子吗？')) {
    return
  }

  try {
    await deleteCommunityPost(post.id)
    toastStore.success('帖子已删除')
    await loadFeed()
  } catch (error) {
    toastStore.error(error.response?.data?.message || '帖子删除失败')
  }
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
            <div>
              <strong>{{ post.username }}</strong>
              <p class="muted">发布于 {{ post.createdAt }}</p>
            </div>
          </div>

          <RouterLink :to="`/community/${post.id}`" class="community-image-link">
            <img class="community-image" :src="post.imageUrl" :alt="post.prompt" loading="lazy" />
          </RouterLink>
          <p class="community-content">{{ post.content }}</p>
          <RouterLink :to="`/community/${post.id}`" class="community-more">查看全文</RouterLink>
          <p class="muted community-prompt">Prompt：{{ post.prompt }}</p>
          <p class="muted community-expire">到期时间：{{ post.expiresAt }}</p>
          <div v-if="userStore.user?.id === post.userId" class="community-actions">
            <button type="button" class="button-danger" @click="removePost(post)">删除帖子</button>
          </div>
        </article>
      </div>
      <div v-else class="empty-community muted">社区里还没有内容，去历史记录页发布你的第一条分享吧。</div>
    </section>
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
