---
read_when:
    - 變更記錄輸出或格式
    - 偵錯命令列介面或閘道輸出
summary: 日誌介面、檔案日誌、WebSocket 日誌樣式與主控台格式設定
title: 閘道記錄日誌
x-i18n:
    generated_at: "2026-07-12T14:31:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# 日誌記錄

如需面向使用者的概覽（命令列介面 + 控制介面 + 設定），請參閱 [/logging](/zh-TW/logging)。

OpenClaw 有兩種日誌介面：

- **主控台輸出** - 你在終端機／偵錯介面中看到的內容。
- **檔案日誌** - 由閘道記錄器寫入的 JSON 行。

啟動時，閘道會記錄解析後的預設代理程式模型，以及影響新工作階段的模式預設值：

```text
代理程式模型：openai/gpt-5.6-sol（思考層級=medium，快速模式=開啟）
```

`thinking` 來自預設代理程式、模型參數或全域代理程式預設值；未設定時會顯示 `medium`。`fast` 來自預設代理程式或模型的 `fastMode` 參數。

## 檔案式記錄器

- 預設的滾動日誌檔位於 `/tmp/openclaw/` 下（每天一個檔案）：`openclaw-YYYY-MM-DD.log`，日期依閘道主機的當地時區而定。如果該目錄不安全或無法寫入（擁有者錯誤、所有人皆可寫入或為符號連結），OpenClaw 會改用使用者範圍的 `os.tmpdir()/openclaw-<uid>` 路徑；在 Windows 上則一律使用此作業系統暫存目錄備援路徑。
- 使用中的日誌檔會在達到 `logging.maxFileBytes`（預設：100 MB）時輪替，最多保留五個編號封存檔（`.1` 到 `.5`），並繼續寫入新的使用中檔案。
- 透過 `~/.openclaw/openclaw.json` 設定日誌檔路徑與層級：`logging.file`、`logging.level`。
- 檔案格式為每行一個 JSON 物件。

通話、即時語音和受管理房間的程式碼路徑會使用共用檔案記錄器，記錄範圍受限的生命週期資料，供操作偵錯與 OTLP 日誌匯出使用。逐字稿文字、音訊承載資料、回合 ID、通話 ID 和供應商項目 ID 絕不會複製到日誌記錄中。

控制介面的「日誌」分頁會透過閘道（`logs.tail`）持續讀取此檔案。命令列介面也會執行相同操作：

```bash
openclaw logs --follow
```

### 詳細模式與日誌層級

