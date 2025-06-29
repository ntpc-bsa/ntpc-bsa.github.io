# Adobe Fonts (Vortice) 設置說明

## 如何啟用 Vortice 字體

### 方法 1: 使用 Adobe Creative Cloud (推薦)

1. **登入 Adobe Creative Cloud**
   - 前往 [Adobe Fonts](https://fonts.adobe.com/)
   - 使用您的 Adobe ID 登入

2. **搜尋並啟用 Vortice 字體**
   - 在搜尋框中輸入 "Vortice"
   - 點擊 "Activate" 或"啟用" 按鈕

3. **創建 Web Project**
   - 前往 "Web Projects" 頁面
   - 點擊 "Create new Web Project"
   - 命名為 "新北市雙語策略聯盟"
   - 選擇 Vortice 字體並添加到項目中

4. **獲取 Kit ID**
   - 複製您的 Kit ID (例如: abc123def)
   - 將 Kit ID 貼到 `_layouts/default.html` 中：

```html
<!-- 將這行中的 'your-kit-id-here' 替換為您的實際 Kit ID -->
kitId: 'your-kit-id-here',
```

### 方法 2: 使用替代字體 (臨時方案)

如果無法使用 Adobe Fonts，我們可以使用類似的字體：

1. **使用 Google Fonts 的 Oswald**
   ```css
   font-family: 'Oswald', 'Noto Sans TC', sans-serif;
   ```

2. **使用 Google Fonts 的 Roboto Condensed**
   ```css
   font-family: 'Roboto Condensed', 'Noto Sans TC', sans-serif;
   ```

## 驗證字體是否正確載入

1. 啟動本地服務器
2. 前往首頁
3. 檢查 "REAL WORLD LEARNING" 文字是否使用了新字體
4. 如果字體沒有改變，請檢查瀏覽器的開發者工具中是否有載入錯誤

## 需要協助？

如果您需要協助設置 Adobe Fonts，請提供：
- 您的 Adobe Creative Cloud 訂閱狀態
- 是否偏好使用替代字體
- 任何錯誤訊息的截圖 