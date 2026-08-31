import {defineField, defineType} from 'sanity'

/**
 * 圖片組：可以插在正文段落之間。
 * 放 1 張＝整列大圖；放 2 張以上＝並排。
 * 這對應網站現有的兩種圖片排版，不需要編輯的人懂 HTML。
 */
export default defineType({
  name: 'imageGroup',
  title: '圖片組',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: '圖片',
      type: 'array',
      description: '放 1 張會是整列大圖；放 2 張會並排顯示。建議一組最多 2 張。',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: '圖片說明',
              description: '給視障讀者與搜尋引擎看的說明；留白會自動帶入教案標題。',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(4),
    }),
  ],
  preview: {
    select: {images: 'images', media: 'images.0'},
    prepare({images, media}) {
      const n = images?.length || 0
      return {title: `圖片組（${n} 張）`, media}
    },
  },
})
