/**
 * 把首頁「焦點新聞」原本寫死在 index.html 裡的內容搬進 Sanity。
 *
 *   node scripts/seed-homepage.mjs --dry-run
 *   node scripts/seed-homepage.mjs
 *
 * 只需要跑一次。之後承辦人就在後台的「首頁設定」直接改。
 * 文件 _id 固定為 homepage，重跑會覆蓋同一份，不會產生第二筆。
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {loadDotEnv} from './lib/sanity.mjs'

const DRY_RUN = process.argv.includes('--dry-run')

await loadDotEnv()

// 這批值就是原本 index.html 焦點新聞區塊裡寫死的內容
const IMAGE = 'assets/images/carousel/DSC07726.jpg'
const doc = {
  _id: 'homepage',
  _type: 'homepage',
  featuredTitle: '新北雙語策略聯盟成果展登場',
  featuredSubtitle: '13校67件創新教案、10堂公開課 展現雙語教育跨域實力',
  featuredText:
    '新北市雙語策略聯盟成果展展出67件創新教案與10堂動態課程，結合科技與跨校合作，' +
    '強化學生英語表達、跨文化理解與國際素養，展現2030雙語政策的推動成果與教育前瞻性。',
  featuredUrl:
    'https://www.ntpc.edu.tw/home.jsp?id=d127e0ce0f4f407b&act=be4f48068b2b0031' +
    '&dataserno=85d9061c2f71e7814e79c6bacd345901&mserno=cdfca8f4e3eeb6df81e43a5af771c42f',
  featuredLinkLabel: '了解更多',
}

const buffer = await readFile(IMAGE).catch(() => null)
if (!buffer) {
  console.error(`找不到圖片：${IMAGE}`)
  process.exit(1)
}

console.log(`\n${DRY_RUN ? '【試跑】未寫入任何資料' : '【寫入 Sanity】'}`)
console.log(`  標題　：${doc.featuredTitle}`)
console.log(`  副標　：${doc.featuredSubtitle}`)
console.log(`  圖片　：${IMAGE}（${(buffer.length / 1024).toFixed(0)} KB）`)
console.log(`  連結　：${doc.featuredUrl.slice(0, 60)}…\n`)

if (DRY_RUN) {
  console.log('試跑結束。拿掉 --dry-run 即可正式寫入。\n')
  process.exit(0)
}

const {writeClient} = await import('./lib/sanity.mjs')
const client = writeClient()

const asset = await client.assets.upload('image', buffer, {
  filename: `焦點新聞-${path.basename(IMAGE)}`,
})
await client.createOrReplace({
  ...doc,
  featuredImage: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
})

console.log('已寫入「首頁設定」。之後請直接在後台修改。\n')
