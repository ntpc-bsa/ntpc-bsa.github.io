import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

// Sanity 的 projectId 與 dataset 不是機密（每個 cdn.sanity.io 圖片網址裡都看得到），
// 直接寫死，這樣不論誰在哪台電腦跑 sanity dev / deploy 都不必先設環境變數。
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'cjtv6pv5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'ntpc-bsa',
  title: '新北市雙語策略聯盟 — 教案管理',

  projectId,
  dataset,

  plugins: [
    structureTool({
      // list 與 listItem 都必須給 id，少了會出現「`id` is required for lists」
      structure: (S) =>
        S.list()
          .id('root')
          .title('內容')
          .items([
            S.listItem()
              .id('lessons')
              .title('教案（依學年度）')
              .schemaType('lesson')
              .child(
                S.documentTypeList('lesson')
                  .id('lessonList')
                  .title('教案')
                  .defaultOrdering([
                    {field: 'academicYear', direction: 'desc'},
                    {field: 'date', direction: 'desc'},
                  ])
              ),
            S.divider(),
            // 首頁設定固定編輯同一份文件，所以直接開那份，不做成清單
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
          ]),
    }),
    visionTool(),
  ],

  schema: {types: schemaTypes},
})
