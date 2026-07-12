---
read_when:
    - 你使用 `openclaw browser`，並想查看常見工作的範例
    - 你想透過節點主機控制在另一台機器上執行的瀏覽器
    - 你想透過 Chrome MCP 連線至本機已登入的 Chrome 瀏覽器
summary: '`openclaw browser` 的命令列介面參考（生命週期、設定檔、分頁、動作、狀態與偵錯）'
title: 瀏覽器
x-i18n:
    generated_at: "2026-07-12T14:21:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

管理 OpenClaw 的瀏覽器控制介面並執行瀏覽器動作：生命週期、設定檔、分頁、快照、螢幕擷取畫面、導覽、輸入、狀態模擬及偵錯。

相關內容：[瀏覽器工具](/zh-TW/tools/browser)

## 常用旗標

- `--url <gatewayWsUrl>`：閘道 WebSocket URL（預設使用設定值）。
- `--token <token>`：閘道權杖（如有需要）。
- `--timeout <ms>`：要求逾時時間，單位為毫秒（預設：`30000`）。
- `--expect-final`：等待閘道的最終回應。
- `--browser-profile <name>`：選擇瀏覽器設定檔（預設：`openclaw`，或 `browser.defaultProfile`）。
- `--json`：機器可讀的輸出（若支援）。這是瀏覽器層級的選項，因此
  請將它放在子命令之前以使用明確的形式，例如
  `openclaw browser --json status`。若所選的子命令本身未
  定義 `--json`，也可將它放在尾端，例如
  `openclaw browser status --json`。

## 快速開始（本機）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

代理程式可以使用 `browser({ action: "doctor" })` 執行相同的就緒狀態檢查。

## 快速疑難排解

若 `start` 失敗並顯示 `not reachable after start`，請先排解 CDP 就緒狀態問題。若 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失敗，表示瀏覽器控制平面運作正常，而失敗通常是導覽 SSRF 政策封鎖所致。

