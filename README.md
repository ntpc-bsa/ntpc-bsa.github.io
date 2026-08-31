# ntpc-bsa.github.io — 導轉

這個分支只有一個用途：把舊網址 `https://ntpc-bsa.github.io/` 的流量
導到新網站 `https://ntpc-bsa.pages.dev/`。

GitHub Pages 的發布來源設定成這個 `redirect` 分支，
網站的實際原始碼在 `main`（建置與部署由 GitHub Actions 送到 Cloudflare Pages）。

- `index.html`：首頁的導轉
- `404.html`：其他所有路徑的導轉。GitHub Pages 找不到檔案時會回這一頁，
  裡面的 JavaScript 會把原路徑原封不動接到新網域後面，
  所以 `/lessons/112-中正國中tag-rugby教案/` 會直接到新站的同一篇教案。
- `.nojekyll`：跳過 Jekyll 建置，直接當靜態檔案送出。

換新網域時，改 `index.html` 與 `404.html` 裡的 `base` 變數即可。
