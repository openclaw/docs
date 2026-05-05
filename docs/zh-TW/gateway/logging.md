---
read_when:
    - 變更日誌輸出或格式
    - 偵錯 CLI 或 Gateway 輸出
summary: 日誌介面、檔案日誌、WS 日誌樣式與主控台格式設定
title: Gateway 日誌記錄
x-i18n:
    generated_at: "2026-05-05T01:46:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# 記錄

如需面向使用者的總覽（CLI + 控制 UI + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩個記錄「介面」：

- **主控台輸出**（你在終端機 / 偵錯 UI 中看到的內容）。
- **檔案記錄**（JSON 行），由 Gateway 記錄器寫入。

啟動時，Gateway 會記錄解析後的預設代理模型，以及會影響新工作階段的
模式預設值，例如：

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` 來自預設代理、模型參數或全域代理預設值；
未設定時，啟動摘要會顯示 `medium`。`fast` 來自預設代理或模型 `fastMode` 參數。

## 檔案式記錄器

- 預設輪替記錄檔位於 `/tmp/openclaw/` 下（每天一個檔案）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 主機的本地時區。
- 作用中的記錄檔會在 `logging.maxFileBytes` 時輪替（預設：100 MB），保留
  最多五個編號封存檔，並繼續寫入新的作用中檔案。
- 記錄檔路徑與層級可透過 `~/.openclaw/openclaw.json` 設定：
  - `logging.file`
  - `logging.level`

檔案格式為每行一個 JSON 物件。

控制 UI 的記錄分頁會透過 Gateway 追蹤此檔案（`logs.tail`）。
CLI 也可以執行相同操作：

```bash
openclaw logs --follow
```

**詳細模式與記錄層級**

- **檔案記錄**只由 `logging.level` 控制。
- `--verbose` 只影響**主控台詳細程度**（以及 WS 記錄樣式）；它**不會**
  提高檔案記錄層級。
- 若要在檔案記錄中擷取僅詳細模式才有的細節，請將 `logging.level` 設為 `debug` 或
  `trace`。
- Trace 記錄也包含所選熱路徑的診斷計時摘要，
  例如 Plugin 工具工廠準備。請參閱
  [/tools/plugin#slow-plugin-tool-setup](/zh-TW/tools/plugin#slow-plugin-tool-setup)。

## 主控台擷取

CLI 會擷取 `console.log/info/warn/error/debug/trace` 並將其寫入檔案記錄，
同時仍會列印到 stdout/stderr。

你可以透過以下項目獨立調整主控台詳細程度：

- `logging.consoleLevel`（預設 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 遮罩

OpenClaw 可以在記錄或逐字稿輸出離開程序前遮罩敏感權杖。
此記錄遮罩政策會套用至主控台、檔案記錄、OTLP
記錄項目與工作階段逐字稿文字接收端，因此相符的機密值會在 JSONL 行或訊息寫入磁碟前被遮罩。

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：regex 字串陣列（覆寫預設值）
  - 使用原始 regex 字串（自動 `gi`），或在需要自訂旗標時使用 `/pattern/flags`。
  - 相符項目會保留前 6 + 後 4 個字元（長度 >= 18）並遮罩，其餘則為 `***`。
  - 預設值涵蓋常見金鑰指定、CLI 旗標、JSON 欄位、bearer 標頭、PEM 區塊、常見權杖前綴，以及付款憑證欄位名稱，例如卡號、CVC/CVV、共用付款權杖與付款憑證。

部分安全邊界無論 `logging.redactSensitive` 為何都一律遮罩。
這包括控制 UI 工具呼叫事件、`sessions_history` 工具輸出、
診斷支援匯出、供應商錯誤觀察、exec 核准命令
顯示，以及 Gateway WebSocket 通訊協定記錄。這些介面仍可使用
`logging.redactPatterns` 作為額外模式，但 `redactSensitive: "off"`
不會讓它們輸出原始機密。

## Gateway WebSocket 記錄

Gateway 會以兩種模式列印 WebSocket 通訊協定記錄：

- **一般模式（無 `--verbose`）**：只列印「有意義」的 RPC 結果：
  - 錯誤（`ok=false`）
  - 緩慢呼叫（預設閾值：`>= 50ms`）
  - 剖析錯誤
- **詳細模式（`--verbose`）**：列印所有 WS 請求/回應流量。

### WS 記錄樣式

`openclaw gateway` 支援每個 Gateway 的樣式切換：

- `--ws-log auto`（預設）：一般模式為最佳化；詳細模式使用精簡輸出
- `--ws-log compact`：詳細模式時使用精簡輸出（成對的請求/回應）
- `--ws-log full`：詳細模式時使用完整逐框輸出
- `--compact`：`--ws-log compact` 的別名

範例：

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## 主控台格式化（子系統記錄）

主控台格式化工具具備 **TTY 感知**能力，並列印一致且帶前綴的行。
子系統記錄器會讓輸出保持分組且易於掃描。

行為：

- 每一行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系統色彩**（每個子系統穩定）加上層級著色
- **當輸出為 TTY 或環境看起來像豐富終端機時使用色彩**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），並遵循 `NO_COLOR`
- **縮短的子系統前綴**：移除前導 `gateway/` + `channels/`，保留最後 2 個區段（例如 `whatsapp/outbound`）
- **依子系統建立子記錄器**（自動前綴 + 結構化欄位 `{ subsystem }`）
- **`logRaw()`** 用於 QR/UX 輸出（無前綴、無格式化）
- **主控台樣式**（例如 `pretty | compact | json`）
- **主控台記錄層級**與檔案記錄層級分開（當 `logging.level` 設為 `debug`/`trace` 時，檔案會保留完整細節）
- **WhatsApp 訊息本文**會以 `debug` 記錄（使用 `--verbose` 查看）

這會在維持現有檔案記錄穩定的同時，讓互動式輸出易於掃描。

## 相關

- [記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
