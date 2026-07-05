---
read_when:
    - 新增或修改背景執行行為
    - 偵錯長時間執行的 exec 任務
summary: 背景執行與程序管理
title: 背景執行與處理程序工具
x-i18n:
    generated_at: "2026-07-05T11:16:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a4cd16585ee31038f5a9849add94ddc5056591d2f04523375b0a3f570a301c6
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw 透過 `exec` 工具執行 shell 命令，並將長時間執行的工作保留在記憶體中。`process` 工具會管理這些背景工作階段。

## exec 工具

參數：

| 參數         | 說明                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `command`    | 必填。要執行的 shell 命令。                                                                                                                           |
| `workdir`    | 工作目錄；省略時使用預設 cwd。                                                                                                                        |
| `env`        | 命令的額外環境變數。                                                                                                                                   |
| `yieldMs`    | 背景化前等待的毫秒數（預設 10000）。                                                                                                                   |
| `background` | 立即在背景執行。                                                                                                                                       |
| `timeout`    | 逾時秒數（預設 `tools.exec.timeoutSec`）；到期時終止程序。設定 `timeout: 0` 可停用該次呼叫的 exec 程序逾時。 |
| `pty`        | 可用時在偽終端機中執行（需要 TTY 的命令列介面、程式撰寫代理）。                                                                                       |
| `elevated`   | 如果已啟用/允許提升模式，則在沙箱外執行（預設為 `gateway`，或當 exec 目標為 `node` 時使用 `node`）。                                                   |
| `host`       | Exec 目標：`auto`、`sandbox`、`gateway` 或 `node`。                                                                                                    |
| `node`       | 節點 ID/名稱，搭配 `host: "node"` 使用。                                                                                                               |

行為：

- 前景執行會直接傳回輸出。
- 當背景化時（明確指定或透過 `yieldMs` 逾時），工具會傳回 `status: "running"` + `sessionId` 以及簡短的輸出尾端。
- 背景化和 `yieldMs` 執行會繼承 `tools.exec.timeoutSec`，除非該次呼叫傳入明確的 `timeout`。
- 輸出會保留在記憶體中，直到工作階段被輪詢或清除。
- 如果不允許使用 `process` 工具，`exec` 會同步執行並忽略 `yieldMs`/`background`。
- 產生的 exec 命令會收到 `OPENCLAW_SHELL=exec`，用於具備情境感知的 shell/profile 規則。
- 對於現在開始的長時間工作：只啟動一次，並在命令產生輸出或失敗後，仰賴自動完成喚醒（若已啟用）。
- 如果自動完成喚醒不可用，或你需要確認一個乾淨結束但沒有輸出的命令是否靜默成功，請使用 `process` 輪詢。
- 不要用 `sleep` 迴圈或重複輪詢來模擬提醒或延遲後續動作 —— 未來工作請使用排程。

### 環境覆寫

| 變數                                     | 效果                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | 背景化前的預設等待時間（毫秒）。預設 10000，限制在 10-120000。                                                  |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | 記憶體內輸出上限（字元）。                                                                                       |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | 每個串流的待處理 stdout/stderr 上限（字元）。                                                                    |
| `OPENCLAW_BASH_JOB_TTL_MS`               | 已完成工作階段的 TTL（毫秒），限制在 1 分鐘到 3 小時。                                                          |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | 可寫入背景工作階段被標記為可能正在等待輸入前的閒置輸出門檻。預設 15000。                                        |

### 設定（優先於環境覆寫）

| 鍵                                    | 預設    | 效果                                                                          |
| ------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | 與 `OPENCLAW_BASH_YIELD_MS` 相同。                                            |
| `tools.exec.timeoutSec`               | 1800    | 每次呼叫的預設逾時。                                                          |
| `tools.exec.cleanupMs`                | 1800000 | 與 `OPENCLAW_BASH_JOB_TTL_MS` 相同。                                          |
| `tools.exec.notifyOnExit`             | true    | 當背景化的 exec 結束時，將系統事件排入佇列並請求心跳偵測。                   |
| `tools.exec.notifyOnExitEmptySuccess` | false   | 也為沒有輸出的成功背景執行排入完成事件。                                      |

## 子程序橋接

在 exec/process 工具外產生長時間執行的子程序時（命令列介面重新啟動、閘道輔助程式），請附加子程序橋接輔助程式，讓終止訊號能轉送，並在結束/錯誤時卸離監聽器。這可避免 systemd 上出現孤兒程序，並讓各平台的關閉行為保持一致。

## process 工具

動作：

| 動作        | 效果                                                                          |
| ----------- | ----------------------------------------------------------------------------- |
| `list`      | 執行中 + 已完成的工作階段。                                                   |
| `poll`      | 擷取工作階段的新輸出（也會回報結束狀態）。                                    |
| `log`       | 讀取彙總輸出和輸入復原提示。支援 `offset` + `limit`。                         |
| `write`     | 傳送 stdin（`data`，可選 `eof`）。                                             |
| `send-keys` | 將明確的按鍵 token 或位元組傳送到以 PTY 為基礎的工作階段。                    |
| `submit`    | 將 Enter/歸位字元傳送到以 PTY 為基礎的工作階段。                              |
| `paste`     | 傳送純文字，可選擇包在 bracketed paste 模式中。                               |
| `kill`      | 終止背景工作階段。                                                            |
| `clear`     | 從記憶體中移除已完成的工作階段。                                              |
| `remove`    | 若正在執行則終止，否則在已完成時清除。                                        |

注意事項：

- 只有背景化的工作階段會被列出/持久保留 —— 僅在記憶體中，不會寫入磁碟。程序重新啟動後工作階段會遺失。
- 只有在你執行 `process poll`/`log` 且工具結果被記錄時，工作階段記錄才會儲存到聊天歷史。
- `process` 以每個代理為範圍；它只看得到該代理啟動的工作階段。
- 當自動完成喚醒不可用時，使用 `poll`/`log` 取得狀態、記錄或完成確認。
- 在復原互動式命令列介面前使用 `log`，讓目前逐字稿、stdin 狀態和輸入等待提示能一起顯示。
- 需要輸入或介入時，使用 `write`/`send-keys`/`submit`/`paste`/`kill`。
- `process list` 包含衍生的 `name`（命令動詞 + 目標），便於快速掃描。
- `process list`、`poll` 和 `log` 只會在工作階段仍有可寫入的 stdin，且閒置時間超過輸入等待門檻時，回報 `waitingForInput`（預設 15000 ms，`OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`）。
- `process log` 使用以行為基礎的 `offset`/`limit`。兩者都省略時，會傳回最後 200 行並附上分頁提示。設定 `offset` 但未設定 `limit` 時，會從 `offset` 傳回到結尾（不限制為 200）。
- `poll` 的 `timeout` 最多等待指定毫秒數後傳回；超過 30000 的值會被限制為 30000。
- 輪詢用於隨需狀態，而不是等待迴圈排程。如果工作應該稍後發生，請使用排程。

## 範例

執行長工作並稍後輪詢：

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

送出目前行：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼上純文字：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 相關

- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)
