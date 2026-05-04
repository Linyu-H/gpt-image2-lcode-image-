import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../config/env.js'

function joinUrl(baseUrl, pathName) {
  return `${baseUrl.replace(/\/$/, '')}/${pathName.replace(/^\//, '')}`
}

export async function saveImageFromUrl(imageUrl) {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('下载生成图片失败')
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const extension = contentType.includes('webp') ? 'webp' : contentType.includes('jpeg') ? 'jpg' : 'png'
  const buffer = Buffer.from(await response.arrayBuffer())
  const filename = `${uuidv4()}.${extension}`
  const absolutePath = path.join(env.uploadsDir, filename)
  const publicPath = `/uploads/images/${filename}`

  fs.writeFileSync(absolutePath, buffer)

  return {
    filename,
    absolutePath,
    publicPath,
    publicUrl: joinUrl(env.frontendBaseUrl, publicPath),
  }
}

export function removeStoredImage(storagePath) {
  if (storagePath && fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath)
  }
}
