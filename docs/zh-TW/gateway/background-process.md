---
read_when:
    - 新增或修改背景執行行為
    - 偵錯長時間執行的 exec 任務
summary: 背景 exec 執行與行程管理
title: 背景執行與程序工具
x-i18n:
    generated_at: "2026-04-30T03:04:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# 背景 Exec + Process 工具

OpenClaw 透過 `exec` 工具執行 shell 指令，並將長時間執行的工作保留在記憶體中。`process` 工具管理這些背景工作階段。

## exec 工具

主要參數：

- `command`（必填）
- `yieldMs`（預設 10000）：超過此延遲後自動轉入背景
- `background`（布林值）：立即轉入背景
- `timeout`（秒，預設 `tools.exec.timeoutSec`）：在此逾時後終止程序；只有在要停用該次呼叫的 exec 程序逾時時，才設定 `timeout: 0`
- `elevated`（布林值）：若 elevated 模式已啟用/允許，則在 sandbox 外執行（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）
- 需要真正的 TTY？設定 `pty: true`。
- `workdir`、`env`

行為：

- 前景執行會直接回傳輸出。
- 轉入背景時（明確指定或逾時），工具會回傳 `status: "running"` + `sessionId` 以及一小段尾端輸出。
- 背景和 `yieldMs` 執行會繼承 `tools.exec.timeoutSec`，除非該次呼叫提供明確的 `timeout`。
- 輸出會保留在記憶體中，直到該工作階段被輪詢或清除。
- 如果不允許使用 `process` 工具，`exec` 會同步執行並忽略 `yieldMs`/`background`。
- 產生的 exec 指令會收到 `OPENCLAW_SHELL=exec`，以供情境感知的 shell/profile 規則使用。
- 對於現在啟動的長時間工作，啟動一次即可，並在自動完成喚醒啟用且指令產生輸出或失敗時依賴它。
- 如果無法使用自動完成喚醒，或你需要確認某個無輸出且正常結束的指令是否安靜成功，請使用 `process` 確認完成。
- 不要使用 `sleep` 迴圈或重複輪詢來模擬提醒或延遲後續動作；未來的工作請使用 cron。

## 子程序橋接

在 exec/process 工具之外產生長時間執行的子程序時（例如 CLI 重新產生程序或 Gateway 輔助程式），請附加子程序橋接輔助工具，以便轉送終止訊號，並在退出/錯誤時卸離監聽器。這可避免 systemd 上出現孤立程序，並讓各平台的關閉行為保持一致。

環境覆寫：

- `PI_BASH_YIELD_MS`：預設讓出時間（毫秒）
- `PI_BASH_MAX_OUTPUT_CHARS`：記憶體內輸出上限（字元）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每個串流的待處理 stdout/stderr 上限（字元）
- `PI_BASH_JOB_TTL_MS`：已完成工作階段的 TTL（毫秒，限制在 1m–3h）

設定（建議）：

- `tools.exec.backgroundMs`（預設 10000）
- `tools.exec.timeoutSec`（預設 1800）
- `tools.exec.cleanupMs`（預設 1800000）
- `tools.exec.notifyOnExit`（預設 true）：背景 exec 結束時，將系統事件加入佇列並請求 Heartbeat。
- `tools.exec.notifyOnExitEmptySuccess`（預設 false）：為 true 時，也會為沒有產生輸出的成功背景執行加入完成事件。

## process 工具

動作：

- `list`：執行中 + 已完成的工作階段
- `poll`：排出某個工作階段的新輸出（也會報告退出狀態）
- `log`：讀取彙總輸出（支援 `offset` + `limit`）
- `write`：傳送 stdin（`data`，可選 `eof`）
- `send-keys`：將明確的按鍵 token 或位元組傳送到 PTY 支援的工作階段
- `submit`：將 Enter / carriage return 傳送到 PTY 支援的工作階段
- `paste`：傳送文字原文，可選擇以 bracketed paste 模式包覆
- `kill`：終止背景工作階段
- `clear`：從記憶體移除已完成的工作階段
- `remove`：若正在執行則終止，否則若已完成則清除

注意事項：

- 只有背景工作階段會列出/持久保留在記憶體中。
- 程序重新啟動時會遺失工作階段（無磁碟持久化）。
- 只有在你執行 `process poll/log` 且工具結果被記錄時，工作階段日誌才會儲存到聊天歷史。
- `process` 以每個代理程式為作用域；它只會看到由該代理程式啟動的工作階段。
- 使用 `poll` / `log` 取得狀態、日誌、安靜成功確認，或在無法使用自動完成喚醒時確認完成。
- 需要輸入或介入時，使用 `write` / `send-keys` / `submit` / `paste` / `kill`。
- `process list` 包含衍生的 `name`（指令動詞 + 目標），方便快速掃描。
- `process log` 使用以行為基礎的 `offset`/`limit`。
- 同時省略 `offset` 和 `limit` 時，會回傳最後 200 行並包含分頁提示。
- 提供 `offset` 且省略 `limit` 時，會從 `offset` 回傳到結尾（不限制為 200 行）。
- 輪詢是用於隨需狀態，而不是等待迴圈排程。如果工作應該稍後發生，請改用 cron。

## 範例

執行長時間工作並稍後輪詢：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
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

提交目前這一行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上文字原文：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相關

- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)
