<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import CommunityPostComposer from '../components/CommunityPostComposer.vue'
import ImageCard from '../components/ImageCard.vue'
import { createCommunityPost } from '../api/image'
import { useChatStore } from '../stores/chat'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'

const chatStore = useChatStore()
const userStore = useUserStore()
const toastStore = useToastStore()
const composerOpen = ref(false)
const selectedImage = ref(null)

const historyCopy = computed(() => userStore.isLoggedIn
  ? '这里只展示当前账号名下最近 3 天内仍有效的生成图片。你可以复用 Prompt、查看原图、删除记录，或把自己的作品发布到社区。'
  : '这里只展示当前游客态最近 3 天内仍有效的生成图片。登录账号后，历史记录会按账号独立保存。')

function openComposer(item) {
  if (!userStore.isLoggedIn) {
    toastStore.error('请先登录账号后再发布到社区')
    return
  }
  selectedImage.value = item
  composerOpen.value = true
}

async function submitPost(payload) {
  try {
    await createCommunityPost(payload)
    composerOpen.value = false
    selectedImage.value = null
    toastStore.success('已发布到社区')
  } catch (error) {
    toastStore.error(error.response?.data?.message || '发布失败')
  }
}

onMounted(() => {
  chatStore.loadHistory()
})
</script>

<template>
  <AppLayout>
    <section class="card history-page">
      <div class="history-header">
        <div>
          <p class="history-eyebrow">最近创作</p>
          <h1 class="section-title">你的图片历史</h1>
          <p class="muted section-copy">{{ historyCopy }}</p>
        </div>
        <div class="history-stat muted">
          当前有效 {{ chatStore.history.length }} 张
        </div>
      </div>

      <div v-if="chatStore.history.length" class="history-grid">
        <ImageCard
          v-for="item in chatStore.history"
          :key="item.id"
          :item="item"
          :allow-post="userStore.isLoggedIn"
          @delete="chatStore.deleteImage($event)"
          @reuse="chatStore.draft = $event"
          @post="openComposer"
        />
      </div>
      <div v-else class="empty-history">
        <div class="empty-history-orb" />
        <p class="muted">暂无历史记录，先去首页生成你的第一张图片吧。</p>
      </div>
    </section>

    <CommunityPostComposer :open="composerOpen" :image="selectedImage" @close="composerOpen = false" @submit="submitPost" />
  </AppLayout>
</template>

<style scoped>
.history-page {
  padding: 22px;
}

.history-header {
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
}

.history-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.history-stat {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  white-space: nowrap;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.empty-history {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-history-orb {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-bottom: 16px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), var(--color-primary-soft));
  box-shadow: var(--shadow-soft);
}

@media (max-width: 768px) {
  .history-page {
    padding: 18px;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
