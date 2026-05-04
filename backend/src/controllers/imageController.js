import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/index.js'
import { generateImage } from '../services/chatgptSessionService.js'
import { deleteGeneratedImageRecord } from '../services/generatedImageAdminService.js'
import { saveImageFromUrl } from '../services/imageStorageService.js'
import { validatePrompt } from '../services/promptGuardService.js'
import { addDays, nowIso } from '../utils/time.js'
import { decrypt } from '../services/encryptionService.js'

function resolveAccessToken(req) {
  const settings = db.prepare('SELECT shared_token_encrypted, image_api_base_url, site_base_url FROM admin_settings WHERE id = 1').get()
  const adminBaseUrl = settings?.image_api_base_url || ''
  const profile = req.user
    ? db.prepare('SELECT personal_token_encrypted, personal_image_api_base_url FROM user_profiles WHERE user_id = ?').get(req.user.id)
    : null
  const userToken = decrypt(profile?.personal_token_encrypted || '')
  const userBaseUrl = profile?.personal_image_api_base_url || ''

  if (req.user && userToken) {
    const baseUrl = userBaseUrl || adminBaseUrl
    if (!baseUrl) {
      const error = new Error('请先填写你自己的图片 API 地址，或使用管理员配置的地址')
      error.status = 400
      throw error
    }

    return {
      accessToken: userToken,
      baseUrl,
      sourceType: 'private',
      userId: req.user.id,
    }
  }

  if (!adminBaseUrl) {
    const error = new Error('管理员尚未配置图片 API 地址')
    error.status = 400
    throw error
  }

  const sharedToken = decrypt(settings?.shared_token_encrypted || '')
  if (!sharedToken) {
    const error = new Error('管理员尚未配置共享身份令牌')
    error.status = 400
    throw error
  }

  return {
    accessToken: sharedToken,
    baseUrl: adminBaseUrl,
    sourceType: 'shared',
    userId: req.user?.id || null,
  }
}

function removeUploadedFile(file) {
  if (!file?.path) return
  try {
    fs.unlinkSync(file.path)
  } catch {}
}

export async function generate(req, res, next) {
  try {
    const { prompt, agent = 'image' } = req.body
    validatePrompt(prompt)

    const { accessToken, baseUrl, sourceType, userId } = resolveAccessToken(req)
    const upstream = await generateImage({ prompt, agent, accessToken, baseUrl, inputImage: req.file || null })
    const stored = await saveImageFromUrl(upstream.imageUrl)
    const finalImageUrl = stored.publicUrl

    const id = uuidv4()
    const createdAt = nowIso()
    const expiresAt = addDays(new Date(), 3).toISOString()
    const requestIp = req.ip || req.headers['x-forwarded-for'] || 'unknown'

    db.prepare(`
      INSERT INTO generated_images (id, user_id, prompt, agent, image_url, storage_path, source_type, created_at, expires_at, status, request_ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(id, userId, prompt, agent, finalImageUrl, stored.absolutePath, sourceType, createdAt, expiresAt, requestIp)

    db.prepare('INSERT INTO generation_logs (user_id, request_ip, prompt, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(userId, requestIp, prompt, 'success', createdAt)

    res.json({
      id,
      prompt,
      agent,
      imageUrl: finalImageUrl,
      createdAt,
      expiresAt,
      sourceType,
    })
  } catch (error) {
    const requestIp = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    db.prepare('INSERT INTO generation_logs (user_id, request_ip, prompt, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(req.user?.id || null, requestIp, req.body?.prompt || '', 'failed', nowIso())
    next(error)
  } finally {
    removeUploadedFile(req.file)
  }
}

export function getHistory(req, res) {
  const items = req.user
    ? db.prepare(`
      SELECT id, prompt, agent, image_url as imageUrl, source_type as sourceType, created_at as createdAt, expires_at as expiresAt, status
      FROM generated_images
      WHERE status = 'active' AND user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id)
    : db.prepare(`
      SELECT id, prompt, agent, image_url as imageUrl, source_type as sourceType, created_at as createdAt, expires_at as expiresAt, status
      FROM generated_images
      WHERE status = 'active' AND user_id IS NULL
      ORDER BY created_at DESC
    `).all()

  res.json(items)
}

export function deleteImage(req, res) {
  const image = req.user
    ? db.prepare('SELECT id, storage_path FROM generated_images WHERE id = ? AND user_id = ? AND status = \'active\'').get(req.params.id, req.user.id)
    : db.prepare('SELECT id, storage_path FROM generated_images WHERE id = ? AND user_id IS NULL AND status = \'active\'').get(req.params.id)

  if (!image) {
    return res.status(404).json({ message: '图片不存在' })
  }

  deleteGeneratedImageRecord(image)
  res.json({ message: '图片已删除' })
}
