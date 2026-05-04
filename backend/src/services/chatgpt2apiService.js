import axios from 'axios'
import { env } from '../config/env.js'

function buildHeaders(apiKey) {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}

function createUpstreamError(message, status = 502, details) {
  const error = new Error(message)
  error.status = status
  if (details) {
    error.details = details
  }
  return error
}

function readNestedUrl(value) {
  if (!value) return ''

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = readNestedUrl(item)
      if (nested) return nested
    }
    return ''
  }

  if (typeof value === 'object') {
    return value.url || value.imageUrl || value.src || value.b64_json || ''
  }

  return ''
}

function extractImageUrl(data) {
  return readNestedUrl(
    data?.imageUrl ||
      data?.url ||
      data?.image ||
      data?.images ||
      data?.data ||
      data?.result ||
      data?.output ||
      data?.choices,
  )
}

function extractErrorMessage(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  return payload.message || payload.error?.message || payload.error || payload.detail || payload.msg || ''
}

async function requestWithCandidates({ method, candidates, data, headers, timeout }) {
  let lastError = null

  for (const path of candidates) {
    try {
      const response = await axios({
        method,
        url: `${env.chatgpt2apiBaseUrl}${path}`,
        data,
        headers,
        timeout,
      })
      return { response, path }
    } catch (error) {
      const status = error.response?.status
      if (status && status !== 404 && status !== 405) {
        throw error
      }
      lastError = error
    }
  }

  throw lastError || new Error('上游接口不可用')
}

export async function generateImage({ prompt, agent, apiKey }) {
  try {
    const { response, path } = await requestWithCandidates({
      method: 'post',
      candidates: ['/v1/images/generations', '/images/generations', '/v1/images/generate', '/images/generate'],
      data: { prompt, agent },
      headers: buildHeaders(apiKey),
      timeout: 120000,
    })

    const imageUrl = extractImageUrl(response.data)

    if (!imageUrl) {
      throw createUpstreamError('上游服务已响应，但未返回可用图片地址', 502, {
        path,
        payload: response.data,
      })
    }

    return {
      imageUrl,
      raw: response.data,
      path,
    }
  } catch (error) {
    if (error.status) {
      throw error
    }

    const status = error.response?.status || 502
    const message = extractErrorMessage(error.response?.data) || error.message || '图片生成失败'
    throw createUpstreamError(`上游图片服务异常：${message}`, status)
  }
}

export async function testApiKey(apiKey) {
  try {
    await requestWithCandidates({
      method: 'get',
      candidates: ['/health', '/v1/health', '/ping'],
      headers: buildHeaders(apiKey),
      timeout: 10000,
    })
    return true
  } catch (error) {
    const message = extractErrorMessage(error.response?.data) || error.message || 'Key 测试失败'
    throw createUpstreamError(`上游连通性测试失败：${message}`, error.response?.status || 502)
  }
}
