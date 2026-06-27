---
read_when:
    - 新增或修改背景執行行為
    - 偵錯長時間執行的 exec 任務
summary: 背景 exec 執行與程序管理
title: 背景執行與程序工具
x-i18n:
    generated_at: "2026-06-27T19:15:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 透過 `exec` 工具執行 shell 命令，並將長時間執行的任務保留在記憶體中。`process` 工具會管理這些背景工作階段。

## exec 工具

主要參數：

- `command`（必填）
- `yieldMs`（預設 10000）：經過此延遲後自動轉入背景
- `background`（布林值）：立即轉入背景
- `timeout`（秒，預設 `tools.exec.timeoutSec`）：在此逾時後終止行程；只有在要停用該次呼叫的 exec 行程逾時時，才設定 `timeout: 0`
- `elevated`（布林值）：如果已啟用/允許 elevated 模式，則在沙盒外執行（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）
- 需要真正的 TTY？設定 `pty: true`。
- `workdir`、`env`

行為：

- 前景執行會直接回傳輸出。
- 轉入背景時（明確指定或逾時），工具會回傳 `status: "running"` + `sessionId` 以及簡短尾端輸出。
- 背景和 `yieldMs` 執行會繼承 `tools.exec.timeoutSec`，除非該次呼叫提供明確的 `timeout`。
- 輸出會保留在記憶體中，直到工作階段被輪詢或清除。
- 如果不允許使用 `process` 工具，`exec` 會同步執行並忽略 `yieldMs`/`background`。
- 產生的 exec 命令會收到 `OPENCLAW_SHELL=exec`，供感知情境的 shell/profile 規則使用。
- 對於現在開始的長時間執行工作，啟動一次，並在啟用時依賴自動
  完成喚醒，前提是命令有輸出或失敗。
- 如果無法使用自動完成喚醒，或你需要確認某個無輸出但乾淨結束的命令
  是否已安靜成功，請使用 `process` 確認完成。
- 不要用 `sleep` 迴圈或重複輪詢來模擬提醒或延遲後續動作；
  未來工作請使用排程。

## 子行程橋接

在 exec/process 工具之外產生長時間執行的子行程時（例如命令列介面重新產生或閘道輔助程式），請附加子行程橋接輔助工具，讓終止訊號能被轉發，並在結束/錯誤時分離監聽器。這可避免 systemd 上出現孤兒行程，並讓各平台的關閉行為保持一致。

環境覆寫：

- `OPENCLAW_BASH_YIELD_MS`：預設 yield（毫秒）
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`：記憶體內輸出上限（字元）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每個串流的待處理 stdout/stderr 上限（字元）
- `OPENCLAW_BASH_JOB_TTL_MS`：已完成工作階段的 TTL（毫秒，限制在 1 分鐘至 3 小時）
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`：可寫入背景工作階段被標記為可能正在等待輸入前的閒置輸出門檻（預設 15000 毫秒）

設定（偏好）：

- `tools.exec.backgroundMs`（預設 10000）
- `tools.exec.timeoutSec`（預設 1800）
- `tools.exec.cleanupMs`（預設 1800000）
- `tools.exec.notifyOnExit`（預設 true）：背景化 exec 結束時，將系統事件加入佇列並要求心跳偵測。
- `tools.exec.notifyOnExitEmptySuccess`（預設 false）：為 true 時，也會為沒有產生輸出的成功背景化執行加入完成事件。

## process 工具

動作：

- `list`：執行中 + 已完成的工作階段
- `poll`：排出某個工作階段的新輸出（也會回報結束狀態）
- `log`：讀取彙總輸出並顯示輸入復原提示（支援 `offset` + `limit`）
- `write`：傳送 stdin（`data`，選用 `eof`）
- `send-keys`：將明確的按鍵 token 或位元組傳送至 PTY 支援的工作階段
- `submit`：將 Enter / carriage return 傳送至 PTY 支援的工作階段
- `paste`：傳送文字常值，可選擇以 bracketed paste 模式包裝
- `kill`：終止背景工作階段
- `clear`：從記憶體中移除已完成的工作階段
- `remove`：若正在執行則終止，否則若已完成則清除

注意事項：

- 只有背景化的工作階段會被列出/持久保存在記憶體中。
- 行程重新啟動時會遺失工作階段（沒有磁碟持久化）。
- 工作階段記錄只有在你執行 `process poll/log` 且工具結果被記錄時，才會儲存到聊天歷史。
- `process` 以每個代理程式為範圍；它只看得到由該代理程式啟動的工作階段。
- 使用 `poll` / `log` 查看狀態、記錄、安靜成功確認，或在無法使用自動完成喚醒時
  確認完成。
- 在復原互動式命令列介面前使用 `log`，讓目前逐字稿、
  stdin 狀態與輸入等待提示能一起顯示。
- 需要輸入或介入時，使用 `write` / `send-keys` / `submit` / `paste` / `kill`。
- `process list` 會包含衍生的 `name`（命令動詞 + 目標），方便快速掃描。
- `process list`、`poll` 和 `log` 只有在工作階段仍有可寫入 stdin，且閒置時間超過
  輸入等待門檻時，才會回報 `waitingForInput`。
- `process log` 使用以行為基礎的 `offset`/`limit`。
- 同時省略 `offset` 和 `limit` 時，會回傳最後 200 行並包含分頁提示。
- 提供 `offset` 且省略 `limit` 時，會從 `offset` 回傳到結尾（不會限制為 200 行）。
- 輪詢是用於隨選狀態，不是等待迴圈排程。如果工作應該稍後發生，
  請改用排程。

## 範例

執行長時間任務並稍後輪詢：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

在傳送輸入前檢查互動式工作階段：

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

立即在背景啟動：

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

提交目前行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上文字常值：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相關

- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)
