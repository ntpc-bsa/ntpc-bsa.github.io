import {blocksToMarkdown} from './portable-text.mjs'
import {renderLessonBody} from './lesson-file.mjs'

const GENERATED_FM = 'generated: true'

const yamlString = (v) => JSON.stringify(String(v ?? ''))

/**
 * 把一篇 Sanity 教案渲染成 Jekyll 的 markdown。
 *
 * @param {object} lesson  Sanity 文件
 * @param {object} urls    圖片網址產生器
 * @param {(img:object)=>string} urls.cover    封面圖網址
 * @param {(img:object)=>string} urls.content  內文圖網址
 */
export function renderLesson(lesson, urls) {
  const lines = [
    '---',
    '# 此檔由 Sanity 自動產生，請勿手動編輯。內容請到後台修改。',
    GENERATED_FM,
    'layout: lesson',
    `title: ${yamlString(lesson.title)}`,
    `date: ${lesson.date}`,
    `academic_year: ${yamlString(lesson.academicYear)}`,
  ]
  if (lesson.excerpt) lines.push(`excerpt: ${yamlString(lesson.excerpt.replace(/\s*\n\s*/g, ' '))}`)
  if (lesson.grade) lines.push(`category: ${yamlString(lesson.grade)}`)
  if (lesson.school) lines.push(`school: ${yamlString(lesson.school)}`)
  if (lesson.subject) lines.push(`subject: ${yamlString(lesson.subject)}`)
  if (lesson.author) lines.push(`author: ${yamlString(lesson.author)}`)
  if (lesson.tags?.length) lines.push(`tags: [${lesson.tags.map(yamlString).join(', ')}]`)
  if (lesson.coverImage) lines.push(`cover_image: ${yamlString(urls.cover(lesson.coverImage))}`)
  lines.push('---')

  const body = renderLessonBody({
    intro: blocksToMarkdown(lesson.intro, urls.content, lesson.title),
    resourceUrl: lesson.resourceUrl,
    resourceLabel: lesson.resourceLabel || '教案連結',
    contentHeading: lesson.contentHeading,
    content: blocksToMarkdown(lesson.content, urls.content, lesson.title),
  })

  return `${lines.join('\n')}\n\n${body}`
}

export {GENERATED_FM}
