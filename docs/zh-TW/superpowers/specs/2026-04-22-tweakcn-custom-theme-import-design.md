---
x-i18n:
    generated_at: "2026-05-02T22:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Tweakcn 自訂主題匯入設計

狀態：已於 2026-04-22 在終端機核准

## 摘要

新增正好一個瀏覽器本機的自訂 Control UI 主題槽位，可從 tweakcn 分享連結匯入。現有的內建主題系列維持為 `claw`、`knot` 與 `dash`。新的 `custom` 系列會像一般 OpenClaw 主題系列一樣運作，並在匯入的 tweakcn 酬載包含亮色與暗色兩組 Token 時支援 `light`、`dark` 與 `system` 模式。

匯入的主題只會與其他 Control UI 設定一起儲存在目前的瀏覽器個人資料中。它不會寫入 Gateway 設定，也不會跨裝置或瀏覽器同步。

## 問題

Control UI 主題系統目前封閉於三個硬編碼主題系列：

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

使用者可以在內建系列與模式變體之間切換，但無法在不編輯儲存庫 CSS 的情況下帶入 tweakcn 的主題。要求的結果比一般主題系統更小：保留三個內建主題，並新增一個由使用者控制、可從 tweakcn 連結替換的匯入槽位。

## 目標

- 保持現有內建主題系列不變。
- 新增正好一個匯入的自訂槽位，而不是主題庫。
- 接受 tweakcn 分享連結或直接的 `https://tweakcn.com/r/themes/{id}` URL。
- 僅將匯入的主題持久化到瀏覽器本機儲存空間。
- 讓匯入槽位可搭配現有的 `light`、`dark` 與 `system` 模式控制項使用。
- 保持失敗行為安全：錯誤的匯入絕不會破壞作用中的 UI 主題。

## 非目標

- 不提供多主題庫或瀏覽器本機匯入清單。
- 不提供 Gateway 端持久化或跨裝置同步。
- 不提供任意 CSS 編輯器或原始主題 JSON 編輯器。
- 不從 tweakcn 自動載入遠端字型資產。
- 不嘗試支援只公開一種模式的 tweakcn 酬載。
- 除 Control UI 所需的接縫外，不進行整個儲存庫層級的主題重構。

## 使用者已做出的決策

- 保留三個內建主題。
- 新增一個由 tweakcn 驅動的匯入槽位。
- 將匯入的主題儲存在瀏覽器中，而不是 Gateway 設定。
- 為匯入槽位支援 `light`、`dark` 與 `system`。
- 以下一次匯入覆寫自訂槽位是預期行為。

## 建議方法

在 Control UI 主題模型中新增第四個主題系列 ID：`custom`。只有在存在有效的 tweakcn 匯入時，`custom` 系列才可選取。匯入的酬載會標準化為 OpenClaw 專用的自訂主題記錄，並與其他 UI 設定一起儲存在瀏覽器本機儲存空間。

執行階段中，OpenClaw 會渲染一個受管理的 `<style>` 標籤，定義已解析的自訂 CSS 變數區塊：

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

這會將自訂主題變數限制在 `custom` 系列範圍內，並避免將行內 CSS 變數洩漏到內建系列。

## 架構

### 主題模型

更新 `ui/src/ui/theme.ts`：

- 擴充 `ThemeName` 以包含 `custom`。
- 擴充 `ResolvedTheme` 以包含 `custom` 與 `custom-light`。
- 擴充 `VALID_THEME_NAMES`。
- 更新 `resolveTheme()`，讓 `custom` 映照現有系列行為：
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> 根據作業系統偏好為 `custom` 或 `custom-light`

不為 `custom` 新增舊版別名。

### 持久化模型

在 `ui/src/ui/storage.ts` 中擴充 `UiSettings` 持久化，加入一個可選的自訂主題酬載：

- `customTheme?: ImportedCustomTheme`

建議的儲存形狀：

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

- `sourceUrl` 會儲存標準化後的原始使用者輸入。
- `themeId` 是從 URL 擷取出的 tweakcn 主題 ID。
- `label` 使用存在時的 tweakcn `name` 欄位，否則使用 `Custom`。
- `light` 與 `dark` 已經是標準化的 OpenClaw Token 對應表，而不是原始 tweakcn 酬載。
- 匯入的酬載與其他瀏覽器本機設定並列，並序列化在同一份 local-storage 文件中。
- 如果儲存的自訂主題資料在載入時缺失或無效，請忽略該酬載；若持久化的系列是 `custom`，則退回到 `theme: "claw"`。

### 執行階段套用

在 Control UI 執行階段新增一個狹窄的自訂主題樣式表管理器，由靠近 `ui/src/ui/app-settings.ts` 與 `ui/src/ui/theme.ts` 的位置擁有。

職責：

- 在 `document.head` 中建立或更新一個穩定的 `<style id="openclaw-custom-theme">` 標籤。
- 只有在存在有效的自訂主題酬載時才輸出 CSS。
- 當酬載被清除時，移除樣式標籤內容。
- 將內建系列 CSS 保持在 `ui/src/styles/base.css`；不要把匯入的 Token 拼接進已簽入的樣式表。

此管理器會在設定載入、儲存、匯入或清除時執行。

### 亮色模式選擇器

實作應偏好使用 `data-theme-mode="light"` 進行跨系列亮色樣式設定，而不是特別處理 `custom-light`。如果現有選擇器固定於 `data-theme="light"`，且需要套用到每個亮色系列，請在這項工作中一併擴充它。

