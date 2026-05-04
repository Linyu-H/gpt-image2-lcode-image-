import { createApp } from './app.js'
import { env } from './config/env.js'
import { db } from './db/index.js'
import { startCleanupJob } from './services/cleanupService.js'
import { startFeaturedExampleJob } from './services/featuredExampleScheduler.js'

const app = createApp()
const settings = db.prepare('SELECT cleanup_cron FROM admin_settings WHERE id = 1').get()
startCleanupJob(settings?.cleanup_cron || env.defaultCleanupCron)
startFeaturedExampleJob()

app.listen(env.port, () => {
  console.log(`Backend server running at http://localhost:${env.port}`)
})
