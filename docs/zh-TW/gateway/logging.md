---
read_when:
    - 變更記錄輸出或格式
    - 偵錯命令列介面或閘道輸出
summary: 記錄介面、檔案記錄、WebSocket 記錄樣式與主控台格式設定
title: 閘道記錄日誌
x-i18n:
    generated_at: "2026-07-22T10:36:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 257427f06767d4574cb4657d6a3953930807fa08da4e40ef0a403b34c57aaeee
    source_path: gateway/logging.md
    workflow: 16
---

# 記錄

如需面向使用者的概覽（命令列介面 + 控制介面 + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩種記錄介面：

- **主控台輸出** - 你在終端機／偵錯介面中看到的內容。
- **檔案日誌** - 由閘道記錄器寫入的 JSON 行。

啟動時，閘道會記錄解析後的預設代理程式模型，以及會影響新工作階段的模式預設值：

```text
代理程式模型：openai/gpt-5.6-sol（思考層級=medium，快速模式=開啟）
```

`thinking` 來自預設代理程式、模型參數或全域代理程式預設值；未設定時會顯示 `medium`。`fast` 來自預設代理程式或模型的 `fastMode` 參數。

## 檔案型記錄器

- 預設的輪替日誌檔位於 `/tmp/openclaw/` 下（每天一個檔案）：`openclaw-YYYY-MM-DD.log`，日期依閘道主機的本地時區而定。如果該目錄不安全或無法寫入（擁有者錯誤、所有人皆可寫入，或為符號連結），OpenClaw 會改用使用者範圍的 `os.tmpdir()/openclaw-<uid>` 路徑；在 Windows 上一律使用此作業系統暫存目錄的替代路徑。
- 使用中的日誌檔會在達到 `logging.maxFileBytes` 時輪替（預設：100 MB），最多保留五個編號封存檔（`.1` 至 `.5`），並繼續寫入新的使用中檔案。
- 透過 `~/.openclaw/openclaw.json` 設定日誌檔路徑與層級：`logging.file`、`logging.level`。
- 檔案格式為每行一個 JSON 物件。

通話、即時語音和受管理房間的程式碼路徑會使用共用檔案記錄器，記錄範圍有限的生命週期資料，供作業偵錯與 OTLP 日誌匯出使用。逐字稿文字、音訊承載資料、輪次 ID、通話 ID 和供應商項目 ID 絕不會複製到日誌記錄中。

控制介面的 Logs 分頁會透過閘道追蹤此檔案（`logs.tail`）。命令列介面也會執行相同操作：

```bash
openclaw logs --follow
```

### 詳細模式與日誌層級

- **檔案日誌**僅由 `logging.level` 控制。
- `--verbose` 只會影響**主控台詳細程度**（以及 WS 日誌樣式），**不會**提高檔案日誌層級。
- 若要在檔案日誌中擷取僅限詳細模式的資訊，請將 `logging.level` 設為 `debug` 或 `trace`。
- 追蹤記錄也會包含所選熱門路徑的診斷計時摘要，例如外掛工具工廠的準備作業。請參閱 [/tools/plugin#slow-plugin-tool-setup](/zh-TW/tools/plugin#slow-plugin-tool-setup)。

## 主控台擷取

命令列介面會擷取 `console.log/info/warn/error/debug/trace`，將其寫入檔案日誌，並仍然輸出至 stdout/stderr。

可獨立調整主控台詳細程度：

- `logging.consoleLevel`（預設為 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`；在 TTY 上預設為 `pretty`，否則為 `compact`）

## 遮罩處理

OpenClaw 會在日誌或逐字稿輸出離開處理程序前，遮罩敏感權杖。此遮罩政策適用於主控台、檔案日誌、OTLP 日誌記錄和工作階段逐字稿文字的輸出端，因此相符的秘密值會在 JSONL 行或訊息寫入磁碟前遭到遮罩。

- 敏感值遮罩一律啟用。
- `logging.redactPatterns`：規則運算式字串陣列（會覆寫預設值）
  - 使用原始規則運算式字串（自動 `gi`），或使用 `/pattern/flags` 指定自訂旗標。
  - 相符內容會保留前 6 個及後 4 個字元並遮罩其餘部分（值長度 >= 18 個字元）；較短的值會變成 `***`。
  - 預設涵蓋常見的金鑰指派、命令列介面旗標、JSON 欄位、Bearer 標頭、PEM 區塊、熱門供應商權杖前綴，以及付款認證資訊欄位名稱（卡號、CVC/CVV、共用付款權杖、付款認證資訊）。

控制介面工具呼叫事件、`sessions_history` 輸出、診斷匯出、供應商錯誤、執行核准顯示，以及閘道 WebSocket 日誌等安全邊界一律會進行遮罩。`logging.redactPatterns` 可新增部署專用的模式。

## 閘道 WebSocket 日誌

閘道會以兩種模式輸出 WebSocket 通訊協定日誌：

- **一般模式（無 `--verbose`）**：只輸出「值得關注」的 RPC 結果，包括錯誤（`ok=false`）、緩慢呼叫（預設門檻：`>= 50ms`）和剖析錯誤。
- **詳細模式（`--verbose`）**：輸出所有 WS 要求／回應流量。

### WS 日誌樣式

`openclaw gateway` 支援個別閘道的樣式切換：

- `--ws-log auto`（預設）：一般模式會最佳化；詳細模式使用精簡輸出。
- `--ws-log compact`：詳細模式下使用精簡輸出（要求／回應成對顯示）。
- `--ws-log full`：詳細模式下完整輸出每個訊框。
- `--compact`：`--ws-log compact` 的別名。

```bash
# 最佳化（僅錯誤／緩慢呼叫）
openclaw gateway

# 顯示所有 WS 流量（成對）
openclaw gateway --verbose --ws-log compact

# 顯示所有 WS 流量（完整中繼資料）
openclaw gateway --verbose --ws-log full
```

## 主控台格式（子系統記錄）

主控台格式器可感知 **TTY**，並輸出格式一致且帶有前綴的行。子系統記錄器會將輸出保持分組且易於瀏覽：

- 每行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）。
- **子系統色彩**（每個子系統的色彩固定，依名稱雜湊產生），並搭配層級色彩。
- 當輸出為 TTY，或環境看似功能豐富的終端機（`TERM`/`COLORTERM`/`TERM_PROGRAM`）時**使用色彩**；並遵循 `NO_COLOR` 和 `FORCE_COLOR`。
- **縮短的子系統前綴**：移除開頭的 `gateway/`、`channels/` 或 `providers/` 區段，接著最多保留其餘區段中的最後 2 個（例如 `channels/turn/kernel` 會顯示為 `turn/kernel`）。已知的頻道子系統（`telegram`、`whatsapp`、`slack` 等）一律縮減為僅顯示頻道名稱。
- **依子系統建立子記錄器**（自動加上前綴和結構化欄位 `{ subsystem }`）。
- **`logRaw()`** 用於 QR／使用者體驗輸出（無前綴、無格式化）。
- **主控台樣式**：`pretty` | `compact` | `json`。
- **主控台日誌層級**與檔案日誌層級分開（當 `logging.level` 為 `debug`/`trace` 時，檔案仍會保留完整詳細資料）。
- **WhatsApp 訊息本文**會以 `debug` 層級記錄（使用 `--verbose` 即可查看）。

這能讓檔案日誌保持穩定，同時使互動式輸出易於瀏覽。

## 相關內容

- [記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
