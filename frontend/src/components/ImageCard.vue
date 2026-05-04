<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  allowPost: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['delete', 'reuse', 'post'])
const now = ref(Date.now())
let timer = null

const remainingText = computed(() => {
  const diff = new Date(props.item.expiresAt).getTime() - now.value
  if (diff <= 0) return '即将过期'
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  return `剩余 ${days} 天 ${hours} 小时 ${minutes} 分钟`
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 60000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <article class="image-card card">
    <div class="image-frame">
      <img class="image-preview" :src="item.imageUrl" :alt="item.prompt" loading="lazy" />
    </div>
    <div class="image-body">
      <div class="image-meta">
        <span class="source-chip">{{ item.sourceType === 'private' ? '个人身份令牌' : '共享身份令牌' }}</span>
        <span class="muted">{{ remainingText }}</span>
      </div>
      <p class="image-prompt">{{ item.prompt }}</p>
      <div class="image-actions">
        <button type="button" class="button-secondary" @click="emit('reuse', item.prompt)">复用 Prompt</button>
        <a class="button-secondary link-button" :href="item.imageUrl" target="_blank" rel="noreferrer">查看原图</a>
        <button v-if="allowPost" type="button" class="button-secondary" @click="emit('post', item)">发布到社区</button>
        <button type="button" class="button-danger" @click="emit('delete', item.id)">删除</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.image-card {
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-card:hover {
  transform: translateY(-2px);
}

.image-frame {
  padding: 12px 12px 0;
}

.image-preview {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
  background: var(--color-card-muted);
  border-radius: 18px;
}

.image-body {
  padding: 14px 14px 16px;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.source-chip {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
}

.image-prompt {
  margin: 0;
  line-height: 1.65;
  color: var(--color-text-soft);
}

.image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.link-button {
  display: inline-flex;
  align-items: center;
}
</style>
