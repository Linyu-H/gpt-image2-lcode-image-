import { db } from '../db/index.js'
import { normalizePublicImageUrl, removeStoredImage } from './imageStorageService.js'

function normalizeAdminImage(image) {
  if (!image) {
    return null
  }

  return {
    ...image,
    imageUrl: normalizePublicImageUrl(image.imageUrl, image.storagePath),
  }
}

export function markCommunityPostsDeletedByImageId(imageId) {
  db.prepare(`UPDATE community_posts SET status = 'deleted' WHERE image_id = ? AND status = 'active'`).run(imageId)
}

export function listGeneratedImagesForAdmin() {
  return db.prepare(`
    SELECT
      generated_images.id,
      generated_images.user_id as userId,
      users.username,
      generated_images.prompt,
      generated_images.agent,
      generated_images.image_url as imageUrl,
      generated_images.storage_path as storagePath,
      generated_images.source_type as sourceType,
      generated_images.created_at as createdAt,
      generated_images.expires_at as expiresAt,
      generated_images.status,
      'generated' as resourceType
    FROM generated_images
    LEFT JOIN users ON users.id = generated_images.user_id
    ORDER BY generated_images.created_at DESC
  `).all().map(normalizeAdminImage)
}

export function getGeneratedImageByIdForAdmin(imageId) {
  return normalizeAdminImage(db.prepare(`
    SELECT
      generated_images.id,
      generated_images.storage_path as storagePath,
      generated_images.image_url as imageUrl,
      generated_images.status
    FROM generated_images
    WHERE id = ?
  `).get(imageId))
}

export function deleteGeneratedImageRecord(image) {
  if (!image) return false
  removeStoredImage(image.storagePath || image.storage_path)
  db.prepare(`UPDATE generated_images SET status = 'deleted' WHERE id = ?`).run(image.id)
  markCommunityPostsDeletedByImageId(image.id)
  return true
}

export function clearAllActiveGeneratedImages() {
  const images = db.prepare(`
    SELECT id, storage_path as storagePath, image_url as imageUrl, status
    FROM generated_images
    WHERE status = 'active'
  `).all().map(normalizeAdminImage)
  const runClear = db.transaction(() => {
    for (const image of images) {
      deleteGeneratedImageRecord(image)
    }
  })
  runClear()
  return images.length
}
