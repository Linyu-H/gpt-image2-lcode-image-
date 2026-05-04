import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/index.js'
import { normalizePublicImageUrl } from '../services/imageStorageService.js'
import { nowIso } from '../utils/time.js'

function normalizePost(post) {
  if (!post) {
    return null
  }

  return {
    ...post,
    imageUrl: normalizePublicImageUrl(post.imageUrl, post.imageStoragePath),
    avatarUrl: normalizePublicImageUrl(post.avatarUrl, post.avatarStoragePath),
  }
}

function buildPostBaseQuery(whereClause = 'community_posts.status = \'active\'') {
  return `
    SELECT
      community_posts.id,
      community_posts.image_id as imageId,
      community_posts.image_url as imageUrl,
      generated_images.storage_path as imageStoragePath,
      community_posts.prompt,
      community_posts.content,
      community_posts.created_at as createdAt,
      community_posts.expires_at as expiresAt,
      users.id as userId,
      users.username,
      user_profiles.avatar_url as avatarUrl,
      user_profiles.avatar_storage_path as avatarStoragePath
    FROM community_posts
    JOIN users ON users.id = community_posts.user_id
    LEFT JOIN user_profiles ON user_profiles.user_id = users.id
    LEFT JOIN generated_images ON generated_images.id = community_posts.image_id
    WHERE ${whereClause}
  `
}

export function getCommunityFeed(req, res) {
  const posts = db.prepare(`${buildPostBaseQuery()} ORDER BY community_posts.created_at DESC`).all().map(normalizePost)

  res.json(posts)
}

export function getCommunityPostDetail(req, res) {
  const postId = String(req.params.id || '').trim()
  const post = normalizePost(db.prepare(buildPostBaseQuery("community_posts.id = ? AND community_posts.status = 'active'")).get(postId))

  if (!post) {
    return res.status(404).json({ message: '帖子不存在或已失效' })
  }

  res.json(post)
}

export function createPost(req, res) {
  const imageId = String(req.body?.imageId || '').trim()
  const content = String(req.body?.content || '').trim()

  if (!imageId) {
    return res.status(400).json({ message: '请选择要发布的图片' })
  }

  if (!content) {
    return res.status(400).json({ message: '请填写帖子内容' })
  }

  const image = db.prepare(`
    SELECT id, image_url as imageUrl, prompt, expires_at as expiresAt, status
    FROM generated_images
    WHERE id = ? AND user_id = ?
  `).get(imageId, req.user.id)

  if (!image || image.status !== 'active') {
    return res.status(404).json({ message: '这张图片不存在或已失效' })
  }

  const exists = db.prepare("SELECT id FROM community_posts WHERE image_id = ? AND status = 'active'").get(imageId)
  if (exists) {
    return res.status(409).json({ message: '这张图片已经发布过了' })
  }

  const id = uuidv4()
  const createdAt = nowIso()
  db.prepare(`
    INSERT INTO community_posts (id, user_id, image_id, image_url, prompt, content, created_at, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(id, req.user.id, image.id, image.imageUrl, image.prompt, content, createdAt, image.expiresAt)

  res.status(201).json({
    id,
    imageId: image.id,
    imageUrl: image.imageUrl,
    prompt: image.prompt,
    content,
    createdAt,
    expiresAt: image.expiresAt,
    userId: req.user.id,
    username: req.user.username,
  })
}

export function removeOwnPost(req, res) {
  const postId = String(req.params.id || '').trim()
  const post = db.prepare("SELECT id FROM community_posts WHERE id = ? AND user_id = ? AND status = 'active'").get(postId, req.user.id)

  if (!post) {
    return res.status(404).json({ message: '帖子不存在' })
  }

  db.prepare("UPDATE community_posts SET status = 'deleted' WHERE id = ?").run(postId)
  res.json({ message: '帖子已删除' })
}
