/**
 * 把「活動照片」輪播從 photos.html 搬進 Sanity。
 *
 *   node scripts/seed-photos.mjs --dry-run
 *   node scripts/seed-photos.mjs
 *
 * 直接解析 photos.html 目前的輪播區塊，沿用同樣的順序與 alt 文字，
 * 所以搬完之後頁面看起來跟現在一模一樣。只需要跑一次。
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {loadDotEnv} from './lib/sanity.mjs'

const DRY_RUN = process.argv.includes('--dry-run')
const SOURCE = 'photos.html'

await loadDotEnv()

const html = await readFile(SOURCE, 'utf8')

// 只取真正會顯示的輪播，範例格式那段包在 HTML 註解裡，要先拿掉
const visible = html.replace(/<!--[\s\S]*?-->/g, '')

const slides = []
const re = /<div class="photo-carousel-slide">\s*<img\s+src="\{\{\s*'([^']+)'[^}]*\}\}"\s+alt="([^"]*)"/g
let m
while ((m = re.exec(visible)) !== null) {
  slides.push({file: m[1].replace(/^\//, ''), alt: m[2]})
}

if (!slides.length) {
  console.error(`沒有從 ${SOURCE} 解析到任何輪播照片，版型可能改過了`)
  process.exit(1)
}

console.log(`\n${DRY_RUN ? '【試跑】未寫入任何資料' : '【寫入 Sanity】'}`)
console.log(`從 ${SOURCE} 解析到 ${slides.length} 張照片\n`)

let missing = 0
for (const [i, s] of slides.entries()) {
  const buf = await readFile(s.file).catch(() => null)
  if (!buf) {
    console.log(`  ${String(i + 1).padStart(2)}. ✗ 找不到檔案 ${s.file}`)
    missing += 1
    continue
  }
  s.buffer = buf
  console.log(
    `  ${String(i + 1).padStart(2)}. ${path.basename(s.file).padEnd(14)} ` +
      `${(buf.length / 1024 / 1024).toFixed(1)} MB  ${s.alt}`
  )
}

if (missing) {
  console.error(`\n有 ${missing} 張找不到檔案，先處理完再搬遷。\n`)
  process.exit(1)
}

if (DRY_RUN) {
  console.log('\n試跑結束。拿掉 --dry-run 即可正式寫入。\n')
  process.exit(0)
}

const {writeClient} = await import('./lib/sanity.mjs')
const client = writeClient()

console.log('\n上傳中…')
const uploaded = []
for (const [i, s] of slides.entries()) {
  // 檔名重新編號，不沿用相機的 DSC 編號
  const filename = `活動照片-${String(i + 1).padStart(2, '0')}${path.extname(s.file)}`
  const asset = await client.assets.upload('image', s.buffer, {filename})
  uploaded.push({
    _key: `slide${i + 1}`,
    _type: 'image',
    alt: s.alt || undefined,
    asset: {_type: 'reference', _ref: asset._id},
  })
  process.stdout.write(`\r  ${i + 1}/${slides.length}`)
}

await client.createOrReplace({_id: 'photos', _type: 'photos', slides: uploaded})
console.log(`\n\n已寫入「活動照片」：${uploaded.length} 張。之後請直接在後台增刪與排序。\n`)
