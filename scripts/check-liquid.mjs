/**
 * 檢查 Liquid 的區塊標籤有沒有配對。
 *
 * 本機沒有安裝 Ruby，跑不了 jekyll build，所以這種標籤沒收尾的錯誤
 * 以前要推到 CI 才會發現。這支就是拿來在推送前先擋下來的。
 *
 *   node scripts/check-liquid.mjs
 */
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'

const PAIRS = {if: 'endif', for: 'endfor', unless: 'endunless', case: 'endcase',
  capture: 'endcapture', comment: 'endcomment', raw: 'endraw', tablerow: 'endtablerow'}
const OPENERS = new Set(Object.keys(PAIRS))
const CLOSERS = new Map(Object.entries(PAIRS).map(([o, c]) => [c, o]))

async function collect(dir, out = []) {
  for (const e of await readdir(dir, {withFileTypes: true})) {
    if (['node_modules', '_site', 'vendor', '.git', 'studio', '.jekyll-cache'].includes(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) await collect(full, out)
    else if (/\.(html|md)$/.test(e.name)) out.push(full)
  }
  return out
}

let failed = 0
for (const file of await collect('.')) {
  const text = await readFile(file, 'utf8')
  const stack = []
  let bad = null
  for (const m of text.matchAll(/\{%-?\s*(\w+)/g)) {
    const tag = m[1]
    const line = text.slice(0, m.index).split('\n').length
    if (OPENERS.has(tag)) stack.push({tag, line})
    else if (CLOSERS.has(tag)) {
      const want = CLOSERS.get(tag)
      const top = stack.pop()
      if (!top) { bad = `第 ${line} 行：多出來的 {% ${tag} %}`; break }
      if (top.tag !== want) {
        bad = `第 ${line} 行：{% ${tag} %} 對不上第 ${top.line} 行的 {% ${top.tag} %}`
        break
      }
    }
  }
  if (!bad && stack.length) {
    const t = stack[stack.length - 1]
    bad = `第 ${t.line} 行的 {% ${t.tag} %} 沒有收尾`
  }
  if (bad) {
    console.log(`✗ ${file}\n    ${bad}`)
    failed += 1
  }
}
console.log(failed ? `\n${failed} 個檔案的 Liquid 標籤不平衡\n` : 'Liquid 標籤全部配對正確\n')
process.exit(failed ? 1 : 0)
