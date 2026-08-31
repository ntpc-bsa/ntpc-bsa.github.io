/**
 * 端對端驗證：模擬「Sanity → Jekyll markdown」的完整產出路徑，
 * 把結果拿去跟現有的教案檔逐字比對。
 *
 * 這支腳本不需要 Sanity 帳號也能跑 —— 它用現有的 _lessons/ 當作
 * 「搬遷後 Sanity 會長什麼樣」的替身，走的是 build-lessons.mjs
 * 實際使用的同一組渲染函式。通過就代表搬遷後產生的頁面內容
 * 與今天的網站一致。
 *
 *   node scripts/verify-build.mjs
 */
import {readdir} from 'node:fs/promises'
import path from 'node:path'
import {parseLessonFile, renderLessonBody, normalize} from './lib/lesson-file.mjs'
import {mdToBlocks, resetKeys} from './lib/portable-text.mjs'
import {renderLesson} from './lib/render-lesson.mjs'

const LESSONS_DIR = '_lessons'

/** 驗證時把圖片還原成原本的 src，才能跟原檔比對 */
const urls = {
  cover: (img) => img._srcRaw || '',
  content: (img) => img._srcRaw || '',
}

const contentLines = (t) => t.split('\n').filter((l) => l.trim() !== '')

function firstDiff(a, b) {
  const la = a.split('\n')
  const lb = b.split('\n')
  for (let i = 0; i < Math.max(la.length, lb.length); i += 1) {
    if (la[i] !== lb[i]) {
      return {line: i + 1, before: la[i] ?? '(結束)', after: lb[i] ?? '(結束)'}
    }
  }
  return null
}

const SCHOOL_RE = /^(.+?(?:國中小|國際實中|國中|高中|實中|國小))/

const years = (await readdir(LESSONS_DIR)).sort()
let bodyOk = 0
let fmOk = 0
const failures = []
const fmProblems = []

for (const year of years) {
  const dir = path.join(LESSONS_DIR, year)
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort()

  for (const file of files) {
    const full = path.join(dir, file)
    const parsed = await parseLessonFile(full)
    const fm = parsed.frontMatter

    resetKeys()
    const school = (fm.title.match(SCHOOL_RE) || [])[1] || fm.title.split(' ')[0]

    // 組出一份「Sanity 會回傳的樣子」
    const lesson = {
      title: fm.title,
      academicYear: year,
      date: typeof fm.date === 'string' ? fm.date : new Date(fm.date).toISOString().slice(0, 10),
      excerpt: fm.excerpt,
      grade: fm.category || fm[`${year} 學年度`] || null,
      school,
      author: fm.author,
      tags: fm.tags,
      resourceUrl: parsed.resourceUrl,
      resourceLabel: parsed.resourceLabel,
      contentHeading: parsed.contentHeading,
      intro: mdToBlocks(parsed.intro),
      content: mdToBlocks(parsed.content),
      coverImage: null,
    }

    const generated = renderLesson(lesson, urls)

    // --- 比對內文 ---
    const genBody = generated.slice(generated.indexOf('\n---\n', 4) + 5).trim()
    const original = renderLessonBody({
      intro: parsed.intro,
      resourceUrl: parsed.resourceUrl,
      resourceLabel: parsed.resourceLabel,
      contentHeading: parsed.contentHeading,
      content: parsed.content,
    })
    const a = contentLines(normalize(original)).join('\n')
    const b = contentLines(normalize(genBody)).join('\n')
    if (a === b) bodyOk += 1
    else failures.push({file: full, ...firstDiff(a, b)})

    // --- 比對前置資料的關鍵欄位 ---
    const genFm = Object.fromEntries(
      generated
        .split('\n---')[0]
        .split('\n')
        .filter((l) => l.includes(':') && !l.startsWith('#') && l !== '---')
        .map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()])
    )
    const expectExcerpt = JSON.stringify(String(fm.excerpt).replace(/\s*\n\s*/g, ' '))
    const problems = []
    if (genFm.title !== JSON.stringify(fm.title)) problems.push('title')
    if (genFm.academic_year !== `"${year}"`) problems.push('academic_year')
    if (fm.excerpt && genFm.excerpt !== expectExcerpt) problems.push('excerpt')
    if (fm.author && genFm.author !== JSON.stringify(fm.author)) problems.push('author')
    if (!genFm.category) problems.push('category(年級)未帶出')
    if (problems.length) fmProblems.push({file, problems})
    else fmOk += 1
  }
}

const total = bodyOk + failures.length
console.log(`\n端對端驗證（Sanity 資料 → Jekyll markdown）：共 ${total} 篇`)
console.log(`  內文與現有頁面一致：${bodyOk} 篇`)
console.log(`  前置資料欄位正確  ：${fmOk} 篇`)

if (fmProblems.length) {
  console.log(`\n前置資料有落差（${fmProblems.length} 篇）：`)
  for (const p of fmProblems) console.log(`  ${p.file} → ${p.problems.join(', ')}`)
}

if (failures.length) {
  console.log(`\n內文不符（${failures.length} 篇）：`)
  for (const f of failures) {
    console.log(`  ${f.file} 第 ${f.line} 行`)
    console.log(`    現有: ${String(f.before).slice(0, 140)}`)
    console.log(`    產生: ${String(f.after).slice(0, 140)}`)
  }
  process.exit(1)
}
if (fmProblems.length) process.exit(1)
console.log('\n搬遷後產生的頁面內容與現在的網站一致。\n')
