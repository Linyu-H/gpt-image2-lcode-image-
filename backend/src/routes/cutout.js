import { Router } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: Number(process.env.KKT_UPLOAD_MAX_FILE_SIZE || 10 * 1024 * 1024),
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype?.startsWith('image/')) {
      callback(new Error('仅支持上传图片文件'))
      return
    }
    callback(null, true)
  },
})

const upstreamOrigin = process.env.KKT_UPSTREAM_ORIGIN || 'https://www.koukoutu.com'
const upstreamType = process.env.KKT_UPSTREAM_TYPE || 'rmbg'
const upstreamAction = process.env.KKT_UPSTREAM_ACTION || 'zero'
const upstreamModel = process.env.KKT_UPSTREAM_MODEL || '3'
const upstreamEdgeEnhancement = process.env.KKT_EDGE_ENHANCEMENT || '0'
const upstreamAiShadow = process.env.KKT_AI_SHADOW || '0'
const upstreamUploadAction = process.env.KKT_UPLOAD_ACTION || 'ucoss'
const upstreamUploadReqType = process.env.KKT_UPLOAD_REQ_TYPE || 'PUT'
const upstreamUploadUserId = process.env.KKT_UPLOAD_USER_ID || 'PUT'
const pollTimeoutMs = Number(process.env.KKT_POLL_TIMEOUT_MS || 35000)
const pollIntervalMs = Number(process.env.KKT_POLL_INTERVAL_MS || 1000)

router.post('/', upload.single('image'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: '缺少图片文件。' })
  }

  try {
    const token = req.headers.authorization || req.body?.token || ''
    const captchaCode = req.body?.captchacode || ''
    console.info('cutout request', {
      mimeType: req.file.mimetype,
      size: req.file.size,
      captchaCodeLength: captchaCode.length,
      hasToken: Boolean(token),
      type: upstreamType,
      action: upstreamAction,
      model: upstreamModel,
    })

    const imageUrl = await uploadSourceImage(req.file, token)
    const task = await createCutoutTask(req.file, imageUrl, token, captchaCode)
    const result = await pollCutoutTask(task.message.taskId, token)

    if (result.message.code !== 200) {
      return res.status(502).json({ message: result.message.message || result.message.detailinfo || '抠图任务失败。' })
    }

    const resultUrl = new URL(result.message.resultpath, upstreamOrigin).toString()
    const imageResponse = await fetch(resultUrl, {
      headers: browserHeaders(token),
    })

    if (!imageResponse.ok) {
      return res.status(502).json({ message: `结果图片下载失败：HTTP ${imageResponse.status}` })
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await imageResponse.arrayBuffer())

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-KKT-Task-Id', task.message.taskId)
    res.send(buffer)
  } catch (error) {
    next(error)
  }
})

async function uploadSourceImage(file, token) {
  const signature = await createUploadSignature(file, token)
  const uploadUrl = normalizeUrl(signature.message.host, signature.message.key)
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: signature.message.token,
      'Content-Type': 'application/octet-stream',
    },
    body: file.buffer,
    duplex: 'half',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `图片上传失败：HTTP ${response.status}`)
  }

  console.info('upload complete', { imageUrl: uploadUrl })
  return uploadUrl
}

async function createUploadSignature(file, token) {
  const formData = new FormData()
  formData.append('action', upstreamUploadAction)
  formData.append('type', upstreamType)
  formData.append('token', token)
  formData.append('reqType', upstreamUploadReqType)
  formData.append('userid', upstreamUploadUserId)
  formData.append('fileExt', getFileExtension(file))

  const response = await fetch(new URL('/api/oss/signature', upstreamOrigin).toString(), {
    method: 'POST',
    headers: browserHeaders(token),
    body: formData,
    duplex: 'half',
  })
  const payload = await readJson(response)

  if (!response.ok || !payload.success || payload.message?.code !== 200 || !payload.message?.host || !payload.message?.key || !payload.message?.token) {
    console.error('signature payload', payload)
    throw new Error(extractMessage(payload) || JSON.stringify(payload) || `获取上传签名失败：HTTP ${response.status}`)
  }

  return payload
}

