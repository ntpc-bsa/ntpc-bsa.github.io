# 照片輪播使用指南

## 📁 資料夾結構

```
assets/
└── images/
    └── carousel/          # 輪播照片專用資料夾
        ├── README.md      # 使用說明
        ├── placeholder.txt # 佔位檔案
        └── [您的照片檔案]
```

## 📸 如何添加輪播照片

### 1. 準備照片
- **格式**：JPG 或 PNG
- **尺寸**：建議 1200x500 像素以上
- **比例**：橫向照片（寬度大於高度）
- **檔案大小**：不超過 2MB

### 2. 上傳照片
將您的照片檔案放入 `assets/images/carousel/` 資料夾中

### 3. 更新輪播內容
編輯 `photos.html` 檔案，在輪播區域添加新的照片：

```html
<div class="photo-carousel-slide">
    <img src="{{ '/assets/images/carousel/您的照片檔案.jpg' | relative_url }}" alt="照片描述">
    <div class="photo-carousel-caption">
        <h3>照片標題</h3>
        <p>照片描述</p>
    </div>
</div>
```

### 4. 更新指示器
在 `photos.html` 中找到輪播指示器區域，添加對應的指示器：

```html
<div class="photo-carousel-indicators">
    <span class="photo-carousel-dot active" onclick="currentPhotoSlide(1)"></span>
    <span class="photo-carousel-dot" onclick="currentPhotoSlide(2)"></span>
    <!-- 為每張照片添加一個指示器 -->
</div>
```

## 🎯 建議的照片內容

- 雙語教學活動
- 國際交流活動
- 教師研習活動
- 學生成果展示
- 學校特色活動
- 外師教學場景

## 📝 檔案命名建議

使用描述性的檔案名稱：
- `carousel-01-雙語體育課程.jpg`
- `carousel-02-國際志工活動.jpg`
- `carousel-03-外師教學.jpg`
- `carousel-04-教師研習.jpg`

## ⚙️ 輪播設定

### 自動輪播
- 每 4 秒自動切換到下一張照片
- 可在 `assets/js/photo-carousel.js` 中調整時間間隔

### 手動控制
- 左右箭頭按鈕可手動切換
- 底部指示器可直接點擊切換

### 響應式設計
- 桌面版：500px 高度
- 手機版：300px 高度
- 自動適應不同螢幕尺寸

## 🔧 技術細節

### CSS 類別
- `.photo-carousel-container`：輪播容器
- `.photo-carousel-slide`：單張照片
- `.photo-carousel-caption`：照片標題區域
- `.photo-carousel-dot`：指示器

### JavaScript 函數
- `showPhotoSlide(n)`：顯示指定照片
- `movePhotoCarousel(direction)`：移動輪播
- `currentPhotoSlide(n)`：點擊指示器切換

## 📱 手機版優化

輪播在手機上會自動調整：
- 照片高度縮小到 300px
- 控制按鈕變小
- 標題字體縮小
- 保持觸控友好的操作體驗

## 🎨 自訂樣式

如需調整輪播外觀，可編輯 `assets/css/style.css` 中的相關樣式：

```css
.photo-carousel-container {
    /* 調整容器樣式 */
}

.photo-carousel-slide {
    /* 調整照片樣式 */
}

.photo-carousel-caption {
    /* 調整標題樣式 */
}
```

## 📞 需要協助？

如果您在添加照片或調整輪播時遇到問題，請參考：
1. `assets/images/carousel/README.md` - 詳細使用說明
2. `photos.html` - 現有的輪播範例
3. `assets/js/photo-carousel.js` - JavaScript 功能說明 