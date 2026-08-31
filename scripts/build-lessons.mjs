/**
 * 從 Sanity 取回教案，產生 Jekyll 需要的檔案：
 *   _lessons/<學年度>/<代稱>.md   每篇教案
 *   _data/years.yml               學年度清單（給導覽選單用）
 *   lessons-<學年度>.html         每個學年度的列表頁
 *
 * 建置流程：node scripts/build-lessons.mjs && bundle exec jekyll build
 *
 * 安全機制：只刪除自己產生的檔案（前置資料含 generated: true / HTML 標記），
 * 手動維護的檔案一律不動。
 */
import {readFile, writeFile, readdir, mkdir, rm, stat} from 'node:fs/promises'
import path from 'node:path'
import {readClient, loadDotEnv, imageUrl} from './lib/sanity.mjs'
import {renderLesson, GENERATED_FM} from './lib/render-lesson.mjs'

const LESSONS_DIR = '_lessons'
const DATA_DIR = '_data'
const TEMPLATE = '_templates/year-page.html'
const GENERATED_HTML = '此檔由 scripts/build-lessons.mjs'

await loadDotEnv()

const PHOTOS_QUERY = `*[_type == "photos"][0]{ slides }`

const HOMEPAGE_QUERY = `*[_type == "homepage"][0]{
  featuredImage, featuredTitle, featuredSubtitle, featuredText, featuredUrl, featuredLinkLabel
}`

const QUERY = `*[_type == "lesson" && defined(slug.current)] | order(academicYear desc, date desc) {
  _id, title, "slug": slug.current, academicYear, school, subject, grade, author,
  date, excerpt, tags, resourceUrl, resourceLabel, contentHeading, coverImage, intro, content
}`

// -------------------------------------------------------------- 圖片網址

const urls = {
  // 卡片與首頁用的封面
  cover: (img) => imageUrl(img).width(800).height(600).fit('crop').auto('format').url(),
  // 教案內頁的大圖
  content: (img) => imageUrl(img).width(1600).auto('format').url(),
  // 首頁焦點新聞的大圖
  featured: (img) => imageUrl(img).width(1200).height(800).fit('crop').auto('format').url(),
  // 活動照片輪播
  photo: (img) => imageUrl(img).width(1600).auto('format').url(),
}

// -------------------------------------------------------------- 清理舊產出

