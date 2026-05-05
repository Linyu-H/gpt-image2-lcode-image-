<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../../layouts/AppLayout.vue'
import { clearAllAdminImages, deleteAdminImage, fetchAdminImages } from '../../api/admin'
import { useI18nStore } from '../../stores/i18n'
import { useToastStore } from '../../stores/toast'

const i18n = useI18nStore()
const toastStore = useToastStore()
const images = ref([])
const loading = ref(false)

async function loadImages() {
  images.value = await fetchAdminImages()
}

async function deleteAdminImageAction(image) {
  if (!window.confirm(i18n.t('confirmDeleteImage'))) return

  const result = await deleteAdminImage(image.id)
  toastStore.success(result.message)
  await loadImages()
}

async function clearAllAdminImagesAction() {
  if (!window.confirm(i18n.t('confirmClearImages'))) return

  const result = await clearAllAdminImages()
  toastStore.success(result.message)
  await loadImages()
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
  <AppLayout>
    <div class="admin-page-shell">
      <section class="card admin-card admin-main-card">
        <div class="section-head">
          <div>
            <p class="admin-eyebrow">{{ i18n.t('adminDashboard') }}</p>
            <h1 class="section-title">{{ i18n.t('adminImages') }}</h1>
          </div>
          <div class="head-actions">
            <RouterLink to="/admin" class="button-secondary admin-link-button">{{ i18n.t('adminOverview') }}</RouterLink>
            <button class="button-danger" type="button" @click="clearAllAdminImagesAction">{{ i18n.t('clearGeneratedImages') }}</button>
          </div>
        </div>

        <div v-if="loading" class="muted loading-copy">Loading...</div>
        <div v-else class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
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
              <tr v-for="image in images" :key="image.id">
                <td><img class="admin-thumb" :src="image.imageUrl" :alt="image.prompt" loading="lazy" /></td>
                <td>{{ image.username || image.userId || i18n.t('visitor') }}</td>
                <td class="prompt-cell">{{ image.prompt }}</td>
                <td>{{ image.sourceType }}</td>
                <td>{{ image.resourceType === 'featured' ? i18n.t('featuredExampleResource') : i18n.t('generatedImageResource') }}</td>
                <td>{{ image.createdAt }}</td>
                <td>{{ image.expiresAt }}</td>
                <td>{{ image.status }}</td>
                <td>
                  <button class="button-danger" type="button" :disabled="image.status !== 'active' || image.resourceType === 'featured'" @click="deleteAdminImageAction(image)">{{ i18n.t('delete') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside class="admin-section-nav card" aria-label="后台导航">
        <RouterLink to="/admin/users" class="admin-section-link">{{ i18n.t('adminUsers') }}</RouterLink>
        <RouterLink to="/admin/images" class="admin-section-link active">{{ i18n.t('adminImages') }}</RouterLink>
      </aside>
    </div>
  </AppLayout>
</template>

<style scoped>
.admin-page-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 18px;
  align-items: start;
}

.admin-card,
.admin-section-nav {
  padding: 22px;
}

.admin-main-card {
  min-width: 0;
}

.admin-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.section-head,
.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-head {
  justify-content: space-between;
  margin-bottom: 16px;
}

.head-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-link-button {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
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
  padding: 12px 10px;
  border-bottom: 1px solid rgba(120, 130, 170, 0.16);
  vertical-align: top;
  text-align: left;
}

.admin-thumb {
  width: 68px;
  height: 68px;
  object-fit: cover;
  border-radius: 16px;
  display: block;
}

.prompt-cell {
  max-width: 320px;
  white-space: pre-wrap;
}

.admin-section-nav {
  position: sticky;
  top: 124px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-section-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-card-muted);
  color: var(--color-text-secondary);
  text-decoration: none;
}

.admin-section-link.active {
  color: var(--color-text-soft);
  background: var(--color-primary-soft);
}

.loading-copy {
  padding: 24px 0;
}

@media (max-width: 1024px) {
  .admin-page-shell {
    grid-template-columns: 1fr;
  }

  .admin-section-nav {
    position: static;
    order: -1;
    flex-direction: row;
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .admin-card,
  .admin-section-nav {
    padding: 18px;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .head-actions {
    justify-content: flex-start;
  }
}
</style>
