/**
 * 一次性搬遷：把 _lessons/ 既有的 24 篇教案與所有圖片搬進 Sanity。
 *
 *   node scripts/migrate-to-sanity.mjs --dry-run   先試跑，不會寫入任何東西
 *   node scripts/migrate-to-sanity.mjs             實際寫入
 *
 * 用固定的文件 _id，重跑會覆蓋同一批文件而不是產生重複資料。
 */
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {parseLessonFile} from './lib/lesson-file.mjs'
import {mdToBlocks, resetKeys} from './lib/portable-text.mjs'
import {loadDotEnv} from './lib/sanity.mjs'

const DRY_RUN = process.argv.includes('--dry-run')
const LESSONS_DIR = '_lessons'

await loadDotEnv()

/**
 * 重現 Jekyll permalink `:name` 的轉換規則。
 *
 * 現有 24 篇教案的線上網址是 Jekyll 依檔名產生的，例如
 *   _lessons/112/112_中正國中Tag Rugby教案.md
 *   → https://ntpc-bsa.github.io/lessons/112-中正國中tag-rugby教案/
 * 搬遷時沿用同一組 slug，既有網址才不會全部失效
 * （已對線上實際網址驗證過 24/24 相符）。
 */
const jekyllSlugify = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

const SCHOOL_RE = /^(.+?(?:國中小|國際實中|國中|高中|實中|國小))/

/** 從標題取學校；112 是「學校 課名」，113 是「學校 科目 課名」 */
function parseTitle(title, year) {
  const school = (title.match(SCHOOL_RE) || [])[1] || title.split(' ')[0]
  const rest = title.slice(school.length).trim()
  const subject = year === '113' ? rest.split(' ')[0] || null : null
  return {school, subject}
}

/**
 * 線上網站每篇教案目前實際顯示的封面圖，由 scripts/fetch-live-covers.mjs
 * 從 https://ntpc-bsa.github.io/lessons/ 抓下來。搬遷後封面才會跟現在一致。
 */
const liveCovers = JSON.parse(await readFile('scripts/live-covers.json', 'utf8'))

const warnings = []
const assetCache = new Map()

/**
 * 圖片檔名一律重新產生成 <學年度>-<學校>-<序號>，不沿用原始檔名。
 * 原始檔名是各校自己的編號（1.png、大觀國中4.png、img.jpg…），
 * 混在同一個媒體庫裡難以辨識；重新編號之後在後台一眼就看得出屬於哪一年、哪一校。
 * 序號以「學年度＋學校」為單位累加，同一校同一年的多篇教案會接續編號。
 */
const nameCounters = new Map()
function nextFilename(nameKey, ext) {
  const n = (nameCounters.get(nameKey) || 0) + 1
  nameCounters.set(nameKey, n)
  return `${nameKey}-${String(n).padStart(2, '0')}${ext}`
}
let client = null
if (!DRY_RUN) {
  const {writeClient} = await import('./lib/sanity.mjs')
  client = writeClient()
}

const IMAGE_EXTS = ['.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG']

/**
 * 找出圖片實際的檔案路徑。
 * 有幾張圖在教案裡寫成 .webp，但實際檔案是 .png（現在線上就是破圖），
 * 所以找不到時再用同檔名的其他副檔名試一次。
 */
async function resolveLocalFile(rel) {
  try {
    await readFile(rel)
    return rel
  } catch {
    // 換副檔名再試
  }
  const dir = path.dirname(rel)
  const base = path.basename(rel, path.extname(rel))
  for (const ext of IMAGE_EXTS) {
    const candidate = path.join(dir, base + ext)
    try {
      await readFile(candidate)
      return candidate
    } catch {
      // 繼續試下一個
    }
  }
  return null
}

