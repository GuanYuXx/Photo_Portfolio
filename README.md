# LENS — 藝廊級攝影作品集網站 & Serverless CMS

一個優雅、極簡且充滿呼吸感的攝影作品集網站。採用無伺服器（Serverless）架構，結合 **GitHub API** 實現 Git-based 內容管理系統（CMS），並整合 **Cloudinary 智慧動態優化 CDN**，提供極致流暢的 RWD 瀏覽與寫真展示體驗。

---

## 🌟 核心亮點與特色功能

### 🔐 1. 訪客安全唯讀 & Serverless Git-based CMS
* **訪客端（唯讀安全）**：一般訪客瀏覽時完全為靜態唯讀，不會顯示任何編輯入口，直接從 `/data.json` 載入最高速的作品集快照。
* **管理員端（無伺服器 CMS）**：低調設計的頁尾齒輪按鈕，點擊即可開啟設定面板。只需輸入您的 GitHub Token 與路徑，即可在瀏覽器直接開啟「編輯模式」，新增、刪除、拖拉排序相簿及照片，並點擊「儲存」直接透過 GitHub API 將變更 commit 同步回 `data.json` 檔案！

### ⚡ 2. Cloudinary 智慧圖片動態優化 & Canvas 壓縮
* **雙重壓縮引擎**：
  * **本地測試模式**：透過 HTML5 `<canvas>` 引擎在瀏覽器本機端將照片等比例壓縮至 1000px 寬 (JPEG 60%)，將 15MB 寫真壓縮為 **50KB - 80KB**，完美繞過瀏覽器 5MB `localStorage` 容量上限，可供任意測試 80+ 張照片。
  * **正式模式**：保留 100% 原始高解析度原檔上傳至 Cloudinary 雲端。網頁載入時動態向 CDN 索取最適合的規格（**縮圖網格** 限制 `800px` 寬 WebP/AVIF 僅需 **50KB**；**全螢幕燈箱** 限制 `1600px` 寬僅需 **200KB**），秒開網頁且畫質完美！

### 🏷️ 3. 一鍵批次分區與場景標記 (Sectioned Layout)
* **分區區塊排版**：新增第五種排版樣式。您可以在一個作品集中，依據不同角度、故事、時間點將照片劃分為多個優美的小區塊。
* **批次快速上傳**：在點選「新增照片」上傳整批檔案時，可直接在 Modal 中輸入「分區名稱」（如：*第一幕：清晨、特寫*），所有上傳的照片將會自動一鍵套用此分區標記，省去一張張編輯的繁瑣手續。

### ✍️ 4. 辰宇落雁手寫體文藝質感
* 特別引進台灣開源手寫字體 **「辰宇落雁體 (Chenyuluoyan Thin)」**，應用於分區排版的區塊標題（支持中英文）。搭配動態載入優化（只在進入相簿時非同步加載，首頁不佔用下載流量），大幅提升作品集的藝術氣息。

### 👤 5. 零程式碼客隆自用支援 (Zero-Code Customize)
* **完全動態解耦**：網站擁有者的「個人姓名」、「Instagram 帳號」與「聯絡電子郵件」均已完全資料庫化。
* 只要在首頁點選「編輯模式」➜「編輯首頁資訊」，即可直接打字修改全站簽名、IG 連結及 Footer 電子信箱，方便任何人 Clone 後一鍵快速客製化！

### 📱 6. 行動端 RWD 極緻瀏覽與手勢燈箱
* 手動優化手機版卡片與封面的排版呼吸感。
* 手機版 Lightbox 燈箱全面相容 **Swipe 觸控左右滑動手勢**，訪客只需以手指輕輕一撥即可換張，按鈕亦全面放大防誤觸。

---

## 📁 檔案結構

```
photo-portfolio/
├── index.html            # 首頁 (個人檔案、標語與作品集列表)
├── album.html            # 作品集頁面 (自適應排版、燈箱與分區展示)
├── data.json             # 中央資料庫 (包含個人資訊、標語、作品集與照片 metadata)
├── css/
│   ├── style.css         # 首頁樣式、管理員登入與通用 Glassmorphism 元件
│   └── album.css         # 相簿排版排版與手寫字體載入樣式
├── js/
│   ├── data.js           # 資料庫傳輸層 (Fetch 載入、Unicode Base64、GitHub API、Cloudinary 優化)
│   ├── main.js           # 首頁動態渲染、拖拉排序與個人資訊更新
│   └── album.js          # 相簿動態分區渲染、Canvas 圖片壓縮、非同步上傳進度條與 Swipe 燈箱
└── README.md
```

---

## 🚀 架設與設定教學

要讓您的攝影藝廊上線並開啟管理功能，只需完成以下設定：

### 步驟一：GitHub 儲存庫建立與 Pages 開啟
1. 在您的 GitHub 帳號上建立一個 **全空的 Repository**（例如 `Photo_Portfolio`）。
2. 在您的專案根目錄下，依序執行 Git 指令推送程式碼：
   ```bash
   git remote add origin https://github.com/您的GitHub用戶名/Photo_Portfolio.git
   git branch -M main
   git push -u origin main
   ```
