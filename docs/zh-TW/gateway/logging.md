---
read_when:
    - 變更記錄輸出或格式
    - 偵錯命令列介面或閘道輸出
summary: 記錄介面、檔案記錄、WS 記錄樣式與主控台格式化
title: 閘道記錄
x-i18n:
    generated_at: "2026-06-27T19:19:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# 記錄

如需面向使用者的概覽（命令列介面 + Control UI + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩個記錄「表面」：

- **主控台輸出**（你在終端機 / Debug UI 中看到的內容）。
- **檔案記錄**（JSON 行），由閘道記錄器寫入。

啟動時，閘道會記錄解析後的預設代理模型，以及會影響新工作階段的
模式預設值，例如：

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` 來自預設代理、模型參數或全域代理預設值；
未設定時，啟動摘要會顯示 `medium`。`fast` 來自預設代理或模型 `fastMode` 參數。

## 檔案型記錄器

- 預設滾動記錄檔位於 `/tmp/openclaw/`（每天一個檔案）：`openclaw-YYYY-MM-DD.log`
  - 日期使用閘道主機的本地時區。
- 作用中的記錄檔會在 `logging.maxFileBytes`（預設：100 MB）時輪替，
  最多保留五個編號封存檔，並繼續寫入新的作用中檔案。
- 記錄檔路徑和層級可透過 `~/.openclaw/openclaw.json` 設定：
  - `logging.file`
  - `logging.level`

檔案格式是每行一個 JSON 物件。

通話、即時語音和受管理房間的程式碼路徑，會使用共用檔案記錄器來記錄
有界的生命週期紀錄。這些紀錄用於營運除錯
和 OTLP 記錄匯出；逐字稿文字、音訊負載、回合 ID、通話 ID，以及
提供者項目 ID 不會被複製到記錄紀錄中。

Control UI 的記錄分頁會透過閘道追蹤這個檔案（`logs.tail`）。
命令列介面也可以執行相同操作：

```bash
openclaw logs --follow
```

**詳細輸出與記錄層級**

- **檔案記錄**完全由 `logging.level` 控制。
- `--verbose` 只影響**主控台詳細程度**（以及 WS 記錄樣式）；它**不會**
  提高檔案記錄層級。
- 若要在檔案記錄中擷取僅詳細模式才有的細節，請將 `logging.level` 設為 `debug` 或
  `trace`。
- Trace 記錄也包含特定熱路徑的診斷計時摘要，
  例如外掛工具工廠準備。請參閱
  [/tools/plugin#slow-plugin-tool-setup](/zh-TW/tools/plugin#slow-plugin-tool-setup)。

## 主控台擷取

命令列介面會擷取 `console.log/info/warn/error/debug/trace` 並寫入檔案記錄，
同時仍輸出到 stdout/stderr。

你可以透過下列設定獨立調整主控台詳細程度：

- `logging.consoleLevel`（預設 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 遮蔽

OpenClaw 可在記錄或逐字稿輸出離開
程序之前遮蔽敏感權杖。這項記錄遮蔽政策會套用於主控台、檔案記錄、OTLP
記錄紀錄，以及工作階段逐字稿文字接收端，因此相符的秘密值會在
JSONL 行或訊息寫入磁碟前被遮蔽。

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：regex 字串陣列（覆寫預設值）
  - 使用原始 regex 字串（自動 `gi`），或在需要自訂 flags 時使用 `/pattern/flags`。
  - 相符項會保留前 6 + 後 4 個字元（長度 >= 18）進行遮蔽，否則使用 `***`。
  - 預設值涵蓋常見金鑰指派、命令列介面 flags、JSON 欄位、bearer 標頭、PEM 區塊、常見權杖前綴，以及付款憑證欄位名稱，例如卡號、CVC/CVV、共用付款權杖和付款憑證。

某些安全邊界不論 `logging.redactSensitive` 為何都一律遮蔽。
這包括 Control UI 工具呼叫事件、`sessions_history` 工具輸出、
診斷支援匯出、提供者錯誤觀察、exec 核准命令
顯示，以及閘道 WebSocket 協定記錄。這些表面仍可使用
`logging.redactPatterns` 作為額外模式，但 `redactSensitive: "off"`
不會讓它們輸出原始秘密。

## 閘道 WebSocket 記錄

閘道會以兩種模式列印 WebSocket 協定記錄：

- **一般模式（沒有 `--verbose`）**：只會列印「值得注意」的 RPC 結果：
  - 錯誤（`ok=false`）
  - 慢速呼叫（預設閾值：`>= 50ms`）
  - 解析錯誤
- **詳細模式（`--verbose`）**：列印所有 WS 請求/回應流量。

### WS 記錄樣式

`openclaw gateway` 支援每個閘道的樣式切換：

- `--ws-log auto`（預設）：一般模式經過最佳化；詳細模式使用精簡輸出
- `--ws-log compact`：詳細模式時使用精簡輸出（配對的請求/回應）
- `--ws-log full`：詳細模式時使用完整的每框架輸出
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

主控台格式化器**會感知 TTY**，並列印一致、帶前綴的行。
子系統記錄器會讓輸出保持分組且易於掃描。

行為：

- 每行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系統顏色**（每個子系統穩定）加上層級著色
- **輸出為 TTY 或環境看起來像豐富終端機時啟用顏色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），遵循 `NO_COLOR`
- **縮短的子系統前綴**：移除前導 `gateway/` + `channels/`，保留最後 2 個區段（例如 `whatsapp/outbound`）
- **依子系統建立的子記錄器**（自動前綴 + 結構化欄位 `{ subsystem }`）
- 用於 QR/UX 輸出的 **`logRaw()`**（無前綴、無格式化）
- **主控台樣式**（例如 `pretty | compact | json`）
- **主控台記錄層級**與檔案記錄層級分離（當 `logging.level` 設為 `debug`/`trace` 時，檔案會保留完整細節）
- **WhatsApp 訊息本文**會以 `debug` 記錄（使用 `--verbose` 可查看）

這會讓既有檔案記錄保持穩定，同時讓互動式輸出易於掃描。

## 相關

- [記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
