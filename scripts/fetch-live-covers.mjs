/**
 * 從線上網站抓出每篇教案目前實際顯示的封面圖，存成 scripts/live-covers.json。
 *
 * 舊版型是用 Liquid 規則去猜封面（113 依學校名找 preview/<學校>/img.jpg，
 * 中平國中兩篇再分成 img.jpg / img1.jpg；112 則取內文最後一張圖）。
 * 搬遷時與其重寫那套規則，不如直接沿用線上輸出的結果。
 *
 *   node scripts/fetch-live-covers.mjs
 *
 * 只有在搬遷之前需要跑一次；搬完之後封面就由後台的「封面圖」欄位決定。
 */
import {writeFile} from 'node:fs/promises'

const SOURCE = 'https://ntpc-bsa.github.io/lessons/'

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`抓取 ${SOURCE} 失敗：HTTP ${res.status}`)
const html = await res.text()

const covers = {}
for (const card of html.split('<a href="/lessons/').slice(1)) {
  const slug = decodeURIComponent(card.slice(0, card.indexOf('/"')))
  if (!slug || /^\d+$/.test(slug)) continue // 跳過年度列表的連結
  const img = card.match(/<img src="([^"]+)"/)
  if (img) covers[slug] = decodeURIComponent(img[1])
}

const count = Object.keys(covers).length
if (count === 0) throw new Error('沒有解析到任何封面，線上版型可能改過了')

await writeFile('scripts/live-covers.json', JSON.stringify(covers, null, 2) + '\n', 'utf8')
console.log(`已抓取 ${count} 篇教案的封面 → scripts/live-covers.json`)
