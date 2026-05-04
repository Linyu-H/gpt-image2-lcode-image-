<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  image: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'submit'])
const form = reactive({ content: '' })
const loading = ref(false)
const error = ref('')

watch(() => props.open, (value) => {
  if (value) {
    form.content = ''
    error.value = ''
    loading.value = false
  }
})

async function submit() {
  if (!props.image?.id) return
  const content = form.content.trim()
  if (!content) {
    error.value = '请填写想分享的内容'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await emit('submit', { imageId: props.image.id, content })
  } catch (err) {
    error.value = err?.message || '发布失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open && image" class="composer-overlay" @click.self="emit('close')">
      <section class="composer-modal card" role="dialog" aria-modal="true" aria-labelledby="community-post-title">
        <div class="composer-header">
          <div>
            <p class="composer-eyebrow">发布到社区</p>
            <h2 id="community-post-title">分享这张图片</h2>
          </div>
          <button type="button" class="button-secondary icon-button" aria-label="关闭发布窗口" @click="emit('close')">×</button>
        </div>

        <div class="composer-preview">
          <img :src="image.imageUrl" :alt="image.prompt" loading="lazy" />
          <p class="muted">{{ image.prompt }}</p>
        </div>

        <label class="composer-field">
          <span>分享文字</span>
          <textarea v-model="form.content" class="textarea" rows="5" placeholder="说说这张图的灵感、用途或你想表达的内容。" />
        </label>

        <p v-if="error" class="composer-error">{{ error }}</p>

        <div class="composer-actions">
          <button type="button" class="button-secondary" @click="emit('close')">取消</button>
          <button type="button" class="button-primary" :disabled="loading" @click="submit">
            {{ loading ? '发布中...' : '确认发布' }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.composer-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(10px);
}

.composer-modal {
  width: min(640px, 100%);
  padding: 22px;
}

.composer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.composer-eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.composer-header h2 {
  margin: 0;
}

.composer-preview {
  margin-top: 18px;
}

.composer-preview img {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 18px;
  display: block;
  background: var(--color-card-muted);
}

.composer-field {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.composer-error {
  margin: 12px 0 0;
  color: var(--color-danger);
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.icon-button {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}
</style>
