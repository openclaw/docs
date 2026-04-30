---
x-i18n:
    generated_at: "2026-04-30T03:41:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Tweakcn 自訂主題匯入設計

狀態：已於 2026-04-22 在終端機核准

## 摘要

新增剛好一個瀏覽器本機的自訂控制 UI 主題槽位，可從 tweakcn 分享連結匯入。現有內建主題系列仍為 `claw`、`knot` 和 `dash`。新的 `custom` 系列表現得像一般 OpenClaw 主題系列，且在匯入的 tweakcn 承載內容包含亮色與暗色兩組 token 時，支援 `light`、`dark` 和 `system` 模式。

匯入的主題只會與其餘控制 UI 設定一同儲存在目前的瀏覽器設定檔中。它不會寫入 gateway 設定，也不會跨裝置或瀏覽器同步。

## 問題

控制 UI 主題系統目前封閉在三個硬編碼的主題系列內：

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

使用者可以在內建系列和模式變體之間切換，但無法在不編輯 repo CSS 的情況下帶入 tweakcn 的主題。要求的成果小於一般主題系統：保留三個內建主題，並新增一個使用者可控制、可從 tweakcn 連結替換的匯入槽位。

## 目標

- 保持現有內建主題系列不變。
- 新增剛好一個匯入的自訂槽位，而不是主題庫。
- 接受 tweakcn 分享連結或直接的 `https://tweakcn.com/r/themes/{id}` URL。
- 只在瀏覽器 local storage 中保留匯入的主題。
- 讓匯入槽位可搭配現有 `light`、`dark` 和 `system` 模式控制項使用。
- 保持安全的失敗行為：不良匯入絕不破壞作用中的 UI 主題。

## 非目標

- 不做多主題庫或瀏覽器本機匯入清單。
- 不做 gateway 端持久化或跨裝置同步。
- 不做任意 CSS 編輯器或原始主題 JSON 編輯器。
- 不從 tweakcn 自動載入遠端字型資產。
- 不嘗試支援只公開一種模式的 tweakcn 承載內容。
- 不做控制 UI 所需接縫以外的 repo 全域主題重構。

## 已做出的使用者決策

- 保留三個內建主題。
- 新增一個由 tweakcn 驅動的匯入槽位。
- 將匯入的主題儲存在瀏覽器，而不是 gateway 設定。
- 讓匯入槽位支援 `light`、`dark` 和 `system`。
- 使用下一次匯入覆寫自訂槽位是預期行為。

## 建議方法

將第四個主題系列 id `custom` 新增至控制 UI 主題模型。只有在存在有效的 tweakcn 匯入時，`custom` 系列才可選取。匯入的承載內容會正規化成 OpenClaw 專用的自訂主題記錄，並與其餘 UI 設定一同儲存在瀏覽器 local storage 中。

在執行階段，OpenClaw 會渲染受管理的 `<style>` 標籤，用來定義解析後的自訂 CSS 變數區塊：

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

這會讓自訂主題變數侷限在 `custom` 系列，並避免將行內 CSS 變數洩漏到內建系列中。

## 架構

### 主題模型

更新 `ui/src/ui/theme.ts`：

- 擴充 `ThemeName` 以包含 `custom`。
- 擴充 `ResolvedTheme` 以包含 `custom` 和 `custom-light`。
- 擴充 `VALID_THEME_NAMES`。
- 更新 `resolveTheme()`，讓 `custom` 鏡像現有系列行為：
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> 依據 OS 偏好設定解析為 `custom` 或 `custom-light`

不為 `custom` 新增舊版別名。

### 持久化模型

在 `ui/src/ui/storage.ts` 中擴充 `UiSettings` 持久化，加入一個可選的自訂主題承載內容：

- `customTheme?: ImportedCustomTheme`

建議儲存形狀：

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

注意事項：

- `sourceUrl` 會儲存正規化後的原始使用者輸入。
- `themeId` 是從 URL 擷取出的 tweakcn 主題 id。
- `label` 在存在時使用 tweakcn `name` 欄位，否則使用 `Custom`。
- `light` 和 `dark` 是已正規化的 OpenClaw token map，不是原始 tweakcn 承載內容。
- 匯入的承載內容與其他瀏覽器本機設定並列，並序列化到同一份 local-storage 文件中。
- 如果載入時儲存的自訂主題資料缺失或無效，忽略該承載內容，且當持久化的系列為 `custom` 時退回 `theme: "claw"`。

### 執行階段套用

在控制 UI 執行階段加入狹窄的自訂主題 stylesheet 管理器，所有權放在 `ui/src/ui/app-settings.ts` 和 `ui/src/ui/theme.ts` 附近。

職責：

- 在 `document.head` 中建立或更新一個穩定的 `<style id="openclaw-custom-theme">` 標籤。
- 只有在存在有效的自訂主題承載內容時輸出 CSS。
- 清除承載內容時移除 style 標籤內容。
- 將內建系列 CSS 保持在 `ui/src/styles/base.css`；不要將匯入的 token 拼接進已提交的 stylesheet。

這個管理器會在載入、儲存、匯入或清除設定時執行。

### 亮色模式選擇器

實作應優先使用 `data-theme-mode="light"` 進行跨系列的亮色樣式設定，而不是特別處理 `custom-light`。如果現有選擇器固定在 `data-theme="light"`，且需要套用到每個亮色系列，請將其作為這項工作的一部分加寬。

