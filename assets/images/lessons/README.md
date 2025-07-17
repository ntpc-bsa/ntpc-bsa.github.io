# 教案圖片管理系統

## 目錄結構

```
assets/images/lessons/
├── 中正國中/
├── 二重國中/
├── 佳林國中/
├── 大觀國中/
├── 林口國中/
├── 樟樹國際實中/
├── 汐止國中/
├── 淡水國中/
├── 清水高中/
├── 重慶國中/
├── 青山國中小/
└── 鷺江國中/
```

## 圖片命名規範

### 方法一：按學校分類
```
assets/images/lessons/鷺江國中/
├── 01-童軍教育-1.jpg
├── 01-童軍教育-2.jpg
├── 02-音樂課程.jpg
└── 03-家政課程.jpg
```

### 方法二：統一命名
```
assets/images/lessons/
├── 鷺江國中-童軍教育-1.jpg
├── 鷺江國中-童軍教育-2.jpg
├── 鷺江國中-音樂課程.jpg
└── 鷺江國中-家政課程.jpg
```

## 在教案中使用本地圖片

### 原本的外部連結：
```markdown
<img src="https://hackmd.io/_uploads/ByMJWlWUle.jpg" alt="童軍雙語">
```

### 改為本地圖片：
```markdown
<img src="{{ '/assets/images/lessons/鷺江國中/01-童軍教育-1.jpg' | relative_url }}" alt="童軍雙語">
```

或使用統一命名：
```markdown
<img src="{{ '/assets/images/lessons/鷺江國中-童軍教育-1.jpg' | relative_url }}" alt="童軍雙語">
```

## 圖片格式建議

- **格式**: JPG, PNG, WebP
- **尺寸**: 最大寬度 1200px
- **檔案大小**: 建議小於 500KB
- **命名**: 使用英文或數字，避免特殊字符

## 使用步驟

1. 將圖片放入對應的學校目錄
2. 修改教案 `.md` 檔案中的圖片路徑
3. 使用 `{{ '/assets/images/lessons/...' | relative_url }}` 格式
4. 提交到 Git 即可

## 優點

- ✅ 圖片隨網站一起版本控制
- ✅ 不依賴外部圖片服務
- ✅ 載入速度更快
- ✅ 不會有圖片失效問題
- ✅ 可以離線瀏覽 