async function removeGenerated() {
  let removed = 0
  // 教案 markdown
  try {
    for (const year of await readdir(LESSONS_DIR)) {
      const dir = path.join(LESSONS_DIR, year)
      if (!(await stat(dir)).isDirectory()) continue
      for (const file of await readdir(dir)) {
        if (!file.endsWith('.md')) continue
        const full = path.join(dir, file)
        const text = await readFile(full, 'utf8')
        if (text.includes(GENERATED_FM)) {
          await rm(full)
          removed += 1
        }
      }
      if ((await readdir(dir)).length === 0) await rm(dir, {recursive: true})
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  // 年度頁
  for (const file of await readdir('.')) {
    if (!/^lessons-\d+\.html$/.test(file)) continue
    const text = await readFile(file, 'utf8')
    if (text.includes(GENERATED_HTML)) {
      await rm(file)
      removed += 1
    }
  }
  return removed
}

// -------------------------------------------------------------- 主流程

const client = readClient()

/**
 * 網路不穩時重試幾次再放棄。
 * 建置是由後台發布自動觸發的，偶爾一次連線失敗不該讓整個部署掛掉，
 * 而且失敗時要給看得懂的訊息，不是一整頁堆疊。
 */
async function fetchLessons(attempts = 3) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await client.fetch(QUERY)
    } catch (err) {
      const code = err.cause?.code || err.code || ''
      const isNetwork = ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)
      if (!isNetwork || i === attempts) {
        console.error(`\n無法從 Sanity 取得教案資料：${code || err.message}`)
        if (isNetwork) {
          console.error(
            '看起來是網路或 DNS 連不到 sanity.io，資料本身沒有問題。\n' +
              '請確認網路後重跑；建置沒有變更任何檔案。'
          )
        }
        process.exit(1)
      }
      const wait = i * 2000
      console.error(`第 ${i} 次連線失敗（${code}），${wait / 1000} 秒後重試…`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
}

const lessons = await fetchLessons()

if (!lessons.length) {
  console.error(
    '\n沒有從 Sanity 取到任何教案。\n' +
      '這通常代表資料尚未搬遷、或環境變數指到了錯的 dataset。\n' +
      '為避免把整個教案區清空，這裡直接中止建置。\n'
  )
  process.exit(1)
}

const removed = await removeGenerated()

const years = new Map()
for (const lesson of lessons) {
  const missing = ['title', 'slug', 'academicYear', 'date'].filter((k) => !lesson[k])
  if (missing.length) {
    console.error(`跳過教案 ${lesson._id}：缺少必填欄位 ${missing.join(', ')}`)
    continue
  }
  const dir = path.join(LESSONS_DIR, lesson.academicYear)
  await mkdir(dir, {recursive: true})
  await writeFile(path.join(dir, `${lesson.slug}.md`), renderLesson(lesson, urls), 'utf8')
  years.set(lesson.academicYear, (years.get(lesson.academicYear) || 0) + 1)
}

// 學年度清單（新到舊），給導覽選單使用
const sortedYears = [...years.entries()].sort((a, b) => b[0].localeCompare(a[0]))
await mkdir(DATA_DIR, {recursive: true})
await writeFile(
  path.join(DATA_DIR, 'years.yml'),
  '# 此檔由 scripts/build-lessons.mjs 自動產生，請勿手動編輯\n' +
    sortedYears.map(([year, count]) => `- year: "${year}"\n  count: ${count}`).join('\n') +
    '\n',
  'utf8'
)

// 首頁的焦點新聞。後台還沒填就把資料檔清掉，版型會自動略過那個區塊。
const homepage = await client.fetch(HOMEPAGE_QUERY).catch(() => null)
const homepagePath = path.join(DATA_DIR, 'homepage.yml')
if (homepage?.featuredTitle && homepage?.featuredImage) {
  const y = (v) => JSON.stringify(String(v ?? '').replace(/\s*\n\s*/g, ' '))
  await writeFile(
    homepagePath,
    '# 此檔由 scripts/build-lessons.mjs 自動產生，請勿手動編輯\n' +
      'featured:\n' +
      `  image: ${y(urls.featured(homepage.featuredImage))}\n` +
      `  title: ${y(homepage.featuredTitle)}\n` +
      (homepage.featuredSubtitle ? `  subtitle: ${y(homepage.featuredSubtitle)}\n` : '') +
      `  text: ${y(homepage.featuredText)}\n` +
      (homepage.featuredUrl ? `  url: ${y(homepage.featuredUrl)}\n` : '') +
      `  link_label: ${y(homepage.featuredLinkLabel || '了解更多')}\n`,
    'utf8'
  )
} else {
  await rm(homepagePath, {force: true})
  console.warn('提醒：後台的「首頁設定」還沒填，首頁的焦點新聞區塊不會顯示')
}

// 活動照片輪播
const photos = await client.fetch(PHOTOS_QUERY).catch(() => null)
const photosPath = path.join(DATA_DIR, 'photos.yml')
if (photos?.slides?.length) {
  const y = (v) => JSON.stringify(String(v ?? '').replace(/\s*\n\s*/g, ' '))
  await writeFile(
    photosPath,
    '# 此檔由 scripts/build-lessons.mjs 自動產生，請勿手動編輯\n' +
      'slides:\n' +
      photos.slides
        .map(
          (sl) =>
            `  - image: ${y(urls.photo(sl))}\n` +
            `    alt: ${y(sl.alt || '活動照片')}\n` +
            (sl.caption ? `    caption: ${y(sl.caption)}\n` : '') +
            (sl.captionText ? `    caption_text: ${y(sl.captionText)}\n` : '')
        )
        .join(''),
    'utf8'
  )
} else {
  await rm(photosPath, {force: true})
  console.warn('提醒：後台的「活動照片」還沒填，活動照片頁的輪播不會顯示')
}

// 各學年度列表頁
const template = await readFile(TEMPLATE, 'utf8')
for (const [year] of sortedYears) {
  await writeFile(`lessons-${year}.html`, template.replaceAll('{{YEAR}}', year), 'utf8')
}

console.log(`\n已從 Sanity 取得 ${lessons.length} 篇教案（清掉 ${removed} 個上次產生的檔案）`)
if (homepage?.featuredTitle) console.log(`  首頁焦點新聞：${homepage.featuredTitle}`)
if (photos?.slides?.length) console.log(`  活動照片：${photos.slides.length} 張`)
for (const [year, count] of sortedYears) {
  console.log(`  ${year} 學年度：${count} 篇  →  /lessons/${year}/`)
}
console.log('')
