import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/index.js'
import { generateImage } from '../services/chatgptSessionService.js'
import { deleteGeneratedImageRecord } from '../services/generatedImageAdminService.js'
import { saveImageFromUrl } from '../services/imageStorageService.js'
import { validatePrompt } from '../services/promptGuardService.js'
import { addDays, nowIso } from '../utils/time.js'
import {
  buildSourceCandidates,
  disableContributorShare,
  listPublicContributors,
} from '../services/tokenSourceService.js'

function removeUploadedFile(file) {
  if (!file?.path) return
  try {
    fs.unlinkSync(file.path)
  } catch {}
}

function isUpstreamFailure(error) {
  if (!error) return false
  const status = Number(error.status || error.response?.status || 0)
  if (status >= 500) return true
  if ([401, 402, 403, 408, 429].includes(status)) return true
  if (['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'EAI_AGAIN'].includes(error.code)) return true
  return false
}

export function getContributors(req, res) {
  res.json(listPublicContributors({ excludeUserId: req.user?.id || null }))
}

export async function generate(req, res, next) {
  try {
    const { prompt, agent = 'image' } = req.body
    validatePrompt(prompt)

    const tokenSource = String(req.body?.tokenSource || '').trim()
    const candidates = buildSourceCandidates({
      requesterUserId: req.user?.id || null,
      tokenSource,
    })

    if (!candidates.length) {
      const error = new Error(
        tokenSource === 'own'
          ? '你还没有配置可用的个人身份令牌'
          : tokenSource === 'shared'
            ? '管理员尚未配置共享身份令牌或图片 API 地址'
            : tokenSource.startsWith('contributor:')
              ? '该贡献者已经关闭了共享，请换一个或使用自动模式'
              : '没有可用的图片生成配置，请配置个人令牌或等待管理员配置共享令牌',
      )
      error.status = 400
      throw error
    }

    const userId = req.user?.id || null
    const isAuto = tokenSource === 'auto'
    const tries = []
    let upstream = null
    let chosen = null
    let lastError = null

    for (const candidate of candidates) {
      try {
        upstream = await generateImage({
          prompt,
          agent,
          accessToken: candidate.accessToken,
          baseUrl: candidate.baseUrl,
          inputImage: req.file || null,
        })
        chosen = candidate
        break
      } catch (error) {
        lastError = error
        tries.push({ candidate, error })

        if (candidate.kind === 'contributor' && isUpstreamFailure(error)) {
          disableContributorShare(candidate.contributorUserId, error.message || '调用失败已自动关闭共享')
        }

        if (!isAuto || !isUpstreamFailure(error)) {
          throw error
        }
      }
    }

    if (!upstream || !chosen) {
      throw lastError || new Error('图片生成失败')
    }

    const stored = await saveImageFromUrl(upstream.imageUrl)
    const finalImageUrl = stored.publicUrl

    const id = uuidv4()
    const createdAt = nowIso()
    const expiresAt = addDays(new Date(), 3).toISOString()
    const requestIp = req.ip || req.headers['x-forwarded-for'] || 'unknown'

    db.prepare(`
      INSERT INTO generated_images (id, user_id, prompt, agent, image_url, storage_path, source_type, token_contributor_user_id, created_at, expires_at, status, request_ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(
      id,
      userId,
      prompt,
      agent,
      finalImageUrl,
      stored.absolutePath,
      chosen.sourceType,
      chosen.contributorUserId,
      createdAt,
      expiresAt,
      requestIp,
    )

    db.prepare('INSERT INTO generation_logs (user_id, request_ip, prompt, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(userId, requestIp, prompt, 'success', createdAt)

    const fallbackInfo = tries.length
      ? {
          attempted: tries.length,
          disabledContributors: tries
            .filter(({ candidate, error }) => candidate.kind === 'contributor' && isUpstreamFailure(error))
            .map(({ candidate }) => ({
              contributorUserId: candidate.contributorUserId,
              username: candidate.contributorUsername || '',
            })),
        }
      : null

    res.json({
      id,
      prompt,
      agent,
      imageUrl: finalImageUrl,
      createdAt,
      expiresAt,
      sourceType: chosen.sourceType,
      tokenSourceUsed: chosen.kind,
      contributorUserId: chosen.contributorUserId,
      contributorUsername: chosen.contributorUsername || '',
      fallback: fallbackInfo,
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
      SELECT
        generated_images.id,
        generated_images.prompt,
        generated_images.agent,
        generated_images.image_url as imageUrl,
        generated_images.source_type as sourceType,
        generated_images.created_at as createdAt,
        generated_images.expires_at as expiresAt,
        generated_images.status,
        generated_images.token_contributor_user_id as contributorUserId,
        contributor_user.username as contributorUsername
      FROM generated_images
      LEFT JOIN users as contributor_user ON contributor_user.id = generated_images.token_contributor_user_id
      WHERE generated_images.status = 'active' AND generated_images.user_id = ?
      ORDER BY generated_images.created_at DESC
    `).all(req.user.id)
    : db.prepare(`
      SELECT
        generated_images.id,
        generated_images.prompt,
        generated_images.agent,
        generated_images.image_url as imageUrl,
        generated_images.source_type as sourceType,
        generated_images.created_at as createdAt,
        generated_images.expires_at as expiresAt,
        generated_images.status,
        generated_images.token_contributor_user_id as contributorUserId,
        contributor_user.username as contributorUsername
      FROM generated_images
      LEFT JOIN users as contributor_user ON contributor_user.id = generated_images.token_contributor_user_id
      WHERE generated_images.status = 'active' AND generated_images.user_id IS NULL
      ORDER BY generated_images.created_at DESC
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