/** 上傳一張圖，回傳 Sanity 的 asset reference（dry-run 時回傳假的 ref） */
async function uploadImage(source, label, {quiet = false, nameKey} = {}) {
  const cacheKey = source.local || source.url
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)

  let buffer
  let filename
  if (source.local) {
    const rel = source.local.replace(/^\//, '')
    const resolved = await resolveLocalFile(rel)
    if (!resolved) {
      if (!quiet) warnings.push(`找不到圖片檔：${rel}（${label}）`)
      return null
    }
    if (resolved !== rel) {
      warnings.push(`副檔名不符，已自動對應：${rel} → ${resolved}（${label}）`)
    }
    buffer = await readFile(resolved)
    filename = nextFilename(nameKey, path.extname(resolved).toLowerCase())
  } else {
    filename = nextFilename(nameKey, path.extname(new URL(source.url).pathname).toLowerCase())
    if (DRY_RUN) {
      // 試跑時確認外部圖床還活著。hackmd 會擋 HEAD（回 403），所以用 GET 取第一個位元組。
      try {
        const res = await fetch(source.url, {
          headers: {'User-Agent': 'Mozilla/5.0', Range: 'bytes=0-0'},
        })
        if (!res.ok && res.status !== 206) {
          warnings.push(`外部圖片回應 ${res.status}：${source.url}（${label}）`)
        }
        await res.arrayBuffer()
      } catch (err) {
        warnings.push(`外部圖片無法連線：${source.url}（${err.message}）`)
      }
    } else {
      const res = await fetch(source.url)
      if (!res.ok) {
        warnings.push(`外部圖片下載失敗 ${res.status}：${source.url}（${label}）`)
        return null
      }
      buffer = Buffer.from(await res.arrayBuffer())
    }
  }

  let ref
  if (DRY_RUN) {
    ref = `image-DRYRUN-${createHash('md5').update(cacheKey).digest('hex').slice(0, 10)}`
  } else {
    const asset = await client.assets.upload('image', buffer, {filename})
    ref = asset._id
  }
  const value = {_type: 'reference', _ref: ref}
  assetCache.set(cacheKey, value)
  return value
}

/** 把區塊裡的 _localPath / _externalUrl 換成真正的 asset reference */
async function resolveBlockImages(blocks, label, nameKey) {
  const out = []
  for (const block of blocks) {
    if (block._type !== 'imageGroup') {
      out.push(block)
      continue
    }
    const images = []
    for (const img of block.images) {
      const asset = await uploadImage(
        img._localPath ? {local: img._localPath} : {url: img._externalUrl},
        label,
        {nameKey}
      )
      if (!asset) continue
      images.push({_key: img._key, _type: 'image', alt: img.alt || undefined, asset})
    }
    if (images.length) out.push({_key: block._key, _type: 'imageGroup', images})
  }
  return out
}

// ------------------------------------------------------------------ 主流程

const years = (await readdir(LESSONS_DIR)).sort()
const documents = []
let imageCount = 0
let externalCount = 0

