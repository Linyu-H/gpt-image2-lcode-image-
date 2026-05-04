import cron from 'node-cron'
import { refreshFeaturedExample, ensureFeaturedExample } from './featuredExampleService.js'

let featuredExampleTask = null

export function startFeaturedExampleJob() {
  if (featuredExampleTask) {
    featuredExampleTask.stop()
  }

  featuredExampleTask = cron.schedule('0 0 * * *', () => {
    refreshFeaturedExample().catch(() => {})
  })

  ensureFeaturedExample().catch(() => {})
}
