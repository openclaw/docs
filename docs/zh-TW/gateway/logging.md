---
read_when:
    - 變更日誌輸出或格式
    - 偵錯命令列介面或閘道輸出
summary: 記錄介面、檔案記錄、WS 記錄樣式與主控台格式設定
title: 閘道記錄
x-i18n:
    generated_at: "2026-07-05T11:20:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7c689690d10ccdc5eca838e5248a5bf235a595c7498c600760dc71cf5c688eb
    source_path: gateway/logging.md
    workflow: 16
---

# 日誌

如需面向使用者的概覽（命令列介面 + 控制 UI + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩個日誌介面：

- **主控台輸出** - 你在終端機 / 偵錯 UI 中看到的內容。
- **檔案日誌** - 由閘道記錄器寫入的 JSON 行。

啟動時，閘道會記錄解析後的預設代理模型，以及會影響新工作階段的模式預設值：

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` 來自預設代理、模型參數或全域代理預設值；未設定時會顯示 `medium`。`fast` 來自預設代理或模型的 `fastMode` 參數。

## 檔案型記錄器

- 預設的輪替日誌檔位於 `/tmp/openclaw/` 下（每天一個檔案）：`openclaw-YYYY-MM-DD.log`，日期依閘道主機的本地時區而定。如果該目錄不安全或不可寫入（擁有者錯誤、任何人可寫、符號連結），OpenClaw 會改用使用者範圍的 `os.tmpdir()/openclaw-<uid>` 路徑；在 Windows 上則一律使用該作業系統暫存目錄後援路徑。
- 作用中的日誌檔會在 `logging.maxFileBytes`（預設：100 MB）時輪替，最多保留五個編號封存檔（`.1` 到 `.5`），並繼續寫入新的作用中檔案。
- 透過 `~/.openclaw/openclaw.json` 設定日誌檔路徑與層級：`logging.file`、`logging.level`。
- 檔案格式為每行一個 JSON 物件。

對話、即時語音和受管理房間的程式碼路徑，會使用共用檔案記錄器寫入有界的生命週期記錄，用於營運偵錯與 OTLP 日誌匯出。逐字稿文字、音訊酬載、回合 ID、通話 ID 和提供者項目 ID 絕不會複製到日誌記錄中。

控制 UI 的日誌分頁會透過閘道追蹤此檔案（`logs.tail`）。命令列介面也會執行相同操作：

```bash
openclaw logs --follow
```

### 詳細模式與日誌層級

- **檔案日誌** 完全由 `logging.level` 控制。
- `--verbose` 只影響**主控台詳細程度**（以及 WS 日誌樣式），**不會**提高檔案日誌層級。
- 若要在檔案日誌中擷取僅詳細模式才有的細節，請將 `logging.level` 設為 `debug` 或 `trace`。
- 追蹤記錄也包含所選熱路徑的診斷計時摘要，例如外掛工具工廠準備。請參閱 [/tools/plugin#slow-plugin-tool-setup](/zh-TW/tools/plugin#slow-plugin-tool-setup)。

## 主控台擷取

命令列介面會擷取 `console.log/info/warn/error/debug/trace`，將它們寫入檔案日誌，並仍輸出到 stdout/stderr。

可獨立調整主控台詳細程度：

- `logging.consoleLevel`（預設 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`；在 TTY 上預設為 `pretty`，否則為 `compact`）

## 遮罩

OpenClaw 會在日誌或逐字稿輸出離開程序前遮罩敏感權杖。此遮罩政策適用於主控台、檔案日誌、OTLP 日誌記錄，以及工作階段逐字稿文字輸出端，因此相符的祕密值會在 JSONL 行或訊息寫入磁碟前被遮罩。

- `logging.redactSensitive`: `off` | `tools`（預設：`tools`）
- `logging.redactPatterns`: regex 字串陣列（覆寫預設值）
  - 使用原始 regex 字串（自動 `gi`），或使用 `/pattern/flags` 指定自訂旗標。
  - 相符內容會保留前 6 + 後 4 個字元並遮罩（值長度 >= 18 個字元）；較短的值會變成 `***`。
  - 預設值涵蓋常見金鑰指派、命令列介面旗標、JSON 欄位、bearer 標頭、PEM 區塊、熱門供應商權杖前綴，以及付款憑證欄位名稱（卡號、CVC/CVV、共用付款權杖、付款憑證）。

部分安全邊界不論 `logging.redactSensitive` 設定為何都一定會遮罩：控制 UI 工具呼叫事件、`sessions_history` 工具輸出、診斷支援匯出、提供者錯誤觀察、exec 核准命令顯示，以及閘道 WebSocket 協定日誌。這些介面仍會採用 `logging.redactPatterns` 作為額外模式，但 `redactSensitive: "off"` 不會讓它們輸出原始祕密。

## 閘道 WebSocket 日誌

閘道會以兩種模式列印 WebSocket 協定日誌：

- **一般模式（無 `--verbose`）**：只列印「值得注意」的 RPC 結果 - 錯誤（`ok=false`）、慢速呼叫（預設閾值：`>= 50ms`）和剖析錯誤。
- **詳細模式（`--verbose`）**：列印所有 WS 請求/回應流量。

### WS 日誌樣式

`openclaw gateway` 支援每個閘道的樣式切換：

- `--ws-log auto`（預設）：一般模式會最佳化；詳細模式使用精簡輸出。
- `--ws-log compact`：詳細模式時使用精簡輸出（成對請求/回應）。
- `--ws-log full`：詳細模式時使用完整逐框輸出。
- `--compact`：`--ws-log compact` 的別名。

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## 主控台格式化（子系統記錄）

主控台格式化器具有 **TTY 感知能力**，並會列印一致且帶前綴的行。子系統記錄器會讓輸出保持分組且易於瀏覽：

- 每一行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）。
- **子系統顏色**（每個子系統穩定，依名稱雜湊而來）加上層級著色。
- **輸出為 TTY 時使用顏色**，或環境看起來像豐富終端機（`TERM`/`COLORTERM`/`TERM_PROGRAM`）時使用；遵循 `NO_COLOR` 和 `FORCE_COLOR`。
- **縮短的子系統前綴**：移除開頭的 `gateway/`、`channels/` 或 `providers/` 區段，然後最多保留最後 2 個剩餘區段（例如 `channels/turn/kernel` 會顯示為 `turn/kernel`）。已知的頻道子系統（`telegram`、`whatsapp`、`slack` 等）一律收合為頻道名稱本身。
- **依子系統的子記錄器**（自動前綴 + 結構化欄位 `{ subsystem }`）。
- 用於 QR/UX 輸出的 **`logRaw()`**（無前綴、無格式化）。
- **主控台樣式**：`pretty` | `compact` | `json`。
- **主控台日誌層級**與檔案日誌層級分離（當 `logging.level` 為 `debug`/`trace` 時，檔案會保留完整細節）。
- **WhatsApp 訊息本文**會以 `debug` 記錄（使用 `--verbose` 查看）。

這會讓檔案日誌保持穩定，同時讓互動式輸出易於瀏覽。

## 相關

- [日誌](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
