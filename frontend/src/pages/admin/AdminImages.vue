<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { clearAllAdminImages, deleteAdminImage, fetchAdminImages } from '../../api/admin'
import { useI18nStore } from '../../stores/i18n'
import { useToastStore } from '../../stores/toast'
import { formatDateTime } from '../../utils/datetime'
import { extractErrorMessage } from '../../utils/errors'

const i18n = useI18nStore()
const toastStore = useToastStore()
const images = ref([])
const currentPage = ref(1)
const pageSize = 20
const loading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(images.value.length / pageSize)))
const pagedImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return images.value.slice(start, start + pageSize)
})

function normalizeCurrentPage() {
  currentPage.value = Math.min(currentPage.value, totalPages.value)
}

async function loadImages() {
  try {
    images.value = await fetchAdminImages()
    normalizeCurrentPage()
  } catch (error) {
    toastStore.error(extractErrorMessage(error, '加载图片列表失败'))
  }
}

async function deleteAdminImageAction(image) {
  if (!window.confirm(i18n.t('confirmDeleteImage'))) return

  try {
    const result = await deleteAdminImage(image.id)
    toastStore.success(result.message)
    await loadImages()
  } catch (error) {
    toastStore.error(extractErrorMessage(error, '图片删除失败'))
  }
}

async function clearAllAdminImagesAction() {
  if (!window.confirm(i18n.t('confirmClearImages'))) return

  try {
    const result = await clearAllAdminImages()
    toastStore.success(result.message)
    await loadImages()
  } catch (error) {
    toastStore.error(extractErrorMessage(error, '清空图片失败'))
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadImages()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminLayout>
    <div class="admin-content">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">{{ i18n.t('adminImages') }}</h1>
          <p class="admin-subtitle">查看和管理所有生成的图片资源</p>
        </div>
        <button class="button-danger" type="button" @click="clearAllAdminImagesAction">{{ i18n.t('clearGeneratedImages') }}</button>
      </div>

      <div v-if="loading" class="muted loading-copy">Loading...</div>
      <div v-else class="card admin-card">
          <table class="admin-table">
            <thead>
              <tr>
                <th class="index-col">#</th>
                <th>{{ i18n.t('imagePreview') }}</th>
                <th>{{ i18n.t('user') }}</th>
                <th>{{ i18n.t('prompt') }}</th>
                <th>{{ i18n.t('source') }}</th>
                <th>{{ i18n.t('resourceType') }}</th>
                <th>{{ i18n.t('createdAt') }}</th>
                <th>{{ i18n.t('expiresAt') }}</th>
                <th>{{ i18n.t('status') }}</th>
                <th>{{ i18n.t('action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(image, index) in pagedImages" :key="image.id">
                <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td><img class="admin-thumb" :src="image.imageUrl" :alt="image.prompt" loading="lazy" /></td>
                <td>{{ image.username || image.userId || i18n.t('visitor') }}</td>
                <td class="prompt-cell">{{ image.prompt }}</td>
                <td>{{ image.sourceType }}</td>
                <td>{{ image.resourceType === 'featured' ? i18n.t('featuredExampleResource') : i18n.t('generatedImageResource') }}</td>
                <td>{{ formatDateTime(image.createdAt) }}</td>
                <td>{{ formatDateTime(image.expiresAt) }}</td>
                <td>{{ image.status }}</td>
                <td>
                  <button class="button-danger" type="button" :disabled="image.status !== 'active' || image.resourceType === 'featured'" @click="deleteAdminImageAction(image)">{{ i18n.t('delete') }}</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="totalPages > 1" class="pagination">
            <button class="button-secondary" type="button" :disabled="currentPage === 1" @click="currentPage -= 1">上一页</button>
            <span class="pagination-copy">{{ currentPage }} / {{ totalPages }}</span>
            <button class="button-secondary" type="button" :disabled="currentPage === totalPages" @click="currentPage += 1">下一页</button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-content {
  max-width: 1600px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 32px;
}

.admin-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.admin-subtitle {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.admin-card {
  padding: 0;
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(120, 130, 170, 0.12);
  vertical-align: middle;
  text-align: left;
}

.admin-table th {
  background: var(--color-card-muted);
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.admin-table tbody tr {
  transition: background 0.2s ease;
}

.admin-table tbody tr:hover {
  background: var(--color-card-hover, rgba(120, 130, 170, 0.06));
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

.index-col {
  width: 56px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.index-col {
  width: 56px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 24px;
}

.pagination-copy {
  color: var(--color-text-secondary);
  font-size: 14px;
  min-width: 80px;
  text-align: center;
  font-weight: 500;
}

.admin-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  border: 2px solid var(--color-card-border, rgba(120, 130, 170, 0.12));
  background: var(--color-card-muted);
}

.prompt-cell {
  max-width: 360px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.loading-copy {
  padding: 32px 0;
  text-align: center;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .admin-title {
    font-size: 24px;
  }

  .pagination {
    justify-content: center;
    flex-wrap: wrap;
  }

  .admin-table th,
  .admin-table td {
    padding: 12px;
    font-size: 14px;
  }

  .prompt-cell {
    max-width: 240px;
  }
}
</style>
