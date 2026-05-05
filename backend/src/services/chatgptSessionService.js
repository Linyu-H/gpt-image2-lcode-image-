import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import { env } from '../config/env.js'

function createUpstreamError(message, status = 502) {
  const error = new Error(message)
  error.status = status
  return error
}

function buildHeaders(authToken) {
  return {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  }
}

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function extractImageUrl(payload) {
  return payload?.images?.[0]?.url || payload?.data?.[0]?.url || payload?.data?.[0]?.b64_json || ''
}

function extractErrorMessage(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  return payload.message || payload.error?.message || payload.error || payload.detail || ''
}

export async function testImageApi({ accessToken: authToken, baseUrl }) {
  if (!authToken) {
    throw createUpstreamError('缺少身份令牌', 400)
  }

  if (!baseUrl) {
    throw createUpstreamError('请先配置图片 API 地址', 400)
  }

  try {
    await axios.get(joinUrl(baseUrl, env.image2ApiTestPath), {
      headers: buildHeaders(authToken),
      timeout: 15000,
    })
    return true
  } catch (error) {
    const status = error.response?.status || 502
    const message = extractErrorMessage(error.response?.data) || error.message || '上游连通性测试失败'
    throw createUpstreamError(`上游连通性测试失败：${message}`, status)
  }
}

function buildJsonPayload({ prompt }) {
  const payload = {
    model: env.image2ApiModel,
    prompt,
    size: env.image2ApiSize,
    quality: env.image2ApiQuality,
    n: env.image2ApiCount,
  }

  if (env.image2ApiStyle) {
    payload.style = env.image2ApiStyle
  }

  return payload
}

function buildMultipartPayload({ prompt, inputImage }) {
  const form = new FormData()
  form.append('model', env.image2ApiModel)
  form.append('prompt', prompt)
  form.append('size', env.image2ApiSize)
  form.append('quality', env.image2ApiQuality)
  form.append('n', String(env.image2ApiCount))
  if (env.image2ApiStyle) {
    form.append('style', env.image2ApiStyle)
  }
  form.append('image', fs.createReadStream(inputImage.path), {
    filename: inputImage.originalname,
    contentType: inputImage.mimetype,
  })
  return form
}

async function postGenerateRequest({ prompt, authToken, baseUrl }) {
  return axios.post(joinUrl(baseUrl, env.image2ApiGeneratePath), buildJsonPayload({ prompt }), {
    headers: buildHeaders(authToken),
    timeout: env.image2ApiTimeout,
  })
}

async function postEditRequest({ prompt, authToken, baseUrl, inputImage }) {
  const form = buildMultipartPayload({ prompt, inputImage })
  return axios.post(joinUrl(baseUrl, env.image2ApiEditPath), form, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
    timeout: env.image2ApiTimeout,
  })
}

export async function generateImage({ prompt, agent, accessToken: authToken, baseUrl, inputImage = null }) {
  if (!authToken) {
    throw createUpstreamError('缺少可用身份令牌', 400)
  }

  if (!baseUrl) {
    throw createUpstreamError('管理员尚未配置图片 API 地址', 400)
  }

  try {
    const response = inputImage
      ? await postEditRequest({ prompt, authToken, baseUrl, inputImage })
      : await postGenerateRequest({ prompt, authToken, baseUrl })

    const imageUrl = extractImageUrl(response.data)
    if (!imageUrl) {
      throw createUpstreamError(`图片生成失败：${extractErrorMessage(response.data) || '未返回图片地址'}`, 502)
    }

    return {
      imageUrl,
      raw: {
        prompt,
        agent,
        model: env.image2ApiModel,
        size: env.image2ApiSize,
      },
    }
  } catch (error) {
    if (error.status) {
      throw error
    }

    const status = error.response?.status || 502
    const message = extractErrorMessage(error.response?.data) || error.message || '图片生成失败'
    throw createUpstreamError(`图片生成失败：${message}`, status)
  }
}