for (const year of years) {
  const dir = path.join(LESSONS_DIR, year)
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort()

  for (const file of files) {
    const full = path.join(dir, file)
    const parsed = await parseLessonFile(full)
    const fm = parsed.frontMatter
    const title = fm.title
    const {school, subject} = parseTitle(title, year)

    // 112 的檔案把年級寫在「112 學年度」這個誤植的欄位裡，順手正規化
    const grade = fm.category || fm[`${year} 學年度`] || null
    if (!fm.category && grade) {
      warnings.push(`${file}：年級欄位原本誤植為「${year} 學年度」，已改為 category`)
    }

    if (parsed.sectionTitles.some((t) => t.includes('相關資源')) && !parsed.resourceUrl) {
      warnings.push(`${file}：有「相關資源」段落但連結是空的，搬遷後不會顯示，請到後台補上`)
    }

    resetKeys()
    const label = `${year} ${school}`
    const introRaw = mdToBlocks(parsed.intro)
    const contentRaw = mdToBlocks(parsed.content)

    const rawGroups = [...introRaw, ...contentRaw].filter((b) => b._type === 'imageGroup')
    imageCount += rawGroups.reduce((n, g) => n + g.images.length, 0)
    externalCount += rawGroups.reduce(
      (n, g) => n + g.images.filter((i) => i._externalUrl).length,
      0
    )

    const nameKey = `${year}-${school}`
    const intro = await resolveBlockImages(introRaw, label, nameKey)
    const content = await resolveBlockImages(contentRaw, label, nameKey)

    const slug = jekyllSlugify(path.basename(file, '.md'))

    /*
     * 封面直接沿用線上網站目前實際顯示的那一張。
     *
     * 原本的版型是用 Liquid 猜的（113 依學校名去找 preview/<學校>/img.jpg，
     * 中平國中兩篇還特別分成 img.jpg 與 img1.jpg；112 則是取內文的最後一張圖）。
     * 與其在搬遷腳本裡重寫一次那套規則，不如把線上頁面實際輸出的封面抓下來當對照表
     * （scripts/live-covers.json），這樣搬遷後每篇的封面都跟現在完全一樣。
     */
    let cover = null
    let coverSource = null
    const livePath = liveCovers[slug]
    if (livePath) {
      cover = await uploadImage({local: livePath}, `${label} 封面`, {nameKey})
      coverSource = cover ? '線上現況' : null
    } else {
      warnings.push(`${file}：對照表沒有這篇的封面（slug: ${slug}），改用內文第一張`)
    }
    if (!cover) {
      const firstGroup = [...intro, ...content].find((b) => b._type === 'imageGroup')
      cover = firstGroup?.images?.[0]?.asset || null
      coverSource = cover ? '內文首圖' : null
      if (!cover) warnings.push(`${file}：找不到任何可當封面的圖片`)
    }
    const id = `lesson-${year}-${createHash('md5').update(slug).digest('hex').slice(0, 12)}`

    documents.push({
      _id: id,
      _type: 'lesson',
      academicYear: year,
      title,
      slug: {_type: 'slug', current: slug},
      school,
      ...(subject ? {subject} : {}),
      ...(grade ? {grade} : {}),
      ...(fm.author ? {author: fm.author} : {}),
      date: typeof fm.date === 'string' ? fm.date : new Date(fm.date).toISOString().slice(0, 10),
      excerpt: (fm.excerpt || '').replace(/\s*\n\s*/g, ' '),
      ...(fm.tags?.length ? {tags: fm.tags} : {}),
      intro,
      ...(parsed.resourceUrl ? {resourceUrl: parsed.resourceUrl} : {}),
      ...(parsed.resourceLabel && parsed.resourceLabel !== '教案連結'
        ? {resourceLabel: parsed.resourceLabel}
        : {}),
      ...(parsed.contentHeading ? {contentHeading: parsed.contentHeading} : {}),
      content,
      ...(cover ? {coverImage: {_type: 'image', asset: cover}} : {}),
      _coverSource: coverSource,
    })
  }
}

// ------------------------------------------------------------------ 報告

console.log(`\n${DRY_RUN ? '【試跑】未寫入任何資料' : '【正式搬遷】'}`)
console.log(
  `教案 ${documents.length} 篇、不重複圖片 ${assetCache.size} 張` +
    `（引用 ${imageCount} 次，其中 ${externalCount} 次來自外部圖床）\n`
)

const byYear = {}
for (const d of documents) (byYear[d.academicYear] ||= []).push(d)
const pad = (s, n) => String(s || '').padEnd(n - [...String(s || '')].filter((c) => c > '一').length)

for (const [year, docs] of Object.entries(byYear)) {
  console.log(`${year} 學年度（${docs.length} 篇）`)
  for (const d of docs) {
    const imgs = [...d.intro, ...d.content]
      .filter((b) => b._type === 'imageGroup')
      .reduce((n, g) => n + g.images.length, 0)
    console.log(
      `  ${pad(d.school, 14)} ${pad(d.subject || '－', 10)} ` +
        `${String(imgs).padStart(2)} 圖  封面:${d._coverSource || '無'}`
    )
    console.log(`      /lessons/${d.slug.current}/`)
  }
  console.log('')
}

if (warnings.length) {
  console.log(`需要注意（${warnings.length} 項）：`)
  for (const w of warnings) console.log(`  - ${w}`)
  console.log('')
}

if (DRY_RUN) {
  console.log('試跑結束。確認上面無誤後，拿掉 --dry-run 再執行一次即可正式寫入。\n')
  process.exit(0)
}

// ------------------------------------------------------------------ 寫入

for (const d of documents) delete d._coverSource
let tx = client.transaction()
for (const doc of documents) tx = tx.createOrReplace(doc)
await tx.commit()
console.log(`已寫入 Sanity：${documents.length} 篇教案。\n`)
console.log('下一步：node scripts/build-lessons.mjs 產生 Jekyll 檔案。\n')
