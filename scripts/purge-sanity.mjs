/**
 * 清空 dataset 裡的教案與圖片，讓搬遷可以乾淨地重跑一次。
 *
 *   node scripts/purge-sanity.mjs --yes
 *
 * 為什麼需要這支：Sanity 會依檔案內容的雜湊值去重，同一張圖第二次上傳會直接
 * 回傳既有的 asset，連原始檔名都沿用第一次的。所以只要調整過圖片命名規則，
 * 就必須先把舊的 asset 刪掉，新的命名才會生效。
 *
 * 只在正式啟用前使用。網站上線之後不要跑這支。
 */
import {loadDotEnv, writeClient} from './lib/sanity.mjs'

await loadDotEnv()

if (!process.argv.includes('--yes')) {
  console.error(
    '\n這會刪除 dataset 裡所有的教案文件與圖片檔案，且無法復原。\n' +
      '確定要執行請加上 --yes：\n\n  node scripts/purge-sanity.mjs --yes\n'
  )
  process.exit(1)
}

const client = writeClient()

const lessons = await client.fetch('*[_type == "lesson"]._id')
const assets = await client.fetch('*[_type == "sanity.imageAsset"]._id')

console.log(`\n準備刪除：教案 ${lessons.length} 篇、圖片 ${assets.length} 張`)

// 先刪文件，再刪圖片 —— 圖片還被文件引用時無法刪除
if (lessons.length) {
  let tx = client.transaction()
  for (const id of lessons) tx = tx.delete(id)
  await tx.commit()
  console.log(`已刪除教案 ${lessons.length} 篇`)
}

let removed = 0
let failed = 0
for (const id of assets) {
  try {
    await client.delete(id)
    removed += 1
  } catch (err) {
    failed += 1
    if (failed <= 3) console.error(`  刪除失敗 ${id}：${err.message.split('\n')[0]}`)
  }
}
console.log(`已刪除圖片 ${removed} 張${failed ? `，${failed} 張失敗` : ''}`)
console.log('\ndataset 已清空，可以重新執行搬遷。\n')
