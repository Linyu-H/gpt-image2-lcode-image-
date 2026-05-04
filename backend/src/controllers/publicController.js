import { db } from '../db/index.js'
import { getCurrentFeaturedExample } from '../services/featuredExampleService.js'

export function getFeaturedExample(req, res) {
  const example = getCurrentFeaturedExample()

  res.json({
    prompt: example?.prompt || '',
    imageUrl: example?.imageUrl || '',
    updatedAt: example?.updatedAt || '',
  })
}

export function getAnnouncement(req, res) {
  const announcement = db.prepare(`
    SELECT title, content, is_enabled as isEnabled, updated_at as updatedAt
    FROM site_announcements
    WHERE id = 1
  `).get()

  if (!announcement || !announcement.isEnabled) {
    return res.json({ title: '', content: '', isEnabled: false, updatedAt: '' })
  }

  res.json({
    title: announcement.title || '',
    content: announcement.content || '',
    isEnabled: announcement.isEnabled === 1,
    updatedAt: announcement.updatedAt || '',
  })
}
