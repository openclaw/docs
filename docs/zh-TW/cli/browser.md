---
read_when:
    - 你使用 `openclaw browser`，並想要常見任務的範例
    - 你想透過 Node 主機控制在另一台機器上執行的瀏覽器
    - 你想透過 Chrome MCP 連接到本機已登入的 Chrome
summary: '`openclaw browser` 的 CLI 參考（生命週期、設定檔、分頁、動作、狀態和偵錯）'
title: 瀏覽器
x-i18n:
    generated_at: "2026-04-30T02:51:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

管理 OpenClaw 的瀏覽器控制介面，並執行瀏覽器動作（生命週期、設定檔、分頁、快照、螢幕截圖、導覽、輸入、狀態模擬與除錯）。

相關：

- 瀏覽器工具 + API：[瀏覽器工具](/zh-TW/tools/browser)

## 常用旗標

- `--url <gatewayWsUrl>`：Gateway WebSocket URL（預設為設定值）。
- `--token <token>`：Gateway 權杖（如果需要）。
- `--timeout <ms>`：請求逾時（ms）。
- `--expect-final`：等待最終 Gateway 回應。
- `--browser-profile <name>`：選擇瀏覽器設定檔（預設來自設定）。
- `--json`：機器可讀輸出（支援時）。

## 快速開始（本機）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

代理可以使用 `browser({ action: "doctor" })` 執行相同的就緒檢查。

## 快速疑難排解

如果 `start` 失敗並出現 `not reachable after start`，請先排查 CDP 就緒狀態。如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失敗，表示瀏覽器控制平面正常，失敗通常是導覽 SSRF 政策造成的。

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

注意：

- `doctor --deep` 會新增即時快照探測。當基本 CDP 就緒狀態為綠燈，但你想證明目前分頁可被檢查時，這很有用。
- 對於 `attachOnly` 和遠端 CDP 設定檔，即使 OpenClaw 並未自行啟動瀏覽器程序，`openclaw browser stop` 也會關閉作用中的控制工作階段，並清除暫時的模擬覆寫。
- 對於本機受管理設定檔，`openclaw browser stop` 會停止產生的瀏覽器程序。
- `openclaw browser start --headless` 只套用於該次啟動請求，且只在 OpenClaw 啟動本機受管理瀏覽器時套用。它不會重寫 `browser.headless` 或設定檔設定，對已在執行的瀏覽器也不會有任何作用。
- 在沒有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主機上，除非 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false` 或 `browser.profiles.<name>.headless=false` 明確要求可見瀏覽器，否則本機受管理設定檔會自動以無頭模式執行。

## 如果命令不存在

如果 `openclaw browser` 是未知命令，請檢查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。

當 `plugins.allow` 存在時，除非設定已經有根層級 `browser` 區塊，否則請明確列出內建瀏覽器 Plugin：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

明確的根層級 `browser` 區塊，例如 `browser.enabled=true` 或 `browser.profiles.<name>`，也會在限制性的 Plugin 允許清單下啟用內建瀏覽器 Plugin。

相關：[瀏覽器工具](/zh-TW/tools/browser#missing-browser-command-or-tool)

## 設定檔

設定檔是具名的瀏覽器路由設定。實務上：

- `openclaw`：啟動或附加到專用的 OpenClaw 受管理 Chrome 執行個體（隔離的使用者資料目錄）。
- `user`：透過 Chrome DevTools MCP 控制你現有的已登入 Chrome 工作階段。
- 自訂 CDP 設定檔：指向本機或遠端 CDP 端點。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

使用特定設定檔：

```bash
openclaw browser --browser-profile work tabs
```

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

`tabs` 會先回傳 `suggestedTargetId`，接著是穩定的 `tabId`（例如 `t1`）、選用標籤，以及原始 `targetId`。代理應將 `suggestedTargetId` 傳回 `focus`、`close`、快照和動作。你可以使用 `open --label`、`tab new --label` 或 `tab label` 指派標籤；標籤、分頁 ID、原始目標 ID，以及唯一的目標 ID 前綴都可接受。當 Chromium 在導覽或表單送出期間替換底層原始目標時，如果 OpenClaw 能證明匹配，它會將穩定的 `tabId`/標籤保留在替換後的分頁上。原始目標 ID 仍然易變；請優先使用 `suggestedTargetId`。

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

注意：

- `--full-page` 僅適用於頁面擷取；不能與 `--ref` 或 `--element` 搭配使用。
- `existing-session` / `user` 設定檔支援頁面螢幕截圖，以及來自快照輸出的 `--ref` 螢幕截圖，但不支援 CSS `--element` 螢幕截圖。
- `--labels` 會在螢幕截圖上疊加目前快照參照。
- `snapshot --urls` 會將探索到的連結目的地附加到 AI 快照，讓代理可以選擇直接導覽目標，而不是只根據連結文字猜測。

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
```

當 OpenClaw 能證明替換分頁時，動作回應會在動作觸發的頁面替換後回傳目前的原始 `targetId`。腳本仍應儲存並傳遞 `suggestedTargetId`/標籤，以支援長時間執行的工作流程。

檔案 + 對話框輔助工具：

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

受管理 Chrome 設定檔會將一般點擊觸發的下載儲存到 OpenClaw 下載目錄（預設為 `/tmp/openclaw/downloads`，或設定的暫存根目錄）。當代理需要等待特定檔案並回傳其路徑時，請使用 `waitfordownload` 或 `download`；這些明確的等待器會擁有下一個下載。

## 狀態與儲存

視窗大小 + 模擬：

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
openclaw browser --browser-profile chrome-live tabs
```

此路徑僅適用於主機。對於 Docker、無頭伺服器、Browserless 或其他遠端設定，請改用 CDP 設定檔。

目前 existing-session 限制：

- 由快照驅動的動作使用參照，而不是 CSS 選擇器
- 當呼叫端省略 `timeoutMs` 時，`browser.actionTimeoutMs` 會將支援的 `act` 請求預設為 60000 ms；每次呼叫的 `timeoutMs` 仍會優先。
- `click` 僅限左鍵點擊
- `type` 不支援 `slowly=true`
- `press` 不支援 `delayMs`
- `hover`、`scrollintoview`、`drag`、`select`、`fill` 和 `evaluate` 會拒絕每次呼叫的逾時覆寫
- `select` 僅支援一個值
- 不支援 `wait --load networkidle`
- 檔案上傳需要 `--ref` / `--input-ref`，不支援 CSS `--element`，且目前一次支援一個檔案
- 對話框掛鉤不支援 `--timeout`
- 螢幕截圖支援頁面擷取和 `--ref`，但不支援 CSS `--element`
- `responsebody`、下載攔截、PDF 匯出和批次動作仍需要受管理瀏覽器或原始 CDP 設定檔

## 遠端瀏覽器控制（Node 主機代理）

如果 Gateway 與瀏覽器在不同機器上執行，請在有 Chrome/Brave/Edge/Chromium 的機器上執行 **Node 主機**。Gateway 會將瀏覽器動作代理到該 Node（不需要獨立的瀏覽器控制伺服器）。

使用 `gateway.nodes.browser.mode` 控制自動路由，並在有多個 Node 連線時使用 `gateway.nodes.browser.node` 固定到特定 Node。

安全性 + 遠端設定：[瀏覽器工具](/zh-TW/tools/browser)、[遠端存取](/zh-TW/gateway/remote)、[Tailscale](/zh-TW/gateway/tailscale)、[安全性](/zh-TW/gateway/security)

## 相關

- [CLI 參考](/zh-TW/cli)
- [瀏覽器](/zh-TW/tools/browser)
