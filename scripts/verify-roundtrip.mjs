/**
 * 往返驗證：把每篇現有教案轉成 Portable Text 再轉回 Markdown，
 * 與原檔逐字比對。目的是在資料搬進 Sanity 之前，先證明轉換不會掉內容。
 *
 *   node scripts/verify-roundtrip.mjs
 */
import {readdir} from 'node:fs/promises'
import path from 'node:path'
import {parseLessonFile, renderLessonBody, normalize} from './lib/lesson-file.mjs'
import {mdToBlocks, blocksToMarkdown, resetKeys} from './lib/portable-text.mjs'

const LESSONS_DIR = '_lessons'

/** 往返時逐字還原原始 src（本機圖是 Liquid 路徑，鷺江國中是 hackmd 外連） */
const resolveLocal = (img) => img._srcRaw

/** 只留有內容的行 —— 用來判斷「有沒有掉內容」，忽略空行擺放位置 */
const contentLines = (t) => t.split('\n').filter((l) => l.trim() !== '')

function firstDiff(a, b) {
  const la = a.split('\n')
  const lb = b.split('\n')
  for (let i = 0; i < Math.max(la.length, lb.length); i += 1) {
    if (la[i] !== lb[i]) {
      return {line: i + 1, before: la[i] ?? '(檔案結束)', after: lb[i] ?? '(檔案結束)'}
    }
  }
  return null
}

const years = await readdir(LESSONS_DIR)
let exact = 0
let loose = 0
const failures = []
let totalBlocks = 0
let totalImages = 0
let externalImages = 0

for (const year of years.sort()) {
  const dir = path.join(LESSONS_DIR, year)
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md'))
  for (const file of files.sort()) {
    const full = path.join(dir, file)
    const parsed = await parseLessonFile(full)

    resetKeys()
    const introBlocks = mdToBlocks(parsed.intro)
    const contentBlocks = mdToBlocks(parsed.content)
    const groups = [...introBlocks, ...contentBlocks].filter((b) => b._type === 'imageGroup')
    totalBlocks += introBlocks.length + contentBlocks.length
    totalImages += groups.reduce((n, g) => n + g.images.length, 0)
    externalImages += groups.reduce(
      (n, g) => n + g.images.filter((i) => i._externalUrl).length,
      0
    )

    const rebuilt = renderLessonBody({
      intro: blocksToMarkdown(introBlocks, resolveLocal),
      resourceUrl: parsed.resourceUrl,
      resourceLabel: parsed.resourceLabel,
      contentHeading: parsed.contentHeading,
      content: blocksToMarkdown(contentBlocks, resolveLocal),
    })

    const original = renderLessonBody({
      intro: parsed.intro,
      resourceUrl: parsed.resourceUrl,
      resourceLabel: parsed.resourceLabel,
      contentHeading: parsed.contentHeading,
      content: parsed.content,
    })

    const a = normalize(original)
    const b = normalize(rebuilt)
    if (a === b) {
      exact += 1
    } else if (contentLines(a).join('\n') === contentLines(b).join('\n')) {
      // 內容一字不差，只有空行位置被正規化（圖片區塊前補上空行，符合 kramdown 慣例）
      loose += 1
    } else {
      failures.push({
        file: full,
        ...firstDiff(contentLines(a).join('\n'), contentLines(b).join('\n')),
      })
    }
  }
}

const total = exact + loose + failures.length
console.log(`\n往返驗證：共 ${total} 篇教案`)
console.log(`  逐字一致              ：${exact} 篇`)
console.log(`  內容一致（空行正規化）：${loose} 篇`)
console.log(`  內容不符              ：${failures.length} 篇`)
console.log(`\n共 ${totalBlocks} 個內容區塊、${totalImages} 張圖片（其中 ${externalImages} 張為外部圖床）`)

if (failures.length) {
  console.log(`\n以下 ${failures.length} 篇轉換後內容不符：\n`)
  for (const f of failures) {
    console.log(`  ${f.file}  第 ${f.line} 行`)
    console.log(`    原    : ${String(f.before).slice(0, 160)}`)
    console.log(`    轉換後: ${String(f.after).slice(0, 160)}\n`)
  }
  process.exit(1)
}
console.log('內容無損，可以進行搬遷。\n')
