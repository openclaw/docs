---
read_when:
    - 你使用 `openclaw browser`，並想要常見工作的範例
    - 你想透過節點主機控制在另一台機器上執行的瀏覽器
    - 你想透過 Chrome MCP 連接到本機已登入的 Chrome
summary: '`openclaw browser` 的命令列介面參考（生命週期、設定檔、分頁、動作、狀態與偵錯）'
title: 瀏覽器
x-i18n:
    generated_at: "2026-07-05T11:10:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82070c47ee06bf8dc5e3463ea17d2ef4b9c6adcc9a1e830d745986e7162fd6b1
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

管理 OpenClaw 的瀏覽器控制介面並執行瀏覽器動作：生命週期、設定檔、分頁、快照、螢幕截圖、導覽、輸入、狀態模擬與除錯。

相關：[瀏覽器工具](/zh-TW/tools/browser)

## 常用旗標

- `--url <gatewayWsUrl>`：閘道 WebSocket URL（預設使用設定）。
- `--token <token>`：閘道權杖（如有需要）。
- `--timeout <ms>`：請求逾時，單位為 ms（預設：`30000`）。
- `--expect-final`：等待最終閘道回應。
- `--browser-profile <name>`：選擇瀏覽器設定檔（預設：`openclaw`，或 `browser.defaultProfile`）。
- `--json`：機器可讀輸出（在支援處）。

## 快速開始（本機）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

代理程式可以使用 `browser({ action: "doctor" })` 執行相同的就緒檢查。

## 快速疑難排解

如果 `start` 失敗並顯示 `not reachable after start`，請先排查 CDP 就緒狀態。如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失敗，表示瀏覽器控制平面是正常的，而失敗通常是導覽 SSRF 政策封鎖。

最小序列：

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

- `doctor --deep` 會加入即時快照探測：當基本 CDP 就緒狀態為綠燈，但你想證明目前分頁可被檢查時很有用。
- `stop` 會關閉作用中的控制工作階段，並清除暫時的模擬覆寫；即使是 `attachOnly` 和遠端 CDP 設定檔，OpenClaw 未自行啟動瀏覽器程序時也一樣。對於本機受管理設定檔，`stop` 也會停止產生的瀏覽器程序。
- `start --headless` 只套用於該次啟動請求，且只在 OpenClaw 啟動本機受管理瀏覽器時生效。它不會改寫 `browser.headless` 或設定檔設定，對已在執行的瀏覽器也不會有作用。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，本機受管理設定檔會自動以無頭模式執行，除非 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false` 或 `browser.profiles.<name>.headless=false` 明確要求可見瀏覽器。

## 如果缺少命令

如果 `openclaw browser` 是未知命令，請檢查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。當存在 `plugins.allow` 時，除非設定已經有根層級 `browser` 區塊，否則請明確列出內建瀏覽器外掛：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層級 `browser` 區塊（例如 `browser.enabled=true` 或 `browser.profiles.<name>`）也會在限制性外掛允許清單下啟用內建瀏覽器外掛。

相關：[瀏覽器工具](/zh-TW/tools/browser#missing-browser-command-or-tool)

## 設定檔

設定檔是具名的瀏覽器路由設定：

- `openclaw`（預設）：啟動或附加到專用的 OpenClaw 管理 Chrome 執行個體（隔離的使用者資料目錄）。
- `user`：透過 Chrome DevTools MCP 控制你現有已登入的 Chrome 工作階段。
- 自訂 CDP 設定檔：指向本機或遠端 CDP 端點。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

在任何子命令上使用 `--browser-profile <name>` 指定設定檔，例如 `openclaw browser --browser-profile work tabs`。

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

`tabs` 會先回傳 `suggestedTargetId`，接著是穩定的 `tabId`（例如 `t1`）、選用標籤，以及原始 `targetId`。將 `suggestedTargetId` 傳回 `focus`、`close`、快照與動作。使用 `open --label`、`tab new --label` 或 `tab label` 指派標籤；標籤、分頁 ID、原始目標 ID，以及唯一的目標 ID 前綴都可接受。為了相容性，請求欄位仍命名為 `targetId`，但它接受上述任一分頁參照。

原始目標 ID 是易變的診斷控制代碼，不是持久的代理程式記憶：當 Chromium 在導覽或表單提交期間替換底層原始目標時，只要 OpenClaw 能證明相符，就會將穩定的 `tabId`/標籤附加到替換後的分頁。請優先使用 `suggestedTargetId`。

## 快照 / 螢幕截圖 / 動作

快照：

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

螢幕截圖：

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` 只適用於頁面擷取；不可與 `--ref` 或 `--element` 搭配使用。
- `existing-session` / `user` 設定檔支援頁面螢幕截圖，以及來自快照輸出的 `--ref` 螢幕截圖，但不支援 CSS `--element` 螢幕截圖。
- `--labels` 會在螢幕截圖上疊加目前的快照參照。在 Playwright 支援的設定檔上，它可搭配 `--full-page`（完整頁面疊加）、`--ref`（依 ARIA 參照的元素裁切疊加）和 `--element`（依 CSS 選擇器的元素裁切疊加）使用；在元素裁切模式中，標籤會相對於該元素投影。回應也會包含 `annotations` 陣列（空值時省略），內含每個參照的邊界框：`ref`、`number`、`role`、選用的 `name`，以及擷取影像座標空間（視窗 / 完整頁面 / 元素相對）中的 `box: {x, y, width, height}`。
  `existing-session` 設定檔會在頁面螢幕截圖上呈現 chrome-mcp 疊加，但不使用 Playwright 投影輔助工具，也不包含 `annotations`；該處不支援 CSS `--element` 螢幕截圖。沒有 Playwright 或 chrome-mcp 時，標記螢幕截圖不可用。
