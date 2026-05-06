---
read_when:
    - 變更日誌輸出或格式
    - 偵錯 CLI 或 Gateway 輸出
summary: 日誌記錄介面、檔案日誌、WS 日誌樣式與主控台格式設定
title: Gateway 日誌記錄
x-i18n:
    generated_at: "2026-05-06T17:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# 日誌

如需面向使用者的概觀（CLI + 控制 UI + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩個日誌「介面」：

- **主控台輸出**（你在終端機 / 偵錯 UI 中看到的內容）。
- **檔案日誌**（JSON 行），由 Gateway logger 寫入。

啟動時，Gateway 會記錄解析後的預設 agent 模型，以及會影響新工作階段的
模式預設值，例如：

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` 來自預設 agent、模型參數或全域 agent 預設值；
未設定時，啟動摘要會顯示 `medium`。`fast` 來自預設 agent 或模型 `fastMode` 參數。

## 檔案式 logger

- 預設輪替日誌檔位於 `/tmp/openclaw/` 下（每天一個檔案）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 主機的本機時區。
- 作用中的日誌檔會在 `logging.maxFileBytes` 時輪替（預設：100 MB），保留
  最多五個編號封存檔，並繼續寫入新的作用中檔案。
- 日誌檔路徑和層級可透過 `~/.openclaw/openclaw.json` 設定：
  - `logging.file`
  - `logging.level`

檔案格式為每行一個 JSON 物件。

對話、即時語音和受管理聊天室的程式碼路徑會使用共享檔案 logger 來記錄
有界的生命週期紀錄。這些紀錄用於營運偵錯
和 OTLP 日誌匯出；轉錄文字、音訊 payload、turn id、call id 和
provider item id 不會複製到日誌紀錄中。

控制 UI 的 Logs 分頁會透過 Gateway 追蹤此檔案（`logs.tail`）。
CLI 也可以執行相同操作：

```bash
openclaw logs --follow
```

**詳細模式與日誌層級**

- **檔案日誌**完全由 `logging.level` 控制。
- `--verbose` 只影響**主控台詳細程度**（以及 WS 日誌樣式）；它**不會**
  提高檔案日誌層級。
- 若要在檔案日誌中擷取只有詳細模式才有的細節，請將 `logging.level` 設為 `debug` 或
  `trace`。
- Trace 日誌也包含所選熱門路徑的診斷計時摘要，
  例如 Plugin 工具 factory 準備。請參閱
  [/tools/plugin#slow-plugin-tool-setup](/zh-TW/tools/plugin#slow-plugin-tool-setup)。

## 主控台擷取

CLI 會擷取 `console.log/info/warn/error/debug/trace` 並寫入檔案日誌，
同時仍列印到 stdout/stderr。

你可以透過以下項目獨立調整主控台詳細程度：

- `logging.consoleLevel`（預設 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 遮罩

OpenClaw 可以在日誌或轉錄輸出離開
程序前遮罩敏感 token。此日誌遮罩政策會套用在主控台、檔案日誌、OTLP
日誌紀錄和工作階段轉錄文字 sink，因此相符的秘密值會在
JSONL 行或訊息寫入磁碟前被遮罩。

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：regex 字串陣列（覆寫預設值）
  - 使用原始 regex 字串（自動 `gi`），或在需要自訂 flags 時使用 `/pattern/flags`。
  - 相符內容會保留前 6 + 後 4 個字元來遮罩（長度 >= 18），否則為 `***`。
  - 預設涵蓋常見的金鑰指派、CLI flags、JSON 欄位、bearer headers、PEM blocks、常見 token 前綴，以及付款憑證欄位名稱，例如卡號、CVC/CVV、shared payment token 和 payment credential。

某些安全邊界一律會遮罩，不受 `logging.redactSensitive` 影響。
這包含控制 UI 的工具呼叫事件、`sessions_history` 工具輸出、
診斷支援匯出、provider 錯誤觀察、exec approval command
顯示，以及 Gateway WebSocket protocol logs。這些介面仍可使用
`logging.redactPatterns` 作為額外 patterns，但 `redactSensitive: "off"`
不會讓它們輸出原始秘密。

## Gateway WebSocket 日誌

Gateway 會以兩種模式列印 WebSocket protocol logs：

- **一般模式（沒有 `--verbose`）**：只會列印「有趣」的 RPC 結果：
  - 錯誤（`ok=false`）
  - 慢速呼叫（預設門檻：`>= 50ms`）
  - 解析錯誤
- **詳細模式（`--verbose`）**：列印所有 WS request/response traffic。

### WS 日誌樣式

`openclaw gateway` 支援每個 Gateway 的樣式切換：

- `--ws-log auto`（預設）：一般模式會最佳化；詳細模式使用 compact output
- `--ws-log compact`：詳細模式時使用 compact output（配對的 request/response）
- `--ws-log full`：詳細模式時使用完整的 per-frame output
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

## 主控台格式化（子系統日誌）

主控台 formatter 會**感知 TTY**，並列印一致且帶有前綴的行。
子系統 loggers 會讓輸出保持分組且易於掃描。

行為：

- 每一行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系統顏色**（每個子系統穩定）加上層級著色
- **當輸出是 TTY 或環境看起來像豐富終端機時使用顏色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），並遵守 `NO_COLOR`
- **縮短的子系統前綴**：移除開頭的 `gateway/` + `channels/`，保留最後 2 個區段（例如 `whatsapp/outbound`）
- **依子系統的子 loggers**（自動前綴 + 結構化欄位 `{ subsystem }`）
- **`logRaw()`** 用於 QR/UX 輸出（無前綴、無格式化）
- **主控台樣式**（例如 `pretty | compact | json`）
- **主控台日誌層級**與檔案日誌層級分開（當 `logging.level` 設為 `debug`/`trace` 時，檔案保留完整細節）
- **WhatsApp 訊息本文**會以 `debug` 記錄（使用 `--verbose` 查看）

這會讓既有檔案日誌保持穩定，同時使互動式輸出易於掃描。

## 相關

- [日誌](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
