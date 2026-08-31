import {defineField, defineType} from 'sanity'

/** 保留中文，其餘轉為安全的網址字元 */
const slugify = (input) =>
  (input || '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96)

/** 最早一批資料是 112 學年度，選單就從這裡開始 */
const FIRST_YEAR = 112

/**
 * 目前的學年度（民國年）。學年度從每年 8 月起算：
 * 例如 2026 年 8 月之後是 115 學年度，2026 年 3 月則還是 114 學年度。
 */
function currentAcademicYear() {
  const now = new Date()
  const isSecondHalf = now.getMonth() >= 7 // 0 = 一月，7 = 八月
  return now.getFullYear() - 1911 - (isSecondHalf ? 0 : 1)
}

/**
 * 學年度可選的年份，從「目前學年度 + 1」往回列到 112。
 *
 * 這個清單是在後台每次載入時即時算出來的，所以每年都會自動多出新的年度，
 * 不需要改程式、也不需要重新部署後台。多給一年是為了讓下個學年度可以提前準備。
 */
function academicYearOptions() {
  const latest = currentAcademicYear() + 1
  const options = []
  for (let y = latest; y >= FIRST_YEAR; y -= 1) {
    options.push({title: `${y} 學年度`, value: String(y)})
  }
  return options
}

/** 正文用的區塊設定：文字段落 ＋ 可插入的圖片組 */
const richText = [
  {
    type: 'block',
    styles: [
      {title: '內文', value: 'normal'},
      {title: '小標題', value: 'h4'},
      {title: '引言', value: 'blockquote'},
    ],
    lists: [
      {title: '項目符號', value: 'bullet'},
      {title: '編號', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: '粗體', value: 'strong'},
        {title: '斜體', value: 'em'},
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: '連結',
          fields: [
            {name: 'href', type: 'url', title: '網址', validation: (Rule) => Rule.required()},
          ],
        },
      ],
    },
  },
  {type: 'imageGroup'},
]

export default defineType({
  name: 'lesson',
  title: '教案',
  type: 'document',
  groups: [
    {name: 'basic', title: '基本資料', default: true},
    {name: 'content', title: '課程內容'},
    {name: 'media', title: '封面'},
  ],
  fields: [
    defineField({
      name: 'academicYear',
      title: '學年度',
      type: 'string',
      group: 'basic',
      // 用 radio 而非 dropdown：dropdown 一定會多一個空白的「未選擇」項目，
      // 這個欄位是必填的，那個選項只會讓人誤填。
      options: {list: academicYearOptions(), layout: 'radio', direction: 'horizontal'},
      initialValue: String(currentAcademicYear()),
      description:
        '選單每年會自動往後延伸（含下一學年度），不需要找工程師新增。' +
        '選了新的年度並發布之後，網站的導覽選單與該年度的列表頁會自動出現。',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: '教案標題',
      type: 'string',
      group: 'basic',
      description: '慣例格式：學校 + 科目 + 課程名稱。例：中平國中 健康科 Snow White\'s Choice',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'slug',
      title: '網址代稱',
      type: 'slug',
      group: 'basic',
      description:
        '網頁網址會是 /lessons/這裡/。按「Generate」自動產生即可。已經對外公布過的教案請不要再修改，否則舊連結會失效。',
      options: {
        source: (doc) => [doc.academicYear, doc.title].filter(Boolean).join('-'),
        slugify,
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'school',
      title: '學校',
      type: 'string',
      group: 'basic',
      description: '例：中平國中。請使用學校全銜，同一所學校每年請填一致的名稱。',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subject',
      title: '領域／科目',
      type: 'string',
      group: 'basic',
      description: '例：健康科、家政科、表演藝術、生活科技',
    }),
    defineField({
      name: 'grade',
      title: '適用年級',
      type: 'string',
      group: 'basic',
      description: '例：七年級。會顯示在教案卡片與內頁的標籤上。',
    }),
    defineField({
      name: 'author',
      title: '授課教師',
      type: 'string',
      group: 'basic',
    }),
    defineField({
      name: 'date',
      title: '發布日期',
      type: 'date',
      group: 'basic',
      description: '首頁「最新消息」取日期最新的 3 筆，年度頁也依此排序。',
      options: {dateFormat: 'YYYY-MM-DD'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: '一句話簡介',
      type: 'text',
      rows: 3,
      group: 'basic',
      description: '顯示在教案卡片與內頁標題下方，建議 40～80 字。',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'tags',
      title: '標籤',
      type: 'array',
      group: 'basic',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: '例：雙語教育、健康科。按 Enter 逐一新增。',
    }),

    defineField({
      name: 'intro',
      title: '課程介紹',
      type: 'array',
      group: 'content',
      of: richText,
      description: '課程的整體說明，顯示在教案內頁最上方的「課程介紹」段落。',
      validation: (Rule) => Rule.required().min(1).error('請填寫課程介紹'),
    }),
    defineField({
      name: 'resourceUrl',
      title: '教案下載連結',
      type: 'url',
      group: 'content',
      description:
        'Google 雲端硬碟的分享連結，會顯示成「相關資源」段落。請先把權限設為「知道連結的任何人可以檢視」，否則老師點了會開不起來。',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'resourceLabel',
      title: '下載連結的文字',
      type: 'string',
      group: 'content',
      description: '留白就是「教案連結」。想顯示成別的文字時才填，例如「教案 PDF」。',
      placeholder: '教案連結',
    }),
    defineField({
      name: 'contentHeading',
      title: '內容段落標題',
      type: 'string',
      group: 'content',
      description: '留白就是「課程內容」。只有需要改成別的名稱時才填，例如「各科雙語教學活動」。',
      placeholder: '課程內容',
    }),
    defineField({
      name: 'content',
      title: '課程內容',
      type: 'array',
      group: 'content',
      of: richText,
      description:
        '課堂實施的過程與照片。可以在段落之間插入「圖片組」讓文字與照片交錯（按編輯區下方的 + 選擇「圖片組」）。',
    }),

    defineField({
      name: 'coverImage',
      title: '封面圖',
      type: 'image',
      group: 'media',
      description: '教案列表卡片與首頁「最新消息」會用這張。建議橫式，比例約 4:3。',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
  ],

  orderings: [
    {
      title: '學年度（新到舊）',
      name: 'yearDesc',
      by: [
        {field: 'academicYear', direction: 'desc'},
        {field: 'date', direction: 'desc'},
      ],
    },
  ],

  preview: {
    select: {title: 'title', year: 'academicYear', school: 'school', media: 'coverImage'},
    prepare({title, year, school, media}) {
      return {
        title: title || '(未命名教案)',
        subtitle: [year ? `${year} 學年度` : null, school].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
