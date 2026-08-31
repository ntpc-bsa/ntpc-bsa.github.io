import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'ntpc-bsa',
  title: '新北市雙語策略聯盟 — 教案管理',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

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
