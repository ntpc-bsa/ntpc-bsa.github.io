import {defineCliConfig} from 'sanity/cli'

// Sanity 的 projectId 與 dataset 不是機密（每個 cdn.sanity.io 圖片網址裡都看得到），
// 直接寫死，這樣不論誰在哪台電腦跑 sanity dev / deploy 都不必先設環境變數。
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'cjtv6pv5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  // 部署後的後台網址會是 https://<studioHost>.sanity.studio
  studioHost: 'ntpc-bsa',
})
