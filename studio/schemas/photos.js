import {defineField, defineType} from 'sanity'

/**
 * 活動照片頁的輪播。
 *
 * 全站只有一份，文件 _id 固定為 'photos'（見 sanity.config.ts 的側邊欄設定）。
 * 照片順序就是輪播順序，在後台直接拖曳調整。
 */
export default defineType({
  name: 'photos',
  title: '活動照片',
  type: 'document',
  fields: [
    defineField({
      name: 'slides',
      title: '輪播照片',
      type: 'array',
      description:
        '拖曳可以調整播放順序。原圖直接上傳即可，系統會自動壓縮成適合網頁的大小。',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: '圖片說明',
              description: '給視障讀者與搜尋引擎看的文字，例如「雙語教學活動」。建議每張都填。',
            },
            {
              name: 'caption',
              type: 'string',
              title: '標題（選填）',
              description: '填了會在照片上顯示一行標題；留白就只顯示照片。',
            },
            {
              name: 'captionText',
              type: 'string',
              title: '說明文字（選填）',
              description: '顯示在標題下方的小字，需要先填標題才會出現。',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1).error('至少要有一張照片'),
    }),
  ],
  preview: {
    select: {slides: 'slides', media: 'slides.0'},
    prepare({slides, media}) {
      return {title: '活動照片', subtitle: `${slides?.length || 0} 張`, media}
    },
  },
})
