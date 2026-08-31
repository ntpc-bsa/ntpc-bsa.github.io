/**
 * Markdown ⇄ Portable Text 雙向轉換。
 *
 * 只針對本站教案實際用到的語法：段落、粗體、斜體、連結、
 * 編號／項目清單，以及 <div><img></div> 圖片組。
 * 刻意不用通用的 markdown 解析器 —— 語料只有 24 篇且格式固定，
 * 專用轉換器比較好驗證，也能保證輸出的 HTML 與現有頁面逐字一致。
 */

let keySeed = 0
/** 可預期的 key，讓往返驗證能穩定比對 */
export function resetKeys() {
  keySeed = 0
}
function key(prefix = 'k') {
  keySeed += 1
  return `${prefix}${keySeed.toString(36)}`
}

const IMG_DIV_RE = /<div style="[^"]*">\s*((?:<img[^>]*>\s*)+)<\/div>/g
const IMG_RE = /<img\s+src="([^"]*)"\s+alt="([^"]*)"[^>]*>/g
const LIQUID_PATH_RE = /\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}/

// ---------------------------------------------------------------- 行內解析

/** 把一段文字切成帶 marks 的 spans */
function parseInline(text, markDefs) {
  const spans = []
  // 順序很重要：連結 → 粗體(**) → 斜體(*)。
  // 不解析 _底線_ 斜體：本站教案的底線都出現在檔名裡（例如 大觀國中_綜合家政_三明治），
  // 當成斜體會把檔名吃掉。
  const tokenRe = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g
  let last = 0
  let m
  while ((m = tokenRe.exec(text)) !== null) {
    if (m.index > last) spans.push(span(text.slice(last, m.index), []))
    if (m[1] !== undefined) {
      const dk = key('link')
      markDefs.push({_key: dk, _type: 'link', href: m[2]})
      spans.push(span(m[1], [dk]))
    } else if (m[3] !== undefined) {
      spans.push(span(m[3], ['strong']))
    } else {
      spans.push(span(m[4], ['em']))
    }
    last = m.index + m[0].length
  }
  if (last < text.length) spans.push(span(text.slice(last), []))
  return spans.length ? spans : [span('', [])]
}

function span(text, marks) {
  return {_type: 'span', _key: key('s'), text, marks}
}

/** spans → markdown */
function renderInline(children = [], markDefs = []) {
  return children
    .map((c) => {
      let t = c.text ?? ''
      const marks = c.marks || []
      const linkKey = marks.find((mk) => markDefs.some((d) => d._key === mk))
      if (marks.includes('strong')) t = `**${t}**`
      if (marks.includes('em')) t = `*${t}*`
      if (linkKey) {
        const def = markDefs.find((d) => d._key === linkKey)
        t = `[${t}](${def.href})`
      }
      return t
    })
    .join('')
}

// ---------------------------------------------------- Markdown → Portable Text

/**
 * @param {string} md 單一段落區塊的內文（不含 ### 標題行）
 * @returns {Array} Portable Text blocks；圖片組帶 _localImages（本機檔案路徑）
 */
export function mdToBlocks(md) {
  const blocks = []
  let cursor = 0
  IMG_DIV_RE.lastIndex = 0
  let match
  while ((match = IMG_DIV_RE.exec(md)) !== null) {
    pushText(md.slice(cursor, match.index))
    blocks.push(imageGroupFrom(match[1]))
    cursor = match.index + match[0].length
  }
  pushText(md.slice(cursor))
  return blocks

  function pushText(chunk) {
    for (const para of chunk.split(/\n\s*\n/)) {
      const t = para.trim()
      if (t) blocks.push(...paragraphToBlocks(t))
    }
  }
}

function imageGroupFrom(imgsHtml) {
  const images = []
  IMG_RE.lastIndex = 0
  let m
  while ((m = IMG_RE.exec(imgsHtml)) !== null) {
    const raw = m[1]
    const liquid = raw.match(LIQUID_PATH_RE)
    images.push({
      _key: key('img'),
      _type: 'image',
      alt: m[2],
      // _srcRaw 保留原始 src 字串，往返驗證才能逐字還原
      _srcRaw: raw,
      _localPath: liquid ? liquid[1] : null,
      _externalUrl: liquid ? null : raw,
    })
  }
  return {_key: key('grp'), _type: 'imageGroup', images}
}

function paragraphToBlocks(para) {
  const lines = para.split('\n').map((l) => l.trim()).filter(Boolean)

  const numbered = lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l))
  if (numbered) {
    return lines.map((l) => listBlock(l.replace(/^\d+\.\s+/, ''), 'number'))
  }
  const bulleted = lines.length > 0 && lines.every((l) => /^[*-]\s+/.test(l))
  if (bulleted) {
    return lines.map((l) => listBlock(l.replace(/^[*-]\s+/, ''), 'bullet'))
  }
  const quoted = lines.length > 0 && lines.every((l) => /^>\s?/.test(l))
  if (quoted) {
    return [textBlock(lines.map((l) => l.replace(/^>\s?/, '')).join(' '), 'blockquote')]
  }

  const text = lines.join('\n')
  // 整段就是一組粗體 → 視為小標題
  const heading = text.match(/^\*\*([^*]+)\*\*$/)
  if (heading) return [textBlock(heading[1], 'h4')]

  return [textBlock(text, 'normal')]
}

function textBlock(text, style) {
  const markDefs = []
  const children = parseInline(text, markDefs)
  return {_key: key('b'), _type: 'block', style, markDefs, children}
}

function listBlock(text, listItem) {
  const b = textBlock(text, 'normal')
  return {...b, listItem, level: 1}
}

// ---------------------------------------------------- Portable Text → Markdown

/**
 * @param {Array} blocks
 * @param {(image:object)=>string} resolveImage 回傳圖片網址
 * @param {string} fallbackAlt alt 留白時的替代文字
 */
export function blocksToMarkdown(blocks = [], resolveImage, fallbackAlt = '') {
  const out = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]

    if (b._type === 'imageGroup') {
      out.push(renderImageGroup(b, resolveImage, fallbackAlt))
      i += 1
      continue
    }

    // 連續的清單項目要收成同一段，中間不能有空行
    if (b.listItem) {
      const items = []
      const kind = b.listItem
      while (i < blocks.length && blocks[i].listItem === kind) {
        const text = renderInline(blocks[i].children, blocks[i].markDefs)
        items.push(kind === 'number' ? `${items.length + 1}.  ${text}` : `* ${text}`)
        i += 1
      }
      out.push(items.join('\n'))
      continue
    }

    const text = renderInline(b.children, b.markDefs)
    if (b.style === 'h4') out.push(`**${text}**`)
    else if (b.style === 'blockquote') out.push(`> ${text}`)
    else if (b.style === 'h3') out.push(`### ${text}`)
    else out.push(text)
    i += 1
  }
  return out.join('\n\n')
}

function renderImageGroup(group, resolveImage, fallbackAlt) {
  const images = group.images || []
  const tags = images
    .map((img) => {
      const src = resolveImage(img)
      const alt = (img.alt || fallbackAlt).replace(/"/g, '&quot;')
      return `    <img src="${src}" alt="${alt}" style="flex: 1; min-width: 48%; object-fit: cover;">`
    })
    .join('\n')
  const style =
    images.length > 1
      ? 'display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;'
      : 'margin-bottom: 10px;'
  return `<div style="${style}">\n${tags}\n</div>`
}
