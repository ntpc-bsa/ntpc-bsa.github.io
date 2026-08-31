# 部署與維運說明

給工程/技術窗口看的。承辦人的操作說明請看 [ADMIN_GUIDE.md](ADMIN_GUIDE.md)。

## 架構

```
承辦人 → Sanity Studio（雲端後台）
              │ 按下 Publish 觸發 webhook
              ▼
       Cloudflare Pages Deploy Hook
              │
              ├─ node scripts/build-lessons.mjs
              │     Sanity ──▶ _lessons/<學年度>/<代稱>.md
              │              ▶ _data/years.yml     （導覽選單的學年度清單）
              │              ▶ _data/homepage.yml  （首頁焦點新聞）
              │              ▶ _data/photos.yml    （活動照片輪播）
              │              ▶ lessons-<學年度>.html（各年度列表頁）
              │
              └─ bundle exec jekyll build ──▶ _site
              ▼
        Cloudflare Pages CDN
```

來自 Sanity 的有三塊：`/lessons/` 全部、首頁的「焦點新聞」區塊、活動照片頁的輪播。
關於聯盟與聯絡我們仍是版控裡的靜態檔案，改那些頁面還是改 repo。

圖片全部存在 Sanity，透過 `cdn.sanity.io` 提供，並在網址帶上尺寸參數自動壓縮成 WebP。
`assets/images/` 底下只剩 logo 與 about／contact 兩頁用的幾張圖，
教案與活動照片的原始檔已從版控移除（仍可在 main 分支的歷史與 `_backup/` 取得）。

## 產生的檔案不要手動改

這三類檔案每次建置都會被重新產生，手動修改會被覆蓋，也已列入 `.gitignore`：

- `_lessons/**/*.md` — 前置資料含 `generated: true`
- `lessons-<學年度>.html` — 檔頭有「請勿手動編輯」註解
- `_data/years.yml`、`_data/homepage.yml`、`_data/photos.yml`

年度頁的版型改 `_templates/year-page.html`（這份才是版控裡的來源）。

`scripts/build-lessons.mjs` 只會刪除帶有上述標記的檔案，手寫的檔案不會被動到。

## 分支配置

| 分支 | 用途 |
|---|---|
| `main` | 網站原始碼。推上去就會建置並部署到 Cloudflare Pages |
| `redirect` | 只放導轉頁，GitHub Pages 的發布來源，讓舊網址 `ntpc-bsa.github.io` 逐頁導到新站 |

## 開工前：本機分支狀態

這個工作目錄的 `main` 曾經落後遠端 6 個 commit，而遠端被 force-push 過
（本機那個 `366c3a2 Remove VR section` 的內容已包含在遠端的 `c08a5b2` 裡，是多餘的）。

`_lessons/` 與 `assets/images/lessons/` 已用 `git checkout origin/main --` 更新成遠端版本，
但分支指標還停在舊 commit。**推送任何東西之前**先把分支對齊：

```bash
git fetch origin
git reset --mixed origin/main   # 只移動分支指標，工作目錄的檔案完全不動
git status                      # 這時看到的才是真正的改動
```

## 一次性設定

### 1. 建立 Sanity 專案

到 <https://sanity.io/manage> 建立專案，dataset 用 `production` 並設為 **public**
（內容本來就公開，設 public 可以省掉建置時的 read token）。

記下 Project ID。

### 2. 本機環境變數

```bash
cp .env.example .env
# 填入 SANITY_PROJECT_ID
```

### 3. 部署後台

```bash
cd studio
npm install
SANITY_STUDIO_PROJECT_ID=<你的 projectId> npx sanity deploy
```

部署後網址是 `https://ntpc-bsa.sanity.studio`（`studio/sanity.cli.js` 裡的 `studioHost` 可改）。

到 sanity.io/manage → Members 邀請承辦人。**至少設兩位 Administrator**，
並把專案擁有權掛在單位共用信箱下，避免承辦人調動後沒人進得去。

### 4. 搬遷既有 24 篇教案

先建立一組 Editor 權限的 token（sanity.io/manage → API → Tokens），填進 `.env` 的
`SANITY_WRITE_TOKEN`，然後：

```bash
npm install
npm run verify          # 先確認轉換無損（不需要網路或帳號）
npm run migrate:dry     # 試跑，不寫入任何資料，看報告
npm run migrate         # 正式寫入
```

`migrate` 用固定的文件 `_id`，重跑會覆蓋同一批文件，不會產生重複資料。
**搬遷完成後請立刻撤銷這組 write token。**

搬遷完成後到後台逐篇抽查，特別是：

