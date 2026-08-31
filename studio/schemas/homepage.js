import {defineField, defineType} from 'sanity'

/**
 * 首頁設定。
 *
 * 全站只會有一份，文件 _id 固定為 'homepage'（見 sanity.config.ts 的側邊欄設定），
 * 所以後台不會出現「新增一筆」，只能編輯現有這份。
 */
export default defineType({
  name: 'homepage',
  title: '首頁設定',
  type: 'document',
  fields: [
    defineField({
      name: 'featuredImage',
      title: '焦點新聞圖片',
      type: 'image',
      description: '建議橫式大圖。',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featuredTitle',
      title: '焦點新聞標題',
      type: 'string',
      description: '例：新北雙語策略聯盟成果展登場',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'featuredSubtitle',
      title: '副標題',
      type: 'string',
      description: '顯示在標題下方的小字，可留白。',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'featuredText',
      title: '內容摘要',
      type: 'text',
      rows: 5,
      description: '一段簡短說明，建議 80～150 字。',
      validation: (Rule) => Rule.required().max(400),
    }),
    defineField({
      name: 'featuredUrl',
      title: '「了解更多」連結',
      type: 'url',
      description: '通常是新北市教育局的新聞稿網址。留白的話按鈕就不會出現。',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'featuredLinkLabel',
      title: '按鈕文字',
      type: 'string',
      description: '留白就是「了解更多」。',
      placeholder: '了解更多',
    }),
  ],
  preview: {
    select: {title: 'featuredTitle', media: 'featuredImage'},
    prepare({title, media}) {
      return {title: '首頁設定', subtitle: title || '(尚未設定焦點新聞)', media}
    },
  },
})
