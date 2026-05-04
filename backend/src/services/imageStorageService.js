import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../config/env.js'
import { db } from '../db/index.js'

function joinUrl(baseUrl, pathName) {
  return `${baseUrl.replace(/\/$/, '')}/${pathName.replace(/^\//, '')}`
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true })
}

function readSiteBaseUrl() {
  return db.prepare('SELECT site_base_url FROM admin_settings WHERE id = 1').get()?.site_base_url || ''
}

export function buildPublicImageUrl(publicPath) {
  const siteBaseUrl = readSiteBaseUrl().trim()
  return siteBaseUrl
    ? joinUrl(siteBaseUrl, publicPath)
    : joinUrl(env.frontendBaseUrl, publicPath)
}

function toUploadsPublicPath(storagePath = '') {
  const trimmedPath = String(storagePath || '').trim()
  if (!trimmedPath) {
    return ''
  }

  const uploadsDir = path.join(env.backendDir, 'uploads')
  const relativePath = path.relative(uploadsDir, trimmedPath)
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return ''
  }

  return `/uploads/${relativePath.split(path.sep).join('/')}`
}

function toUrlPublicPath(imageUrl = '') {
  const trimmedUrl = String(imageUrl || '').trim()
  if (!trimmedUrl) {
    return ''
  }

  if (trimmedUrl.startsWith('/uploads/')) {
    return trimmedUrl
  }

  try {
    const parsed = new URL(trimmedUrl)
    return parsed.pathname.startsWith('/uploads/') ? parsed.pathname : ''
  } catch {
    return ''
  }
}

export function normalizePublicImageUrl(imageUrl = '', storagePath = '') {
  const publicPath = toUploadsPublicPath(storagePath) || toUrlPublicPath(imageUrl)
  if (publicPath) {
    return buildPublicImageUrl(publicPath)
  }

  return String(imageUrl || '').trim()
}

function writeBufferToUploads(buffer, extension = 'png', subdir = 'images') {
  const filename = `${uuidv4()}.${extension}`
  const relativePath = `/uploads/${subdir}/${filename}`
  const absoluteDir = path.join(env.backendDir, 'uploads', subdir)
  const absolutePath = path.join(absoluteDir, filename)
  ensureDirectory(absoluteDir)
  fs.writeFileSync(absolutePath, buffer)

  return {
    filename,
    absolutePath,
    publicPath: relativePath,
    publicUrl: buildPublicImageUrl(relativePath),
  }
}

export async function saveImageFromUrl(imageUrl, options = {}) {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('下载生成图片失败')
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const extension = contentType.includes('webp') ? 'webp' : contentType.includes('jpeg') ? 'jpg' : 'png'
  const buffer = Buffer.from(await response.arrayBuffer())
  return writeBufferToUploads(buffer, extension, options.subdir || 'images')
}

export function saveImageBuffer(buffer, options = {}) {
  const extension = options.extension || 'png'
  return writeBufferToUploads(buffer, extension, options.subdir || 'images')
}

export function saveUploadedFile(file, options = {}) {
  const extension = file.mimetype?.includes('webp')
    ? 'webp'
    : file.mimetype?.includes('jpeg')
      ? 'jpg'
      : file.mimetype?.includes('png')
        ? 'png'
        : 'png'
  const buffer = fs.readFileSync(file.path)
  return writeBufferToUploads(buffer, extension, options.subdir || 'images')
}

export function removeStoredImage(storagePath) {
  if (storagePath && fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath)
  }
}