- 封面圖是否正確（112 沒有 preview 圖，是取內文第一張）
- `subject`（領域／科目）只有 113 會自動帶出，112 是空的，需要人工補
- 鷺江國中 112 那篇有 18 張圖原本外連 hackmd 圖床，搬遷後會變成 Sanity 上的副本

### 5. Cloudflare Pages

連結這個 repo，設定：

| 項目 | 值 |
|---|---|
| 建置指令 | `npm ci && npm run build` |
| 輸出目錄 | `_site` |
| 環境變數 | `SANITY_PROJECT_ID`、`SANITY_DATASET=production` |

Ruby 版本由 `.ruby-version`（目前 3.2.2）決定。

> **要先確認的事**：Cloudflare Pages 的建置映像檔必須同時有 Node 20+ 與 Ruby。
> 如果 `bundle install` 在 Cloudflare 上失敗，改走下面的備案。

部署成功後，把 `_config.yml` 的 `url:` 改成實際的 `*.pages.dev` 網址
（`jekyll-sitemap` 與 `jekyll-feed` 產生絕對網址時會用到）。

**備案：改在 GitHub Actions 建置**
`.github/workflows/build.yml` 已經寫好，用 `ruby/setup-ruby` 建置後以 wrangler 部署。
需要在 repo 設定 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`SANITY_PROJECT_ID` 三個 secret。

### 6. 發布後自動更新

Cloudflare Pages → Settings → Builds & deployments → Deploy hooks，建立一個 hook 拿到網址。

Sanity：sanity.io/manage → API → Webhooks → Create webhook

| 欄位 | 值 |
|---|---|
| URL | 上面的 Deploy hook 網址 |
| Dataset | production |
| Trigger on | Create, Update, Delete |
| Filter | `_type == "lesson"` |
| HTTP method | POST |

承辦人按下 Publish 之後約 2～3 分鐘網站就會更新。

### 7. 舊網址導轉

`ntpc-bsa.github.io` 上是完整的現行網站（112／113 共 24 篇）。搬到 Cloudflare 之後，
建議把該 repo 換成一頁導轉指向新網址。

**教案的網址路徑是刻意保留的**：搬遷時的 slug 直接沿用 Jekyll 依原檔名產生的既有網址
（已對線上實際網址驗證 24/24 相符），例如

```
舊 https://ntpc-bsa.github.io/lessons/112-中正國中tag-rugby教案/
新 https://<新網域>/lessons/112-中正國中tag-rugby教案/
```

所以導轉可以直接做路徑對路徑的轉址，已經發出去的深層連結不會失效。
之後在後台新增的教案則由 Studio 自動產生較乾淨的 slug。

## 日常運作

新增學年度**不需要任何程式改動**。承辦人在後台把「學年度」填 114，
發布之後選單會自動多出「114 學年度」，`/lessons/114/` 也會自動產生。

## 驗證工具

| 指令 | 用途 | 需要網路？ |
|---|---|---|
| `npm run verify` | 兩項驗證都跑 | 否 |
| `node scripts/verify-roundtrip.mjs` | Markdown ⇄ Portable Text 往返無損 | 否 |
| `node scripts/verify-build.mjs` | Sanity → Jekyll 的產出與現有頁面一致 | 否 |
| `npm run migrate:dry` | 搬遷試跑報告 | 是（檢查外部圖床） |

前兩支是在改動 `scripts/lib/portable-text.mjs` 之後的迴歸測試，
但它們依賴 `_lessons/` 裡的原始檔；搬遷完成、原始檔被產生檔取代之後就失去比對基準。
**建議在搬遷前把 `_lessons/` 的原始 24 篇另存一份**（`_backup/` 的壓縮檔已經有一份）。

## 疑難排解

**建置中止，說「沒有從 Sanity 取到任何教案」**
這是刻意的保護：如果查詢回空陣列就直接失敗，而不是把整個教案區清空。
先確認 `SANITY_PROJECT_ID` / `SANITY_DATASET` 是否指到正確的 dataset，
以及 dataset 是不是設成 private 卻沒給 `SANITY_READ_TOKEN`。

**後台發布了但網站沒更新**
依序檢查：Sanity 的 webhook 有沒有送出（管理介面看得到送出紀錄）→
Cloudflare Pages 有沒有觸發新的建置 → 建置記錄檔。
建置時一律 `useCdn: false`，所以不會是快取造成的。

**某篇教案沒有出現**
`build-lessons.mjs` 會跳過缺少 title / slug / academicYear / date 的文件，並在建置記錄印出訊息。

## 退場方案

`build-lessons.mjs` 產生的就是一般的 Jekyll markdown。萬一要脫離 Sanity，
把最後一次產生的 `_lessons/` 從 `.gitignore` 拿掉並 commit 進版控，
網站就回到今天這種純 Jekyll 的形態，不會被綁死。