- **檔案日誌**僅由 `logging.level` 控制。
- `--verbose` 只影響**主控台詳細程度**（以及 WS 日誌樣式），**不會**提高檔案日誌層級。
- 若要在檔案日誌中擷取僅於詳細模式顯示的細節，請將 `logging.level` 設為 `debug` 或 `trace`。
- 追蹤日誌也會包含特定熱門路徑的診斷計時摘要，例如外掛工具工廠準備。請參閱 [/tools/plugin#slow-plugin-tool-setup](/zh-TW/tools/plugin#slow-plugin-tool-setup)。

## 主控台擷取

命令列介面會擷取 `console.log/info/warn/error/debug/trace`，將其寫入檔案日誌，同時仍輸出至 stdout/stderr。

可獨立調整主控台詳細程度：

- `logging.consoleLevel`（預設為 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`；在 TTY 上預設為 `pretty`，否則為 `compact`）

## 遮蔽

OpenClaw 會在日誌或逐字稿輸出離開處理程序前遮蔽敏感權杖。此遮蔽原則適用於主控台、檔案日誌、OTLP 日誌記錄和工作階段逐字稿文字輸出端，因此相符的機密值會在 JSONL 行或訊息寫入磁碟前遭到遮蔽。

- `logging.redactSensitive`：`off` | `tools`（預設：`tools`）
- `logging.redactPatterns`：正規表示式字串陣列（覆寫預設值）
  - 使用原始正規表示式字串（自動套用 `gi`），或使用 `/pattern/flags` 自訂旗標。
  - 相符內容會被遮蔽，但保留前 6 個及後 4 個字元（值長度 >= 18 個字元）；較短的值會變成 `***`。
  - 預設涵蓋常見金鑰指派、命令列介面旗標、JSON 欄位、Bearer 標頭、PEM 區塊、常見供應商權杖前綴，以及付款認證資訊欄位名稱（卡號、CVC/CVV、共用付款權杖、付款認證資訊）。

無論 `logging.redactSensitive` 的設定為何，某些安全邊界一律會進行遮蔽：控制介面工具呼叫事件、`sessions_history` 工具輸出、診斷支援匯出、供應商錯誤觀察、執行核准命令顯示，以及閘道 WebSocket 通訊協定日誌。這些介面仍會將 `logging.redactPatterns` 視為額外模式，但 `redactSensitive: "off"` 不會使其輸出未遮蔽的機密。

## 閘道 WebSocket 日誌

閘道會以兩種模式輸出 WebSocket 通訊協定日誌：

- **一般模式（無 `--verbose`）**：僅輸出「值得注意」的 RPC 結果，包括錯誤（`ok=false`）、緩慢呼叫（預設門檻：`>= 50ms`）和剖析錯誤。
- **詳細模式（`--verbose`）**：輸出所有 WS 要求／回應流量。

### WS 日誌樣式

`openclaw gateway` 支援個別閘道的樣式切換：

- `--ws-log auto`（預設）：一般模式採最佳化輸出；詳細模式使用精簡輸出。
- `--ws-log compact`：詳細模式下使用精簡輸出（要求／回應配對）。
- `--ws-log full`：詳細模式下使用完整的逐影格輸出。
- `--compact`：`--ws-log compact` 的別名。

```bash
# 最佳化（僅顯示錯誤／緩慢呼叫）
openclaw gateway

# 顯示所有 WS 流量（配對）
openclaw gateway --verbose --ws-log compact

# 顯示所有 WS 流量（完整中繼資料）
openclaw gateway --verbose --ws-log full
```

## 主控台格式化（子系統日誌記錄）

主控台格式化工具可**感知 TTY**，並輸出格式一致且帶有前綴的行。子系統記錄器會讓輸出保持分組且易於瀏覽：

- 每一行都有**子系統前綴**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）。
- **子系統色彩**（每個子系統的色彩固定，依名稱雜湊產生）以及層級色彩。
- **當輸出為 TTY**，或環境看似支援豐富顯示的終端機（`TERM`/`COLORTERM`/`TERM_PROGRAM`）時使用色彩；並遵循 `NO_COLOR` 和 `FORCE_COLOR`。
- **縮短的子系統前綴**：移除開頭的 `gateway/`、`channels/` 或 `providers/` 區段，接著最多保留剩餘區段中的最後 2 個（例如 `channels/turn/kernel` 會顯示為 `turn/kernel`）。已知的頻道子系統（`telegram`、`whatsapp`、`slack` 等）一律縮短為僅顯示頻道名稱。
- **依子系統劃分的子記錄器**（自動前綴 + 結構化欄位 `{ subsystem }`）。
- **`logRaw()`** 用於 QR／使用者體驗輸出（無前綴、不套用格式）。
- **主控台樣式**：`pretty` | `compact` | `json`。
- **主控台日誌層級**與檔案日誌層級分開設定（當 `logging.level` 為 `debug`/`trace` 時，檔案會保留完整細節）。
- **WhatsApp 訊息本文**以 `debug` 層級記錄（使用 `--verbose` 查看）。

這可讓檔案日誌維持穩定，同時讓互動式輸出易於瀏覽。

## 相關內容

- [日誌記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
- [診斷匯出](/zh-TW/gateway/diagnostics)
