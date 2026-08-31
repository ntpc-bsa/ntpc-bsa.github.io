import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

// Sanity 的 projectId 與 dataset 不是機密（每個 cdn.sanity.io 圖片網址裡都看得到），
// 直接寫死，這樣不論誰在哪台電腦跑 sanity dev / deploy 都不必先設環境變數。
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'cjtv6pv5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

const FIRST_YEAR = 112

/** 目前的學年度（民國年）。學年度從每年 8 月起算。 */
function currentAcademicYear() {
  const now = new Date()
  return now.getFullYear() - 1911 - (now.getMonth() >= 7 ? 0 : 1)
}

/**
 * 側邊欄要列出哪些學年度。
 *
 * 以實際有資料的年度為準，這樣不會出現一堆空資料夾；
 * 萬一查詢失敗就退回用日期推算的清單，至少側邊欄還能用。
 */
async function lessonYears(context: any): Promise<string[]> {
  try {
    const client = context.getClient({apiVersion: '2024-10-01'})
    const years = await client.fetch(
      'array::unique(*[_type == "lesson" && defined(academicYear)].academicYear)'
    )
    if (Array.isArray(years) && years.length) {
      return [...new Set(years as string[])].sort().reverse()
    }
  } catch {
    // 查不到就用下面的推算結果
  }
  const out: string[] = []
  for (let y = currentAcademicYear(); y >= FIRST_YEAR; y -= 1) out.push(String(y))
  return out
}

export default defineConfig({
  name: 'ntpc-bsa',
  title: '新北市雙語策略聯盟 — 教案管理',

  projectId,
  dataset,

  schema: {
    types: schemaTypes,
    // 在某個學年度的資料夾裡按「新增」時，自動帶入該年度
    templates: (prev) => [
      ...prev,
      {
        id: 'lessonByYear',
        title: '教案（指定學年度）',
        schemaType: 'lesson',
        parameters: [{name: 'year', type: 'string'}],
        value: (params: {year: string}) => ({academicYear: params.year}),
      },
    ],
  },

  plugins: [
    structureTool({
      // 每個 list / listItem 都要有 id，少了會出現「`id` is required for lists」
      structure: async (S, context) => {
        const years = await lessonYears(context)

        const yearItems = years.map((year) =>
          S.listItem()
            .id(`year-${year}`)
            .title(`${year} 學年度`)
            .schemaType('lesson')
            .child(
              S.documentList()
                .id(`lessons-${year}`)
                .title(`${year} 學年度`)
                .schemaType('lesson')
                .filter('_type == "lesson" && academicYear == $year')
                .params({year})
                .defaultOrdering([{field: 'date', direction: 'desc'}])
                .initialValueTemplates([S.initialValueTemplateItem('lessonByYear', {year})])
            )
        )

        return S.list()
          .id('root')
          .title('內容')
          .items([
            // 教案底下再依學年度分資料夾：/教案/113 學年度
            S.listItem()
              .id('lessons')
              .title('教案')
              .schemaType('lesson')
              .child(
                S.list()
                  .id('lessonsByYear')
                  .title('教案')
                  .items([
                    S.listItem()
                      .id('allLessons')
                      .title('全部教案')
                      .schemaType('lesson')
                      .child(
                        S.documentTypeList('lesson')
                          .id('allLessonList')
                          .title('全部教案')
                          .defaultOrdering([
                            {field: 'academicYear', direction: 'desc'},
                            {field: 'date', direction: 'desc'},
                          ])
                      ),
                    ...yearItems,
                  ])
              ),
            S.listItem()
              .id('homepage')
              .title('首頁設定')
              .schemaType('homepage')
              .child(
                S.document()
                  .id('homepageDoc')
                  .schemaType('homepage')
                  .documentId('homepage')
                  .title('首頁設定')
              ),
          ])
      },
    }),
    visionTool(),
  ],
})
