import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // 部署後的後台網址會是 https://<studioHost>.sanity.studio
  studioHost: 'ntpc-bsa',
})
