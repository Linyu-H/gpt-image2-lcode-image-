import { db } from '../db/index.js'
import { decrypt } from './encryptionService.js'
import { generateImage } from './chatgptSessionService.js'
import { normalizePublicImageUrl, saveImageFromUrl, removeStoredImage } from './imageStorageService.js'
import { nowIso } from '../utils/time.js'

const featuredRotationStartDate = '2026-05-04'

function readAdminSettings() {
  return db.prepare('SELECT shared_token_encrypted, image_api_base_url, site_base_url FROM admin_settings WHERE id = 1').get()
}

function resolveSharedGenerationConfig() {
  const settings = readAdminSettings()
  const accessToken = decrypt(settings?.shared_token_encrypted || '')
  const baseUrl = settings?.image_api_base_url || ''

  if (!baseUrl) {
    const error = new Error('管理员尚未配置图片 API 地址')
    error.status = 400
    throw error
  }

  if (!accessToken) {
    const error = new Error('管理员尚未配置共享身份令牌')
    error.status = 400
    throw error
  }

  return {
    accessToken,
    baseUrl,
  }
}

export function listFeaturedPrompts() {
  return db.prepare(`
    SELECT id, prompt, sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt
    FROM featured_prompts
    ORDER BY sort_order ASC, created_at ASC
  `).all()
}

export function createFeaturedPrompt(prompt) {
  const trimmedPrompt = String(prompt || '').trim()
  if (!trimmedPrompt) {
    const error = new Error('请先输入示例灵感内容')
    error.status = 400
    throw error
  }

  const nextSortOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as total FROM featured_prompts').get().total || 0) + 1
  const timestamp = nowIso()
  const result = db.prepare(`
    INSERT INTO featured_prompts (prompt, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(trimmedPrompt, nextSortOrder, timestamp, timestamp)

  return db.prepare(`
    SELECT id, prompt, sort_order as sortOrder, created_at as createdAt, updated_at as updatedAt
    FROM featured_prompts
    WHERE id = ?
  `).get(result.lastInsertRowid)
}

export function deleteFeaturedPrompt(id) {
  const total = db.prepare('SELECT COUNT(*) as total FROM featured_prompts').get().total
  if (total <= 1) {
    const error = new Error('至少保留一条示例灵感，不能全部删除')
    error.status = 400
    throw error
  }

  const prompt = db.prepare('SELECT id FROM featured_prompts WHERE id = ?').get(id)
  if (!prompt) {
    const error = new Error('示例灵感不存在')
    error.status = 404
    throw error
  }

  db.prepare('DELETE FROM featured_prompts WHERE id = ?').run(id)

  const prompts = db.prepare('SELECT id FROM featured_prompts ORDER BY sort_order ASC, created_at ASC').all()
  const updateSortOrder = db.prepare('UPDATE featured_prompts SET sort_order = ?, updated_at = ? WHERE id = ?')
  const timestamp = nowIso()
  const reorder = db.transaction(() => {
    prompts.forEach((item, index) => {
      updateSortOrder.run(index + 1, timestamp, item.id)
    })
  })
  reorder()
}

function getRotationIndex(totalPrompts, referenceDate = new Date()) {
  const startDate = new Date(`${featuredRotationStartDate}T00:00:00.000Z`)
  const currentDate = new Date(referenceDate)
  currentDate.setUTCHours(0, 0, 0, 0)
  const daysSinceStart = Math.max(0, Math.floor((currentDate.getTime() - startDate.getTime()) / 86400000))
  return daysSinceStart % totalPrompts
}

export function getCurrentFeaturedExample() {
  const example = db.prepare(`
    SELECT prompt_id as promptId, prompt, image_url as imageUrl, storage_path as storagePath, updated_at as updatedAt
    FROM featured_examples
    WHERE id = 1
  `).get()

  if (!example) {
    return null
  }

  return {
    promptId: example.promptId,
    prompt: example.prompt,
    imageUrl: normalizePublicImageUrl(example.imageUrl, example.storagePath),
    updatedAt: example.updatedAt,
  }
}

async function persistFeaturedExample(promptRecord, upstreamImage) {
  const existing = db.prepare('SELECT storage_path FROM featured_examples WHERE id = 1').get()
  const featuredColumns = db.prepare('PRAGMA table_info(featured_examples)').all().map((column) => column.name)
  const stored = await saveImageFromUrl(upstreamImage.imageUrl)
  const finalImageUrl = stored.publicUrl
  const timestamp = nowIso()

  if (featuredColumns.includes('prompt_index')) {
    db.prepare(`
      INSERT INTO featured_examples (id, prompt_index, prompt_id, prompt, image_url, storage_path, created_at, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        prompt_index = excluded.prompt_index,
        prompt_id = excluded.prompt_id,
        prompt = excluded.prompt,
        image_url = excluded.image_url,
        storage_path = excluded.storage_path,
        updated_at = excluded.updated_at
    `).run(promptRecord.sortOrder - 1, promptRecord.id, promptRecord.prompt, finalImageUrl, stored.absolutePath, timestamp, timestamp)
  } else {
    db.prepare(`
      INSERT INTO featured_examples (id, prompt_id, prompt, image_url, storage_path, created_at, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        prompt_id = excluded.prompt_id,
        prompt = excluded.prompt,
        image_url = excluded.image_url,
        storage_path = excluded.storage_path,
        updated_at = excluded.updated_at
    `).run(promptRecord.id, promptRecord.prompt, finalImageUrl, stored.absolutePath, timestamp, timestamp)
  }

  if (existing?.storage_path && existing.storage_path !== stored.absolutePath) {
    removeStoredImage(existing.storage_path)
  }

  return {
    promptId: promptRecord.id,
    prompt: promptRecord.prompt,
    imageUrl: finalImageUrl,
    updatedAt: timestamp,
  }
}

export async function generateFeaturedExampleForPrompt(promptRecord) {
  const { accessToken, baseUrl } = resolveSharedGenerationConfig()
  const upstream = await generateImage({ prompt: promptRecord.prompt, agent: 'image', accessToken, baseUrl })
  return persistFeaturedExample(promptRecord, upstream)
}

export async function refreshFeaturedExample(referenceDate = new Date()) {
  const prompts = listFeaturedPrompts()
  if (!prompts.length) {
    const error = new Error('当前没有可用的示例灵感')
    error.status = 400
    throw error
  }

  const promptRecord = prompts[getRotationIndex(prompts.length, referenceDate)]
  return generateFeaturedExampleForPrompt(promptRecord)
}

export async function ensureFeaturedExample() {
  const existing = getCurrentFeaturedExample()
  if (existing?.imageUrl) {
    return existing
  }

  return refreshFeaturedExample(new Date())
}
