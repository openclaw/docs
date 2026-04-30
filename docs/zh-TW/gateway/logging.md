---
read_when:
    - 變更記錄輸出或格式
    - 偵錯 CLI 或 Gateway 輸出
summary: 日誌介面、檔案日誌、WS 日誌樣式與主控台格式化
title: Gateway 日誌記錄
x-i18n:
    generated_at: "2026-04-30T03:07:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# 日誌

如需使用者面向的概覽（CLI + Control UI + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩個日誌「介面」：

- **控制台輸出**（你在終端機 / Debug UI 中看到的內容）。
- **檔案日誌**（JSON lines），由 Gateway 記錄器寫入。

## 檔案型記錄器

- 預設輪替日誌檔位於 `/tmp/openclaw/` 下（每天一個檔案）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 主機的本地時區。
- 作用中的日誌檔會在 `logging.maxFileBytes` 時輪替（預設：100 MB），保留
  最多五個編號封存檔，並繼續寫入新的作用中檔案。
- 日誌檔路徑與等級可透過 `~/.openclaw/openclaw.json` 設定：
  - `logging.file`
  - `logging.level`

檔案格式為每行一個 JSON 物件。

Control UI 的 Logs 分頁會透過 Gateway 追蹤讀取此檔案（`logs.tail`）。
CLI 也可以執行相同操作：

```bash
openclaw logs --follow
```

**詳細模式與日誌等級**

- **檔案日誌**只由 `logging.level` 控制。
- `--verbose` 只影響**控制台詳細程度**（以及 WS 日誌樣式）；它**不會**
  提高檔案日誌等級。
- 若要在檔案日誌中擷取僅詳細模式才有的細節，請將 `logging.level` 設為 `debug` 或
  `trace`。

## 控制台擷取

CLI 會擷取 `console.log/info/warn/error/debug/trace` 並寫入檔案日誌，
同時仍列印到 stdout/stderr。

你可以透過下列項目獨立調整控制台詳細程度：

- `logging.consoleLevel`（預設 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 遮罩

OpenClaw 可以在日誌或逐字稿輸出離開程序前遮罩敏感權杖。
此日誌遮罩政策會套用於控制台、檔案日誌、OTLP 日誌記錄，以及工作階段逐字稿文字輸出端，
因此符合的祕密值會在 JSONL 行或訊息寫入磁碟前被遮罩。

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：regex 字串陣列（覆寫預設值）
  - 使用原始 regex 字串（自動 `gi`），或在需要自訂旗標時使用 `/pattern/flags`。
  - 符合項會保留前 6 + 後 4 個字元來遮罩（長度 >= 18），否則使用 `***`。
  - 預設值涵蓋常見金鑰指派、CLI 旗標、JSON 欄位、bearer 標頭、PEM 區塊，以及常見權杖前綴。

有些安全邊界無論 `logging.redactSensitive` 為何都一律遮罩。
這包括 Control UI 工具呼叫事件、`sessions_history` 工具輸出、
診斷支援匯出、提供者錯誤觀察、exec 核准命令顯示，
以及 Gateway WebSocket 協定日誌。這些介面仍可使用
`logging.redactPatterns` 作為額外模式，但 `redactSensitive: "off"`
不會讓它們輸出未遮罩的祕密。

## Gateway WebSocket 日誌

Gateway 會以兩種模式列印 WebSocket 協定日誌：

- **一般模式（無 `--verbose`）**：只列印「值得注意」的 RPC 結果：
  - 錯誤（`ok=false`）
  - 慢速呼叫（預設閾值：`>= 50ms`）
  - 解析錯誤
- **詳細模式（`--verbose`）**：列印所有 WS 請求/回應流量。

### WS 日誌樣式

`openclaw gateway` 支援每個 Gateway 的樣式切換：

- `--ws-log auto`（預設）：一般模式會最佳化；詳細模式使用精簡輸出
- `--ws-log compact`：詳細模式下使用精簡輸出（配對請求/回應）
- `--ws-log full`：詳細模式下使用完整的每框架輸出
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

## 控制台格式化（子系統記錄）

控制台格式化工具具備 **TTY 感知能力**，並列印一致且帶前綴的行。
子系統記錄器會讓輸出保持分組且易於掃描。

行為：

- 每行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系統顏色**（每個子系統穩定）加上等級著色
- **當輸出是 TTY，或環境看起來像豐富終端機時啟用顏色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），並遵循 `NO_COLOR`
- **縮短的子系統前綴**：移除開頭的 `gateway/` + `channels/`，保留最後 2 個區段（例如 `whatsapp/outbound`）
- **依子系統建立子記錄器**（自動前綴 + 結構化欄位 `{ subsystem }`）
- **`logRaw()`** 用於 QR/UX 輸出（無前綴、無格式化）
- **控制台樣式**（例如 `pretty | compact | json`）
- **控制台日誌等級**與檔案日誌等級分開（當 `logging.level` 設為 `debug`/`trace` 時，檔案會保留完整細節）
- **WhatsApp 訊息本文**會以 `debug` 記錄（使用 `--verbose` 查看）

這會在保持既有檔案日誌穩定的同時，讓互動式輸出易於掃描。

## 相關

- [日誌](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
