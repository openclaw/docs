---
read_when:
    - 變更日誌輸出或格式
    - 偵錯 CLI 或 Gateway 輸出
summary: 日誌介面、檔案日誌、WS 日誌樣式，以及主控台格式設定
title: Gateway 日誌記錄
x-i18n:
    generated_at: "2026-05-02T02:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# 日誌

如需面向使用者的概覽（CLI + Control UI + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩個日誌「介面」：

- **主控台輸出**（你在終端機 / Debug UI 中看到的內容）。
- **檔案日誌**（JSON lines），由 Gateway 記錄器寫入。

## 檔案型記錄器

- 預設輪替日誌檔位於 `/tmp/openclaw/` 下（每天一個檔案）：`openclaw-YYYY-MM-DD.log`
  - 日期使用 Gateway 主機的本地時區。
- 作用中的日誌檔會在 `logging.maxFileBytes`（預設：100 MB）輪替，最多保留五個編號封存檔，並繼續寫入新的作用中檔案。
- 日誌檔路徑和層級可透過 `~/.openclaw/openclaw.json` 設定：
  - `logging.file`
  - `logging.level`

檔案格式為每行一個 JSON 物件。

Control UI 的 Logs 分頁會透過 Gateway 追蹤此檔案（`logs.tail`）。
CLI 也可以執行相同操作：

```bash
openclaw logs --follow
```

**詳細模式與日誌層級**

- **檔案日誌**完全由 `logging.level` 控制。
- `--verbose` 只影響**主控台詳細程度**（以及 WS 日誌樣式）；它**不會**提高檔案日誌層級。
- 若要在檔案日誌中擷取僅詳細模式才有的細節，請將 `logging.level` 設為 `debug` 或 `trace`。
- Trace 日誌也會包含所選熱路徑的診斷計時摘要，例如 Plugin 工具工廠準備。請參閱 [/tools/plugin#slow-plugin-tool-setup](/zh-TW/tools/plugin#slow-plugin-tool-setup)。

## 主控台擷取

CLI 會擷取 `console.log/info/warn/error/debug/trace` 並寫入檔案日誌，同時仍會列印到 stdout/stderr。

你可以透過以下項目獨立調整主控台詳細程度：

- `logging.consoleLevel`（預設 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 遮蔽

OpenClaw 可以在日誌或轉錄輸出離開程序前遮蔽敏感權杖。此日誌遮蔽政策會套用於主控台、檔案日誌、OTLP 日誌記錄和工作階段轉錄文字輸出端，因此相符的密鑰值會在 JSONL 行或訊息寫入磁碟前被遮蔽。

- `logging.redactSensitive`: `off` | `tools`（預設：`tools`）
- `logging.redactPatterns`: regex 字串陣列（覆寫預設值）
  - 使用原始 regex 字串（自動 `gi`），或在需要自訂旗標時使用 `/pattern/flags`。
  - 相符內容會透過保留前 6 + 後 4 個字元來遮蔽（長度 >= 18），否則為 `***`。
  - 預設涵蓋常見的金鑰指定、CLI 旗標、JSON 欄位、bearer 標頭、PEM 區塊、常見權杖前綴，以及付款憑證欄位名稱，例如卡號、CVC/CVV、共用付款權杖和付款憑證。

某些安全邊界一律遮蔽，不受 `logging.redactSensitive` 影響。這包括 Control UI 工具呼叫事件、`sessions_history` 工具輸出、診斷支援匯出、提供者錯誤觀察、exec 核准命令顯示，以及 Gateway WebSocket 通訊協定日誌。這些介面仍可使用 `logging.redactPatterns` 作為額外模式，但 `redactSensitive: "off"` 不會讓它們輸出原始密鑰。

## Gateway WebSocket 日誌

Gateway 會以兩種模式列印 WebSocket 通訊協定日誌：

- **一般模式（沒有 `--verbose`）**：只列印「有意義」的 RPC 結果：
  - 錯誤（`ok=false`）
  - 慢速呼叫（預設閾值：`>= 50ms`）
  - 剖析錯誤
- **詳細模式（`--verbose`）**：列印所有 WS 要求/回應流量。

### WS 日誌樣式

`openclaw gateway` 支援每個 Gateway 的樣式切換：

- `--ws-log auto`（預設）：一般模式會最佳化；詳細模式使用精簡輸出
- `--ws-log compact`：詳細模式時使用精簡輸出（配對的要求/回應）
- `--ws-log full`：詳細模式時使用完整的逐訊框輸出
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

主控台格式化器具備 **TTY 感知**能力，並會列印一致且帶有前綴的行。子系統記錄器會讓輸出保持分組且易於掃描。

行為：

- 每行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系統顏色**（每個子系統穩定）加上層級著色
- **當輸出是 TTY 或環境看起來像豐富終端機時使用顏色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），並遵循 `NO_COLOR`
- **縮短的子系統前綴**：移除前導 `gateway/` + `channels/`，保留最後 2 個片段（例如 `whatsapp/outbound`）
- **依子系統的子記錄器**（自動前綴 + 結構化欄位 `{ subsystem }`）
- **`logRaw()`** 用於 QR/UX 輸出（無前綴、無格式化）
- **主控台樣式**（例如 `pretty | compact | json`）
- **主控台日誌層級**與檔案日誌層級分開（當 `logging.level` 設為 `debug`/`trace` 時，檔案會保留完整細節）
- **WhatsApp 訊息本文**會以 `debug` 記錄（使用 `--verbose` 查看）

這會讓既有檔案日誌保持穩定，同時讓互動式輸出更容易掃描。

## 相關

- [日誌](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
