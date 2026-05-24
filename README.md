# LENS — Photography Portfolio

一個優雅的攝影作品集網站，支援多個作品集管理、拖拉排序、多種排版模式，以及完整的 RWD 響應式設計。

## 功能

- 🖼️ **多作品集管理** — 建立多個主題作品集
- 🎨 **4 種排版模式** — 磚牆 / 網格 / 全寬 / 雙欄
- ✏️ **拖拉排序** — 直接拖拉照片和作品集排列順序
- 🔍 **Lightbox 燈箱** — 點擊照片全螢幕瀏覽，支援鍵盤左右鍵
- 📱 **完整 RWD** — 手機、平板、桌機都完美適配
- 💾 **本地儲存** — 所有設定儲存在瀏覽器 localStorage

## 檔案結構

```
photo-portfolio/
├── index.html          # 首頁 (作品集列表)
├── album.html          # 作品集頁面
├── css/
│   ├── style.css       # 主要樣式
│   └── album.css       # 作品集頁面樣式
├── js/
│   ├── data.js         # 資料管理層
│   ├── main.js         # 首頁邏輯
│   └── album.js        # 作品集頁面邏輯
└── README.md
```

## 架設到 GitHub Pages

### 步驟 1：建立 Repository

```bash
git init
git add .
git commit -m "Initial commit"
```

### 步驟 2：推送到 GitHub

1. 在 GitHub 建立新的 Repository（例如 `photo-portfolio`）
2. 推送程式碼：

```bash
git remote add origin https://github.com/你的用戶名/photo-portfolio.git
git branch -M main
git push -u origin main
```

### 步驟 3：開啟 GitHub Pages

1. 進入 Repository → Settings → Pages
2. Source 選擇 `main` branch，資料夾選 `/ (root)`
3. 點擊 Save
4. 等待幾分鐘後，網址會是 `https://你的用戶名.github.io/photo-portfolio`

## 使用方法

### 新增作品集
1. 點右上角「編輯」按鈕進入編輯模式
2. 點「新增作品集」輸入名稱、封面圖片網址等資訊

### 新增照片
1. 進入作品集頁面
2. 點「編輯」→「新增照片」，貼上照片網址

### 排序
- 進入編輯模式後，直接拖拉作品集卡片或照片即可重新排序

### 排版模式（作品集頁面）
| 模式 | 說明 |
|------|------|
| 磚牆 | Pinterest 風格，自動填充高度 |
| 網格 | 等比例正方格排列 |
| 全寬 | 每張照片全寬展示 |
| 雙欄 | 兩欄並排 |

## 照片來源建議

可以使用以下免費圖片服務：
- [Unsplash](https://unsplash.com) — 高品質免費照片
- [Imgur](https://imgur.com) — 免費圖片托管
- [GitHub 自己的 repo](https://github.com) — 上傳照片到 repo 直接引用

## 注意事項

- 資料儲存在瀏覽器 localStorage，更換瀏覽器或清除快取會遺失設定
- 若需要跨裝置同步，建議將照片資料改為 JSON 檔案存放在 repo 中
- 照片建議使用外部圖床，避免 repo 過大
