const blockedWords = ['色情', '暴力', '违法']

export function validatePrompt(prompt) {
  const normalized = String(prompt || '').trim()

  if (!normalized) {
    const error = new Error('请输入图片描述')
    error.status = 400
    throw error
  }

  const matched = blockedWords.find((word) => normalized.includes(word))
  if (matched) {
    const error = new Error('输入内容包含敏感词，请修改后重试')
    error.status = 400
    throw error
  }
}