## 匯入 UX

更新 `ui/src/ui/views/config.ts` 的 `Appearance` 區段：

- 在 `Claw`、`Knot` 與 `Dash` 旁新增一張 `Custom` 主題卡片。
- 未匯入自訂主題時，將該卡片顯示為停用。
- 在主題網格下方新增匯入面板，包含：
  - 一個用於 tweakcn 分享連結或 `/r/themes/{id}` URL 的文字輸入
  - 一個 `Import` 按鈕
  - 當自訂酬載已存在時，提供一條 `Replace` 路徑
  - 當自訂酬載已存在時，提供一個 `Clear` 動作
- 當酬載存在時，顯示匯入的主題標籤與來源主機。
- 如果作用中主題是 `custom`，匯入替代項會立即套用。
- 如果作用中主題不是 `custom`，匯入只會儲存新的酬載，直到使用者選取 `Custom` 卡片。

`ui/src/ui/views/config-quick.ts` 中的快速設定主題選擇器，也應只在酬載存在時顯示 `Custom`。

## URL 解析與遠端擷取

瀏覽器匯入路徑接受：

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

實作應將兩種形式標準化為：

- `https://tweakcn.com/r/themes/{id}`

接著瀏覽器會直接擷取標準化後的 `/r/themes/{id}` 端點。

對外部酬載使用狹窄的結構描述驗證器。因為這是不受信任的外部邊界，偏好使用 zod 結構描述。

必要的遠端欄位：

- 最上層 `name` 為可選字串
- `cssVars.theme` 為可選物件
- `cssVars.light` 為物件
- `cssVars.dark` 為物件

如果缺少 `cssVars.light` 或 `cssVars.dark`，請拒絕匯入。這是刻意為之：已核准的產品行為是完整模式支援，而不是盡力合成缺失的一側。

## Token 對應

不要盲目鏡射 tweakcn 變數。請將有限子集標準化為 OpenClaw Token，並在輔助函式中衍生其餘部分。

### 直接匯入的 Token

來自每個 tweakcn 模式區塊：

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

存在時來自共用的 `cssVars.theme`：

- `font-sans`
- `font-mono`

如果模式區塊覆寫 `font-sans`、`font-mono` 或 `radius`，則以模式本機值為準。

### 為 OpenClaw 衍生的 Token

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

衍生規則位於純輔助函式中，以便可獨立測試。確切的色彩混合公式是實作細節，但輔助函式必須滿足兩個限制：

- 保留接近匯入主題意圖的可讀對比
- 對相同的匯入酬載產生穩定輸出

### v1 中忽略的 Token

這些 tweakcn Token 在第一版中刻意忽略：

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

這會將範圍限制在目前 Control UI 實際需要的 Token 上。

### 字型

若存在字型堆疊字串，會加以匯入，但 OpenClaw 在 v1 不會載入遠端字型資產。如果匯入的堆疊參照瀏覽器中不可用的字型，則會套用一般備援行為。

## 失敗行為

錯誤的匯入必須以封閉方式失敗。

- 無效的 URL 格式：顯示行內驗證錯誤，不進行擷取。
- 不支援的主機或路徑形狀：顯示行內驗證錯誤，不進行擷取。
- 網路失敗、非 OK 回應或格式錯誤的 JSON：顯示行內錯誤，保持目前儲存的酬載不變。
- 結構描述失敗或缺少亮色/暗色區塊：顯示行內錯誤，保持目前儲存的酬載不變。
- 清除動作：
  - 移除儲存的自訂酬載
  - 移除受管理自訂樣式標籤的內容
  - 如果 `custom` 作用中，將主題系列切回 `claw`
- 首次載入時儲存的自訂酬載無效：
  - 忽略儲存的酬載
  - 不輸出自訂 CSS
  - 如果持久化的主題系列是 `custom`，則退回到 `claw`

失敗的匯入在任何時候都不應讓作用中文件套用部分自訂 CSS 變數。

## 實作中預期變更的檔案

主要檔案：

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

可能新增的輔助函式：

- `ui/src/ui/custom-theme.ts`

測試：

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL 解析與酬載標準化的新焦點測試

## 測試

最低實作涵蓋範圍：

- 將分享連結 URL 解析為 tweakcn 主題 ID
- 將 `/themes/{id}` 與 `/r/themes/{id}` 標準化為擷取 URL
- 拒絕不支援的主機與格式錯誤的 ID
- 驗證 tweakcn 酬載形狀
- 將有效的 tweakcn 酬載對應為標準化的 OpenClaw 亮色與暗色 Token 對應表
- 在瀏覽器本機設定中載入並儲存自訂酬載
- 為 `light`、`dark` 與 `system` 解析 `custom`
- 未存在酬載時停用 `Custom` 選取
- 當 `custom` 已經作用中時立即套用匯入的主題
- 當作用中的自訂主題被清除時退回到 `claw`

手動驗證目標：

- 從設定匯入已知的 tweakcn 主題
- 在 `light`、`dark` 與 `system` 之間切換
- 在 `custom` 與內建系列之間切換
- 重新載入頁面並確認匯入的自訂主題會保留在本機

## 推出注意事項

此功能刻意保持很小。如果使用者之後要求多個匯入主題、重新命名、匯出或跨裝置同步，請將其視為後續設計。不要在這次實作中預先建置主題庫抽象。
