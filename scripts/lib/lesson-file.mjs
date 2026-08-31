import {readFile} from 'node:fs/promises'
import matter from 'gray-matter'

/**
 * 讀一個現有的教案 .md，拆成結構化欄位。
 * 現有 24 篇都是「課程介紹 / 相關資源 / 課程內容」三段，
 * 其中鷺江國中把標題寫成粗體、第三段叫「各科雙語教學活動」，這裡一併吸收。
 */
export async function parseLessonFile(path) {
  const raw = await readFile(path, 'utf8')
  const {data, content} = matter(raw)

  const sections = []
  const re = /^###\s+(.+?)\s*$/gm
  let m
  const marks = []
  while ((m = re.exec(content)) !== null) {
    marks.push({title: m[1].replace(/\*\*/g, '').trim(), start: m.index, end: re.lastIndex})
  }
  for (let i = 0; i < marks.length; i += 1) {
    const next = i + 1 < marks.length ? marks[i + 1].start : content.length
    sections.push({title: marks[i].title, body: content.slice(marks[i].end, next).trim()})
  }

  let intro = ''
  let resourceUrl = null
  let resourceLabel = null
  let contentHeading = null
  let contentBody = ''

  for (const s of sections) {
    if (s.title.includes('課程介紹')) {
      intro = s.body
    } else if (s.title.includes('相關資源')) {
      const link = s.body.match(/\[([^\]]*)\]\(([^)]+)\)/)
      if (link) {
        resourceLabel = link[1]
        resourceUrl = link[2]
      }
    } else {
      contentHeading = s.title === '課程內容' ? null : s.title
      contentBody = s.body
    }
  }

  return {
    path,
    frontMatter: data,
    preamble: marks.length ? content.slice(0, marks[0].start).trim() : content.trim(),
    intro,
    resourceUrl,
    resourceLabel,
    contentHeading,
    content: contentBody,
    sectionTitles: sections.map((s) => s.title),
  }
}

/** 把結構化欄位組回教案內文（build 與往返驗證共用同一份模板） */
export function renderLessonBody({intro, resourceUrl, resourceLabel, contentHeading, content}) {
  const parts = []
  parts.push('### 課程介紹', intro)
  if (resourceUrl) {
    parts.push('### 相關資源', `* [${resourceLabel || '教案連結'}](${resourceUrl})`)
  }
  parts.push(`### ${contentHeading || '課程內容'}`, content)
  return parts.filter((p) => p !== '' && p != null).join('\n\n') + '\n'
}

/** 比對用的正規化：統一換行、去掉行尾空白、收斂多餘空行 */
export function normalize(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
