import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

/**
 * 一律在用到的當下才讀 process.env。
 * 不能在模組載入時就解構出來 —— .env 是靠 loadDotEnv() 載入的，
 * 而那發生在 import 之後，先解構會全部拿到 undefined。
 */
const env = (name, fallback) => process.env[name] || fallback

export const projectId = () => env('SANITY_PROJECT_ID')
export const dataset = () => env('SANITY_DATASET', 'production')

function requireProjectId() {
  const id = projectId()
  if (!id) {
    throw new Error(
      '缺少環境變數 SANITY_PROJECT_ID。\n' +
        '本機請在專案根目錄建立 .env 檔，Cloudflare Pages 請在「Settings → 環境變數」設定。'
    )
  }
  return id
}

/**
 * 建置時一律 useCdn:false。
 * 承辦人在後台按下 publish 之後 webhook 會馬上觸發建置，
 * 若走 CDN 快取有機會抓到舊資料，導致「明明發布了網站卻沒更新」。
 */
export function readClient() {
  return createClient({
    projectId: requireProjectId(),
    dataset: dataset(),
    apiVersion: '2024-10-01',
    useCdn: false,
    token: env('SANITY_READ_TOKEN') || undefined,
  })
}

export function writeClient() {
  const token = env('SANITY_WRITE_TOKEN')
  if (!token) {
    throw new Error(
      '搬遷需要 SANITY_WRITE_TOKEN。\n' +
        'Token 請到 sanity.io/manage → API → Tokens 建立一組 Editor 權限的 token。'
    )
  }
  return createClient({
    projectId: requireProjectId(),
    dataset: dataset(),
    apiVersion: '2024-10-01',
    useCdn: false,
    token,
  })
}

let _builder
export function imageUrl(source) {
  if (!_builder) {
    _builder = imageUrlBuilder({projectId: requireProjectId(), dataset: dataset()})
  }
  return _builder.image(source)
}

/** 極簡 .env 讀取，避免為了一個檔案再多裝一個套件 */
export async function loadDotEnv(path = '.env') {
  const {readFile} = await import('node:fs/promises')
  try {
    const raw = await readFile(path, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const value = m[2].replace(/^["']|["']$/g, '')
      if (!process.env[m[1]]) process.env[m[1]] = value
    }
  } catch {
    // 沒有 .env 就走系統環境變數，這是 Cloudflare Pages 上的正常情況
  }
}
