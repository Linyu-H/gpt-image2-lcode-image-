import request from './request'

export async function fetchPublicStatistics() {
  const { data } = await request.get('/statistics')
  return data
}

export async function fetchFeaturedExample() {
  const { data } = await request.get('/featured-example')
  return data
}

export async function generateImage(payload) {
  if (payload?.file) {
    const formData = new FormData()
    formData.append('prompt', payload.prompt)
    formData.append('agent', payload.agent || 'image')
    formData.append('file', payload.file)
    const { data } = await request.post('/images/generate', formData)
    return data
  }

  const { data } = await request.post('/images/generate', payload)
  return data
}

export async function fetchHistory() {
  const { data } = await request.get('/images/history')
  return data
}

export async function deleteImage(id) {
  const { data } = await request.delete(`/images/${id}`)
  return data
}
