---
read_when:
    - 新增或修改背景 exec 行為
    - 偵錯長時間執行的 exec 任務
summary: 背景 exec 執行與行程管理
title: 背景執行與處理程序工具
x-i18n:
    generated_at: "2026-05-06T09:09:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 會透過 `exec` 工具執行 shell 命令，並將長時間執行的工作保留在記憶體中。`process` 工具會管理這些背景工作階段。

## exec 工具

主要參數：

- `command`（必填）
- `yieldMs`（預設 10000）：超過此延遲後自動轉入背景
- `background`（bool）：立即轉入背景
- `timeout`（秒，預設 `tools.exec.timeoutSec`）：在此逾時後終止程序；只有在要停用該次呼叫的 exec 程序逾時時，才設定 `timeout: 0`
- `elevated`（bool）：如果已啟用/允許提權模式，則在沙箱外執行（預設為 `gateway`；當 exec 目標是 `node` 時則為 `node`）
- 需要真正的 TTY？設定 `pty: true`。
- `workdir`、`env`

行為：

- 前景執行會直接傳回輸出。
- 轉入背景時（明確指定或逾時），工具會傳回 `status: "running"` + `sessionId` 和簡短尾端輸出。
- 背景與 `yieldMs` 執行會繼承 `tools.exec.timeoutSec`，除非該呼叫提供明確的 `timeout`。
- 輸出會保留在記憶體中，直到工作階段被輪詢或清除。
- 如果不允許使用 `process` 工具，`exec` 會同步執行並忽略 `yieldMs`/`background`。
- 產生的 exec 命令會收到 `OPENCLAW_SHELL=exec`，用於可感知情境的 shell/profile 規則。
- 對於現在開始的長時間工作，啟動一次即可，並在已啟用且命令發出輸出或失敗時，依賴自動完成喚醒。
- 如果無法使用自動完成喚醒，或你需要確認某個命令在沒有輸出的情況下乾淨結束的靜默成功，請使用 `process` 確認完成。
- 不要用 `sleep` 迴圈或重複輪詢來模擬提醒或延遲後續動作；未來工作請使用 Cron。

## 子程序橋接

在 exec/process 工具之外產生長時間執行的子程序時（例如 CLI 重新產生或 gateway 輔助程式），請附加子程序橋接輔助工具，讓終止訊號能被轉送，並在結束/錯誤時分離監聽器。這可避免 systemd 上出現孤立程序，並讓各平台的關閉行為保持一致。

環境覆寫：

- `PI_BASH_YIELD_MS`：預設 yield（毫秒）
- `PI_BASH_MAX_OUTPUT_CHARS`：記憶體內輸出上限（字元）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每個串流的 pending stdout/stderr 上限（字元）
- `PI_BASH_JOB_TTL_MS`：已完成工作階段的 TTL（毫秒，限制在 1m–3h）

設定（建議）：

- `tools.exec.backgroundMs`（預設 10000）
- `tools.exec.timeoutSec`（預設 1800）
- `tools.exec.cleanupMs`（預設 1800000）
- `tools.exec.notifyOnExit`（預設 true）：當背景化的 exec 結束時，將系統事件加入佇列並請求 Heartbeat。
- `tools.exec.notifyOnExitEmptySuccess`（預設 false）：為 true 時，也會為沒有產生輸出的成功背景執行加入完成事件。

## process 工具

動作：

- `list`：執行中 + 已完成的工作階段
- `poll`：取出某個工作階段的新輸出（也會回報結束狀態）
- `log`：讀取彙總輸出（支援 `offset` + `limit`）
- `write`：傳送 stdin（`data`，選用 `eof`）
- `send-keys`：將明確的按鍵 token 或位元組傳送到 PTY 支援的工作階段
- `submit`：將 Enter / carriage return 傳送到 PTY 支援的工作階段
- `paste`：傳送字面文字，可選擇包在 bracketed paste mode 中
- `kill`：終止背景工作階段
- `clear`：從記憶體移除已完成的工作階段
- `remove`：若仍在執行則終止；否則若已完成則清除

注意事項：

- 只有背景化的工作階段會被列出/持久保留在記憶體中。
- 程序重新啟動後，工作階段會遺失（沒有磁碟持久化）。
- 只有在你執行 `process poll/log` 且工具結果被記錄時，工作階段記錄才會儲存到聊天歷史中。
- `process` 以每個 agent 為範圍；它只看得到該 agent 啟動的工作階段。
- 使用 `poll` / `log` 取得狀態、記錄、靜默成功確認，或在無法使用自動完成喚醒時確認完成。
- 需要輸入或介入時，使用 `write` / `send-keys` / `submit` / `paste` / `kill`。
- `process list` 包含衍生的 `name`（命令動詞 + 目標），便於快速掃描。
- `process log` 使用以行為基礎的 `offset`/`limit`。
- 略過 `offset` 和 `limit` 時，會傳回最後 200 行並包含分頁提示。
- 提供 `offset` 且略過 `limit` 時，會從 `offset` 傳回到結尾（不限制為 200 行）。
- 輪詢用於隨需狀態，不是等待迴圈排程。如果工作應該稍後發生，請改用 Cron。

## 範例

執行長時間工作並稍後輪詢：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

立即在背景中啟動：

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

傳送 stdin：

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

傳送 PTY 按鍵：

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

送出目前行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上字面文字：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相關

- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)