async function createCutoutTask(file, imageUrl, token, captchaCode) {
  const { width, height } = getImageDimensions(file.buffer, file.mimetype)

  const formData = new FormData()
  formData.append('image', imageUrl)
  formData.append('type', upstreamType)
  formData.append('width', String(width))
  formData.append('height', String(height))
  formData.append('action', upstreamAction)
  formData.append('token', token)
  formData.append('captchacode', captchaCode)
  formData.append('filename', file.originalname)
  formData.append('model', upstreamModel)
  formData.append('edge_enhancement', upstreamEdgeEnhancement)
  formData.append('aiShadow', upstreamAiShadow)

  console.info('segment params', {
    width,
    height,
    imageUrl,
    filename: file.originalname,
    captchaCodeLength: captchaCode.length,
    type: upstreamType,
    action: upstreamAction,
    model: upstreamModel,
    edgeEnhancement: upstreamEdgeEnhancement,
    aiShadow: upstreamAiShadow,
  })

  const response = await fetch(new URL('/api/segment', upstreamOrigin).toString(), {
    method: 'POST',
    headers: browserHeaders(token),
    body: formData,
    duplex: 'half',
  })
  const payload = await readJson(response)

  if (!response.ok || !payload.success || !payload.message?.taskId) {
    console.error('segment payload', payload)
    throw new Error(extractMessage(payload) || JSON.stringify(payload) || `创建抠图任务失败：HTTP ${response.status}`)
  }

  return payload
}

async function pollCutoutTask(taskId, token) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < pollTimeoutMs) {
    const formData = new FormData()
    formData.append('type', upstreamType)
    formData.append('taskId', taskId)
    formData.append('token', token)

    const response = await fetch(new URL('/api/query', upstreamOrigin).toString(), {
      method: 'POST',
      headers: browserHeaders(token),
      body: formData,
      duplex: 'half',
    })
    const payload = await readJson(response)

    if (payload.success && (payload.message?.code === 200 || payload.message?.code === 500)) {
      return payload
    }

    await delay(pollIntervalMs)
  }

  throw new Error('抠图任务轮询超时，请稍后重试。')
}

function normalizeUrl(host, key) {
  const normalizedHost = host.startsWith('//') ? `https:${host}` : host
  return new URL(key, normalizedHost).toString()
}

function getFileExtension(file) {
  const fromName = file.originalname.split('.').pop()?.toLowerCase()
  if (fromName) return fromName === 'jpeg' ? 'jpg' : fromName

  if (file.mimetype === 'image/jpeg') return 'jpg'
  if (file.mimetype === 'image/png') return 'png'
  if (file.mimetype === 'image/webp') return 'webp'
  return 'jpg'
}

function browserHeaders(token) {
  const headers = {
    Accept: 'application/json, text/plain, */*',
    Origin: upstreamOrigin,
    Referer: `${upstreamOrigin}/removebgtool/all`,
    Cookie: process.env.KKT_COOKIE || '',
    'User-Agent': 'Mozilla/5.0',
  }

  if (token) headers.Authorization = token
  return headers
}

function getImageDimensions(buffer, mimeType) {
  if (mimeType === 'image/png') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    }
  }

  if (mimeType === 'image/jpeg') {
    let offset = 2
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      const length = buffer.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        }
      }
      offset += 2 + length
    }
  }

  if (mimeType === 'image/webp') {
    const chunk = buffer.toString('ascii', 12, 16)
    if (chunk === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      }
    }
  }

  return { width: 2048, height: 2048 }
}

async function readJson(response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || `接口返回非 JSON：HTTP ${response.status}`)
  }
}

function extractMessage(payload) {
  if (!payload) return ''
  const message = payload.message
  if (typeof message === 'string') return message
  if (typeof message?.message === 'string') return message.message
  if (typeof message?.detailinfo === 'string') return message.detailinfo
  if (typeof message?.error === 'string') return message.error
  return ''
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default router
