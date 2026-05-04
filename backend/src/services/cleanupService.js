import cron from 'node-cron'
import { db } from '../db/index.js'
import { deleteGeneratedImageRecord } from './generatedImageAdminService.js'
import { removeStoredImage } from './imageStorageService.js'

let cleanupTask = null

export function runExpiredCleanup() {
  const now = new Date().toISOString()
  const expiredImages = db.prepare(`
    SELECT id, storage_path
    FROM generated_images
    WHERE status = 'active' AND expires_at <= ?
  `).all(now)

  const expiredAvatarPreviews = db.prepare(`
    SELECT id, storage_path
    FROM avatar_previews
    WHERE expires_at <= ?
  `).all(now)

  const runCleanup = db.transaction(() => {
    for (const image of expiredImages) {
      deleteGeneratedImageRecord(image)
    }

    for (const preview of expiredAvatarPreviews) {
      removeStoredImage(preview.storage_path)
      db.prepare('DELETE FROM avatar_previews WHERE id = ?').run(preview.id)
    }
  })

  runCleanup()
  return expiredImages.length + expiredAvatarPreviews.length
}

export function startCleanupJob(cronExpression) {
  if (cleanupTask) {
    cleanupTask.stop()
  }

  cleanupTask = cron.schedule(cronExpression, () => {
    runExpiredCleanup()
  })
}