3. 進入 Repository 頁面 ➜ **Settings** ➜ **Pages**。
4. **Build and deployment** 中：`Source` 選擇 `Deploy from a branch`；`Branch` 選擇 **`main`**，資料夾選擇 **`/ (root)`**，點擊 **Save**。
5. 等待約 1 分鐘，您的網站就上線了（例如：`https://guanyuxx.github.io/Photo_Portfolio/`）。

### 步驟二：申請 GitHub 個人存取權杖 (PAT)
1. 登入 GitHub ➜ 點擊右上角頭像 ➜ **Settings** ➜ 最下方點擊 **Developer settings**。
2. 選擇 **Personal Access Tokens** ➜ **Fine-grained tokens** ➜ 點擊 **Generate new token**。
3. 名稱填寫 `LENS-CMS`；**Repository access** 選擇 `Only select repositories` 並指向您的 `Photo_Portfolio` 專案。
4. ⚠️ **最關鍵一步**：在 **Permissions** ➜ **Repository permissions** 中，找到 **`Contents`** 權限，並將其設定為 **Read and Write** (必須包含讀與寫)。
5. 點擊生成，將產生的 `ghp_` 權杖完整複製下來。

### 步驟三：設定免費圖床 (Cloudinary)
1. 註冊並登入免費的 [Cloudinary](https://cloudinary.com) 帳戶。
2. 在 Dashboard 左上角或儀表板中複製您的 **Cloud Name**。
3. 點擊左下角 **⚙️ Settings (齒輪)** ➜ 進入 **Upload** 設定頁面。
4. 往下滾動找到 **Upload presets**，點擊 **Add upload preset**。
5. 將 **Signing Mode** 修改為 **`Unsigned`**，其餘保留預設，點擊上方 Save 儲存。
6. 複製該產生的 Preset 名稱（通常是一串隨機字串，例如 `ml_default` 或隨機英文）。

### 步驟四：在網頁進行管理員登入
1. 開啟您上線後的網站，滾動至頁尾，點選右下角細緻的 **⚙️ (齒輪)** 按鈕。
2. 填入您的 GitHub 儲存庫路徑（如：`GuanYuXx/Photo_Portfolio`）、Token、Cloud Name 與 Preset 名稱。
3. 點選「測試連線」驗證，成功後點選「儲存設定」或「本地測試（不需金鑰即可測試）」。
4. 恭喜！網頁右上角的 **「編輯」** 按鈕已解鎖，您現在是網站的最高管理者了！

---

## 🛠️ 管理員使用常見問題 (Troubleshooting)

> [!WARNING]
> ### 1. 儲存時出現 `Invalid request. "sha" wasn't supplied` 錯誤？
> * **原因**：GitHub API 在覆寫現有 `data.json` 檔案時，必須先取得該檔案目前的 `sha` 身分指紋。如果您遇到此錯誤，代表網頁讀取指紋失敗。
> * **解決方法**：
>   1. **檢查 Token 權限**：請至 GitHub 重新確認您的 Token。**`Contents` 權限是否確實勾選了 Read and Write**？若沒有 Read 權限，網頁就無法索取指紋，進而導致覆寫失敗。
>   2. **檢查儲存庫路徑大小寫**：請確保路徑的大小寫與 GitHub 網址完全一致（例如 `GuanYuXx/Photo_Portfolio`），大小寫錯一個字也會導致 API 連接失敗。
>   3. **Token 是否過期**：請檢查 Token 是否在有效期限內。

> [!NOTE]
> ### 2. 為什麼本地測試模式的圖片看起來沒那麼大？
> * **原因**：本地測試是為了防禦瀏覽器 `localStorage` 的 5MB 空間上限。如果不進行壓縮，放 2 張照片就無法再新增了。
> * **正式模式**（設定完 Cloudinary 之後）網頁會**100% 完整保存您的相機原始高清原圖**，並僅在瀏覽時動態優化載入，完全不傷畫質！

> [!IMPORTANT]
> ### 3. 清除 URL 參數跳轉防禦機制
> * **狀況**：在某些本地伺服器（如 `npx serve` 或 Clean URL 託管）中，點選作品集卡片跳轉至 `album.html?id=xxx` 時，伺服器可能會自動轉址成 `album.html` 並丟失後方的 ID 參數，導致無法讀取照片被迫退回首頁。
> * **我們的防禦解決方案**：程式已內建 `localStorage` 卡片點擊備份機制。當 URL 參數不幸丟失時，`album.js` 會自動讀取本地最後點擊快取的相簿 ID 作為後備，確保 100% 順暢進入子頁面。

---

## 📄 授權條款

* 網頁系統：本專案採用開源 MIT 授權，歡迎自由修改、Clone 或二次開發。
* 辰宇落雁體：字體採用 **SIL Open Font License 1.1 (OFL)** 釋出，允許自由商用、散佈與改作。
