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
      structure: (S, context) =>
        S.list()
          .title('內容')
          .items([
            S.listItem()
              .title('教案（依學年度）')
              .child(
                S.documentTypeList('lesson')
                  .title('教案')
                  .defaultOrdering([
                    {field: 'academicYear', direction: 'desc'},
                    {field: 'date', direction: 'desc'},
                  ])
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {types: schemaTypes},
})