最小操作順序：

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細指引：[瀏覽器疑難排解](/zh-TW/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## 生命週期

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep` 會新增即時快照探查：適用於基本 CDP 就緒狀態正常，但你想確認目前分頁可供檢查時。
- 對於執行中的本機受管理設定檔，`status` 和 `doctor` 會回報來自 Chrome 的快取
  圖形診斷資訊：硬體／軟體分類、轉譯器、
  後端、裝置／驅動程式、功能與停用狀態詳細資料，以及硬體加速
  視訊功能。`openclaw browser --json status` 會傳回完整的結構化酬載。
  被動狀態檢查絕不會只為收集這些資訊而啟動 Chrome。
- `stop` 會關閉作用中的控制工作階段，並清除暫時的模擬覆寫，即使是 OpenClaw 並未自行啟動瀏覽器程序的 `attachOnly` 和遠端 CDP 設定檔亦然。對於本機受管理設定檔，`stop` 也會停止所啟動的瀏覽器程序。
- `start --headless` 僅適用於該次啟動要求，且僅在 OpenClaw 啟動本機受管理瀏覽器時生效。它不會改寫 `browser.headless` 或設定檔組態，對已在執行的瀏覽器也不會產生任何作用。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，本機受管理設定檔會自動以無頭模式執行，除非 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false` 或 `browser.profiles.<name>.headless=false` 明確要求顯示瀏覽器。

## 若找不到命令

若 `openclaw browser` 是未知命令，請檢查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。若存在 `plugins.allow`，除非組態中已有根層級的 `browser` 區塊，否則請明確列出隨附的瀏覽器外掛：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層級 `browser` 區塊（例如 `browser.enabled=true` 或 `browser.profiles.<name>`）也會在限制性的外掛允許清單下啟用隨附的瀏覽器外掛。

相關內容：[瀏覽器工具](/zh-TW/tools/browser#missing-browser-command-or-tool)

## 設定檔

設定檔是具名的瀏覽器路由組態：

- `openclaw`（預設）：啟動或連接專用的 OpenClaw 受管理 Chrome 執行個體（隔離的使用者資料目錄）。
- `user`：透過 Chrome DevTools MCP 控制你現有且已登入的 Chrome 工作階段。
- 自訂 CDP 設定檔：指向本機或遠端 CDP 端點。

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

在任何子命令上使用 `--browser-profile <name>` 即可指定設定檔，例如 `openclaw browser --browser-profile work tabs`。

在 macOS 上，`system-profiles` 會列出主機上可用的實際 Chrome、Brave、Edge 或 Chromium 設定檔。`import-profile` 會在一次 macOS Keychain／Touch ID 同意提示後解密其 Cookie，並將它們注入新的 OpenClaw 受管理設定檔。它只會匯入 Cookie；本機儲存空間和 IndexedDB 不受影響。部分 Google 工作階段使用裝置綁定工作階段認證資訊（DBSC），匯入後仍可能需要重新驗證身分。

當 macOS 應用程式使用本機閘道時，它可以提供一次此匯入選項，並將隔離的已匯入設定檔設為代理程式瀏覽的預設值。匯入一律需要明確點選；成功匯入或關閉提示後，將不再自動顯示後續提示，而 **Settings → General → Browser login** 仍可用於重新匯入。

系統設定檔匯入預設為啟用。設定 `browser.allowSystemProfileImport=false` 可停用命令列介面和代理程式觸發的匯入。匯入僅限主機本機執行，無法透過瀏覽器節點 Proxy 執行。

## 分頁

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` 會先傳回 `suggestedTargetId`，接著是穩定的 `tabId`（例如 `t1`）、選用標籤，以及原始 `targetId`。請將 `suggestedTargetId` 傳回 `focus`、`close`、快照及動作。可使用 `open --label`、`tab new --label` 或 `tab label` 指派標籤；標籤、分頁 ID、原始目標 ID，以及唯一的目標 ID 前綴皆可使用。為了相容性，要求欄位仍命名為 `targetId`，但可接受上述任何分頁參照。

原始目標 ID 是不穩定的診斷控制代碼，不適合作為持久的代理程式記憶：當 Chromium 在導覽或提交表單期間取代底層原始目標時，若 OpenClaw 能確認配對，便會將穩定的 `tabId`／標籤保留在替代分頁上。建議使用 `suggestedTargetId`。

## 快照／螢幕擷取畫面／動作

快照：

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

螢幕擷取畫面：

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` 僅供頁面擷取使用；不可與 `--ref` 或 `--element` 合併使用。
- `existing-session`／`user` 設定檔支援頁面螢幕擷取畫面，以及根據快照輸出使用 `--ref` 擷取畫面，但不支援 CSS `--element` 螢幕擷取畫面。
- `--labels` 會在螢幕擷取畫面上疊加目前的快照參照。在由 Playwright 支援的設定檔中，它可搭配 `--full-page`（整頁疊加）、`--ref`（依 ARIA 參照裁切元素並疊加）及 `--element`（依 CSS 選取器裁切元素並疊加）使用；在元素裁切模式中，標籤會相對於元素投影。回應也包含 `annotations` 陣列（空白時省略），其中含有各參照的邊界方塊：`ref`、`number`、`role`、選用的 `name`，以及擷取影像座標空間（檢視區／整頁／元素相對）中的 `box: {x, y, width, height}`。
  `existing-session` 設定檔會在頁面螢幕擷取畫面上呈現 chrome-mcp 疊加層，但不會使用 Playwright 投影輔助程式，也不包含 `annotations`；此處不支援 CSS `--element` 螢幕擷取畫面。若沒有 Playwright 或 chrome-mcp，則無法使用帶標籤的螢幕擷取畫面。
- `snapshot --urls` 會將找到的連結目的地附加至 AI 快照，讓代理程式可選擇直接導覽目標，而無須僅根據連結文字猜測。

導覽／點選／輸入（以參照為基礎的 UI 自動化）：

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` 接受函式原始碼、運算式或陳述式主體。陳述式主體會包裝成非同步函式，因此請使用 `return` 傳回你要的值。若頁面端函式可能需要超過預設求值逾時時間，請使用 `--timeout-ms`。`browser.evaluateEnabled=false`（預設：`true`）會停用 `evaluate` 和 `wait --fn`。

當 OpenClaw 能確認動作所觸發頁面替換後的替代分頁時，動作回應會傳回目前的原始 `targetId`。對於長時間執行的工作流程，指令碼仍應儲存並傳遞 `suggestedTargetId`／標籤。

檔案與對話方塊輔助工具：

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

受管理的 Chrome 設定檔會將一般由點選觸發的下載儲存至 OpenClaw 下載目錄（預設為 `/tmp/openclaw/downloads`，或使用已設定的暫存根目錄）。當代理程式需要等待特定檔案並傳回其路徑時，請使用 `waitfordownload` 或 `download`；這些明確的等待器會取得下一個下載項目的控制權。上傳可接受來自 OpenClaw 暫存上傳根目錄及 OpenClaw 管理的傳入媒體檔案，包括 `media://inbound/<id>` 和沙箱相對的 `media/inbound/<id>` 參照。不允許巢狀媒體參照、路徑遊走及任意本機路徑。

當動作開啟強制回應對話方塊時，動作回應會傳回 `blockedByDialog` 及 `browserState.dialogs.pending`；請傳遞 `--dialog-id` 直接回應該對話方塊。在 OpenClaw 外部處理的對話方塊會顯示於 `browserState.dialogs.recent`。

## 狀態與儲存空間

檢視區與模擬：

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie 與儲存空間：

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## 偵錯

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## 透過 MCP 使用現有的 Chrome

使用內建的 `user` 設定檔，或建立你自己的 `existing-session` 設定檔：

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

預設的 existing-session 路徑是僅限主機使用的 Chrome MCP 自動連線。如果瀏覽器已透過 DevTools 端點執行，請傳入 `--cdp-url`，讓 Chrome MCP 改為連接該端點。若是 Docker、Browserless，或其他不需要 Chrome MCP 語意的遠端設定，請改用 CDP 設定檔。

目前 existing-session 的限制：

- 快照驅動的動作使用 ref，而非 CSS 選擇器。
- 當呼叫端省略 `timeoutMs` 時，`browser.actionTimeoutMs` 預設會將支援的 `act` 請求逾時設為 60000 ms；每次呼叫的 `timeoutMs` 仍具有優先權。
- `click` 僅支援按滑鼠左鍵。
- `type` 不支援 `slowly=true`。
- `press` 不支援 `delayMs`。
- `hover`、`scrollintoview`、`drag`、`select` 和 `fill` 會拒絕每次呼叫的逾時覆寫；`evaluate` 接受 `--timeout-ms`。
- `select` 僅支援一個值。
- 不支援 `wait --load networkidle`（受管理及原始／遠端 CDP 設定檔可使用）。
- 檔案上傳需要 `--ref` / `--input-ref`，不支援 CSS `--element`，且一次只能上傳一個檔案。
- 對話方塊掛鉤不支援 `--timeout`。
- 螢幕截圖支援頁面擷取和 `--ref`，但不支援 CSS `--element`。
- `responsebody`、下載攔截、PDF 匯出和批次動作仍需要受管理的瀏覽器或原始 CDP 設定檔。

## 遠端瀏覽器控制（節點主機代理）

如果閘道與瀏覽器在不同機器上執行，請在安裝 Chrome/Brave/Edge/Chromium 的機器上執行**節點主機**。閘道會將瀏覽器動作代理至該節點；不需要另外設置瀏覽器控制伺服器。

使用 `gateway.nodes.browser.mode` 控制自動路由；若連接了多個節點，則使用 `gateway.nodes.browser.node` 固定至特定節點。

安全性與遠端設定：[瀏覽器工具](/zh-TW/tools/browser)、[遠端存取](/zh-TW/gateway/remote)、[Tailscale](/zh-TW/gateway/tailscale)、[安全性](/zh-TW/gateway/security)

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [瀏覽器](/zh-TW/tools/browser)
