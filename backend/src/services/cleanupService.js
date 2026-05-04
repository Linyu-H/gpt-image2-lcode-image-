import cron from 'node-cron'
import { db } from '../db/index.js'
import { removeStoredImage } from './imageStorageService.js'

let cleanupTask = null

export function runExpiredCleanup() {
  const expiredImages = db.prepare(`
    SELECT id, storage_path
    FROM generated_images
    WHERE status = 'active' AND expires_at <= ?
  `).all(new Date().toISOString())

  for (const image of expiredImages) {
    removeStoredImage(image.storage_path)
    db.prepare(`UPDATE generated_images SET status = 'deleted' WHERE id = ?`).run(image.id)
  }

  return expiredImages.length
}

export function startCleanupJob(cronExpression) {
  if (cleanupTask) {
    cleanupTask.stop()
  }

  cleanupTask = cron.schedule(cronExpression, () => {
    runExpiredCleanup()
  })
}
