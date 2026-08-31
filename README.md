# 新北市雙語策略聯盟

Jekyll 靜態網站，教案與部分首頁內容由 Sanity 後台管理，
透過 GitHub Actions 建置後部署到 Cloudflare Pages。

| | 網址 |
|---|---|
| 網站 | <https://ntpc-bsa.pages.dev> |
| 後台 | <https://ntpc-bsa.pages.dev/admin>（轉址到 Sanity Studio） |
| 舊網址 | <https://ntpc-bsa.github.io> — 逐頁導轉到新站 |

**承辦人的操作說明是獨立的網頁版手冊**，請向技術窗口索取連結。

---

## 架構

```
承辦人 → Sanity Studio
            │ 按下 Publish 觸發 webhook
            ▼
     GitHub Actions（main 分支）
            │
            ├─ node scripts/build-lessons.mjs
            │     Sanity ──▶ _lessons/<學年度>/<代稱>.md
            │              ▶ _data/years.yml     導覽選單的學年度清單
            │              ▶ _data/homepage.yml  首頁焦點新聞
            │              ▶ _data/photos.yml    活動照片輪播
            │              ▶ lessons-<學年度>.html
            │
            └─ bundle exec jekyll build ──▶ _site
            ▼
     Cloudflare Pages（wrangler 上傳）
```

發布到網站更新大約一分鐘。

### 分支

| 分支 | 用途 |
|---|---|
| `main` | 網站原始碼。推上去就會建置並部署 |
| `redirect` | 只放導轉頁，是 GitHub Pages 的發布來源，讓舊網址逐頁導到新站 |

### 哪些內容來自後台

**來自 Sanity**：`/lessons/` 全部、首頁的焦點新聞、活動照片頁的輪播。
**仍是版控裡的靜態檔案**：關於聯盟、聯絡我們、版型與樣式。

圖片全部存在 Sanity，由 `cdn.sanity.io` 提供並依網址參數自動壓縮。
`assets/images/` 底下只剩 logo 與 about／contact 用的幾張圖。

### 產生的檔案不要手動改

每次建置都會重新產生，也都已列入 `.gitignore`：

- `_lessons/**/*.md` — 前置資料含 `generated: true`
- `lessons-<學年度>.html` — 檔頭有「請勿手動編輯」註解
- `_data/years.yml`、`_data/homepage.yml`、`_data/photos.yml`

年度頁的版型要改 `_templates/year-page.html`，那份才是版控裡的來源。
`build-lessons.mjs` 只刪除帶有上述標記的檔案，手寫的檔案不會被動到。

---

## 本機開發

```bash
cp .env.example .env      # 填入 SANITY_PROJECT_ID
npm install
npm run lessons           # 從 Sanity 產生教案檔案
bundle exec jekyll serve
```

dataset 是 public，所以建置不需要任何 Sanity token。

### 後台

```bash
cd studio
npm install
npx sanity dev            # 本機預覽
npx sanity deploy         # 部署到 ntpc-bsa.sanity.studio
```

改過 `studio/schemas/` 之後要重新 deploy，後台才會看到新欄位。

### 驗證工具

| 指令 | 用途 |
|---|---|
| `npm run liquid` | 檢查所有 html／md 的 Liquid 標籤有沒有配對 |
| `npm run verify` | 上面那項 ＋ 內容轉換的迴歸測試 |

本機沒裝 Ruby 的話跑不了 `jekyll build`，`npm run liquid` 是推送前最低限度的把關 ——
曾經就是漏掉一個 `{% endif %}` 才在 CI 上掛掉。

---

## 部署設定

### GitHub Actions

`.github/workflows/build.yml`。需要三個 repository secret：

- `CLOUDFLARE_API_TOKEN`（權限：Cloudflare Pages – Edit）
- `CLOUDFLARE_ACCOUNT_ID`
- `SANITY_PROJECT_ID`

### 發布後自動重建

Sanity 的 webhook 打 GitHub 的 workflow dispatch API：

| 欄位 | 值 |
|---|---|
| URL | `https://api.github.com/repos/ntpc-bsa/ntpc-bsa.github.io/actions/workflows/build.yml/dispatches` |
| HTTP method | `POST` |
| Trigger on | Create、Update、Delete |
| Filter | `_type == "lesson" \|\| _type == "homepage" \|\| _type == "photos"` |
| Projection | `{"ref": "main"}` |
| Headers | `Authorization: Bearer <GitHub token>`、`Accept: application/vnd.github+json` |

Token 需要 `repo` scope。**Projection 一定要填**，否則 Sanity 會送出文件內容，
GitHub 因為缺少 `ref` 會回 422。

> 不能用 Cloudflare 的 Deploy Hook —— 那只有 git 連結的 Pages 專案才有，
> 這個專案是 Direct Upload。

---

## 疑難排解

**建置中止，說「沒有從 Sanity 取到任何教案」**
這是刻意的保護：查詢回空陣列就直接失敗，而不是把整個教案區清空。
先確認環境變數指到正確的 dataset。

**後台發布了但網站沒更新**
依序看：Sanity webhook 有沒有送出（管理介面有紀錄）→ GitHub Actions 有沒有被觸發 → 建置記錄。
建置一律 `useCdn: false`，所以不會是快取問題。
也要確認 webhook 用的 GitHub token 還沒過期。

**某篇教案沒出現**
`build-lessons.mjs` 會跳過缺少 title / slug / academicYear / date 的文件，並在建置記錄印出訊息。

---

## 其他

**Adobe Fonts**：`_layouts/default.html` 載入 `use.typekit.net/wbm6qnj.css` 取得 Vortice 字體。
要換字體或續約，到 [Adobe Fonts](https://fonts.adobe.com/) 的 Web Projects 管理該專案，
把新的 kit 網址換上去即可。

**退場方案**：`build-lessons.mjs` 產生的就是一般的 Jekyll markdown。
萬一要脫離 Sanity，把最後一次產生的 `_lessons/` 從 `.gitignore` 拿掉並 commit 進版控，
網站就回到純 Jekyll 的形態，不會被綁死。

**一次性腳本**（都已執行完畢，保留備查）：
`migrate-to-sanity.mjs`、`seed-homepage.mjs`、`seed-photos.mjs`、`fetch-live-covers.mjs`、
`purge-sanity.mjs`。要重跑需要一組 Editor 權限的 Sanity token。