- `snapshot --urls` 會將發現的連結目的地附加到 AI 快照，讓代理程式可選擇直接導覽目標，而不必只根據連結文字猜測。

導覽/點擊/輸入（以參照為基礎的 UI 自動化）：

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

`evaluate --fn` 接受函式原始碼、運算式或陳述式主體。陳述式主體會包裝為 async 函式，因此請使用 `return` 回傳你想要的值。當頁面端函式可能需要比預設 evaluate 逾時更長的時間時，請使用 `--timeout-ms`。`browser.evaluateEnabled=false`（預設：`true`）會停用 `evaluate` 和 `wait --fn`。

當 OpenClaw 能證明替換分頁時，動作回應會在動作觸發頁面替換後回傳目前的原始 `targetId`。指令碼仍應儲存並傳遞 `suggestedTargetId`/標籤，以用於長期工作流程。

檔案 + 對話方塊輔助工具：

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

受管理的 Chrome 設定檔會將一般點擊觸發的下載儲存到 OpenClaw 下載目錄（預設為 `/tmp/openclaw/downloads`，或已設定的暫存根目錄）。當代理程式需要等待特定檔案並回傳其路徑時，請使用 `waitfordownload` 或 `download`；這些明確的等待器會擁有下一個下載。上傳接受來自 OpenClaw 暫存上傳根目錄與 OpenClaw 管理傳入媒體的檔案，包括 `media://inbound/<id>` 和沙箱相對 `media/inbound/<id>` 參照。巢狀媒體參照、路徑遍歷和任意本機路徑都會被拒絕。

當動作開啟模態對話方塊時，動作回應會回傳含有 `browserState.dialogs.pending` 的 `blockedByDialog`；傳入 `--dialog-id` 可直接回應。OpenClaw 外部處理的對話方塊會出現在 `browserState.dialogs.recent` 下。

## 狀態與儲存

視窗 + 模擬：

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

Cookie + 儲存：

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## 除錯

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

## 透過 MCP 使用現有 Chrome

使用內建的 `user` 設定檔，或建立你自己的 `existing-session` 設定檔：

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

預設的現有工作階段路徑是僅限主機的 Chrome MCP 自動連線。如果瀏覽器已經在執行並帶有 DevTools 端點，請傳入 `--cdp-url`，讓 Chrome MCP 改為附加到該端點。對於 Docker、Browserless 或其他不需要 Chrome MCP 語意的遠端設定，請改用 CDP 設定檔。

目前的現有工作階段限制：

- 由快照驅動的動作使用參照，而不是 CSS 選擇器。
- 當呼叫者省略 `timeoutMs` 時，`browser.actionTimeoutMs` 會將支援的 `act` 請求預設為 60000 ms；每次呼叫的 `timeoutMs` 仍會優先。
- `click` 僅支援左鍵點擊。
- `type` 不支援 `slowly=true`。
- `press` 不支援 `delayMs`。
- `hover`、`scrollintoview`、`drag`、`select`、`fill` 和 `evaluate` 會拒絕每次呼叫的逾時覆寫。
- `select` 僅支援一個值。
- 不支援 `wait --load networkidle`（在受管理和原始/遠端 CDP 設定檔上可運作）。
- 檔案上傳需要 `--ref` / `--input-ref`，不支援 CSS `--element`，且一次只支援一個檔案。
- 對話方塊掛鉤不支援 `--timeout`。
- 螢幕截圖支援頁面擷取和 `--ref`，但不支援 CSS `--element`。
- `responsebody`、下載攔截、PDF 匯出和批次動作仍需要受管理瀏覽器或原始 CDP 設定檔。

## 遠端瀏覽器控制（節點主機代理）

如果閘道和瀏覽器執行在不同機器上，請在有 Chrome/Brave/Edge/Chromium 的機器上執行一個**節點主機**。閘道會將瀏覽器操作代理到該節點；不需要另外的瀏覽器控制伺服器。

使用 `gateway.nodes.browser.mode` 控制自動路由，並在連接多個節點時使用 `gateway.nodes.browser.node` 固定到特定節點。

安全性 + 遠端設定：[瀏覽器工具](/zh-TW/tools/browser)、[遠端存取](/zh-TW/gateway/remote)、[Tailscale](/zh-TW/gateway/tailscale)、[安全性](/zh-TW/gateway/security)

## 相關

- [命令列介面參考](/zh-TW/cli)
- [瀏覽器](/zh-TW/tools/browser)
