import fs from 'fs'
import path from 'path'
import { env } from '../config/env.js'
import { parseAccessTokens } from './accountTokenService.js'

function resolveTokenFiles() {
  const files = fs
    .readdirSync(env.rootDir)
    .filter((name) => new RegExp(`^${env.accountTokensGlob.replace(/\*/g, '.*')}$`).test(name))
    .map((name) => path.join(env.rootDir, name))

  return files
}

export function loadTokenFilesContent() {
  const files = resolveTokenFiles()
  const tokens = []

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8')
    tokens.push(...parseAccessTokens(content))
  }

  return {
    files,
    tokens: Array.from(new Set(tokens)),
  }
}