## 匯入 UX

在 `ui/src/ui/views/config.ts` 的 `Appearance` 區段中更新：

- 在 `Claw`、`Knot` 和 `Dash` 旁新增一張 `Custom` 主題卡。
- 沒有匯入自訂主題時，將卡片顯示為停用。
- 在主題網格下方新增匯入面板，包含：
  - 一個用於 tweakcn 分享連結或 `/r/themes/{id}` URL 的文字輸入
  - 一個 `Import` 按鈕
  - 當自訂承載內容已存在時的一個 `Replace` 路徑
  - 當自訂承載內容已存在時的一個 `Clear` 動作
- 承載內容存在時顯示匯入的主題標籤與來源主機。
- 如果作用中主題為 `custom`，匯入替換項會立即套用。
- 如果作用中主題不是 `custom`，匯入只會儲存新的承載內容，直到使用者選取 `Custom` 卡片。

`ui/src/ui/views/config-quick.ts` 中的快速設定主題選擇器也應該只在承載內容存在時顯示 `Custom`。

## URL 解析與遠端擷取

瀏覽器匯入路徑接受：

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

實作應將兩種形式正規化為：

- `https://tweakcn.com/r/themes/{id}`

接著瀏覽器會直接擷取正規化的 `/r/themes/{id}` endpoint。

對外部承載內容使用狹窄的 schema validator。因為這是不受信任的外部邊界，建議使用 zod schema。

必要遠端欄位：

- 頂層 `name` 為可選字串
- `cssVars.theme` 為可選物件
- `cssVars.light` 為物件
- `cssVars.dark` 為物件

如果 `cssVars.light` 或 `cssVars.dark` 任一缺失，拒絕匯入。這是刻意設計：已核准的產品行為是完整模式支援，而不是盡力合成缺失的一側。

## Token 對應

不要盲目鏡像 tweakcn 變數。將有限子集正規化為 OpenClaw token，並在 helper 中衍生其餘項目。

### 直接匯入的 token

從每個 tweakcn 模式區塊：

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

從存在時的共用 `cssVars.theme`：

- `font-sans`
- `font-mono`

如果模式區塊覆寫 `font-sans`、`font-mono` 或 `radius`，模式本機值優先。

### 為 OpenClaw 衍生的 token

匯入器會從匯入的基礎色彩衍生 OpenClaw 專用變數：

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

衍生規則位於純 helper 中，因此可獨立測試。確切的色彩混合公式屬於實作細節，但 helper 必須滿足兩項限制：

- 保持接近匯入主題意圖的可讀對比
- 對相同匯入承載內容產生穩定輸出

### v1 中忽略的 token

第一版會刻意忽略這些 tweakcn token：

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

這會將範圍維持在目前控制 UI 實際需要的 token 上。

### 字型

如果存在，會匯入字型堆疊字串，但 OpenClaw 在 v1 不會載入遠端字型資產。如果匯入的堆疊引用了瀏覽器中不可用的字型，會套用一般 fallback 行為。

## 失敗行為

不良匯入必須封閉失敗。

- 無效 URL 格式：顯示行內驗證錯誤，不擷取。
- 不支援的主機或路徑形狀：顯示行內驗證錯誤，不擷取。
- 網路失敗、非 OK 回應或格式錯誤的 JSON：顯示行內錯誤，保持目前儲存的承載內容不變。
- Schema 失敗或缺少亮色/暗色區塊：顯示行內錯誤，保持目前儲存的承載內容不變。
- 清除動作：
  - 移除儲存的自訂承載內容
  - 移除受管理自訂 style 標籤內容
  - 如果 `custom` 作用中，將主題系列切回 `claw`
- 第一次載入時遇到無效的已儲存自訂承載內容：
  - 忽略儲存的承載內容
  - 不輸出自訂 CSS
  - 如果持久化的主題系列為 `custom`，退回 `claw`

失敗的匯入在任何時候都不應讓作用中文件套用部分自訂 CSS 變數。

## 實作中預期變更的檔案

主要檔案：

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

可能新增的 helper：

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

測試：

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL 解析與承載內容正規化的新聚焦測試

## 測試

最低實作覆蓋範圍：

- 將分享連結 URL 解析成 tweakcn 主題 id
- 將 `/themes/{id}` 和 `/r/themes/{id}` 正規化成擷取 URL
- 拒絕不支援的主機與格式錯誤的 id
- 驗證 tweakcn 承載內容形狀
- 將有效的 tweakcn 承載內容對應為正規化的 OpenClaw 亮色與暗色 token map
- 在瀏覽器本機設定中載入與儲存自訂承載內容
- 為 `light`、`dark` 和 `system` 解析 `custom`
- 沒有承載內容時停用 `Custom` 選取
- 當 `custom` 已作用中時立即套用匯入的主題
- 清除作用中的自訂主題時退回 `claw`

手動驗證目標：

- 從設定匯入已知的 tweakcn 主題
- 在 `light`、`dark` 和 `system` 之間切換
- 在 `custom` 與內建系列之間切換
- 重新載入頁面，確認匯入的自訂主題在本機持續存在

## 推出注意事項

此功能刻意保持小範圍。如果使用者稍後要求多個匯入主題、重新命名、匯出或跨裝置同步，請將其視為後續設計。不要在此實作中預先建置主題庫抽象。
